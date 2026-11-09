import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";

/*
 * Custom domains for reseller stores.
 *
 * A seller adds e.g. shop.meerascloset.com, then creates two DNS records:
 *   TXT   _avokarto.shop.meerascloset.com  →  avokarto-verify=<token>   (ownership)
 *   CNAME shop.meerascloset.com            →  STORE_DOMAIN_TARGET          (routing)
 * Apex domains (meerascloset.com) can't use CNAME, so A records matching the
 * target's addresses are accepted instead. Only "active" domains are routed
 * (see proxy.ts) and only they may receive TLS certificates (see
 * app/api/domains/tls-check).
 */

export type StoreDomain = {
	domain: string;
	lastCheckedAt: string | null;
	lastError: string;
	status: "active" | "failed" | "pending";
	verificationToken: string;
	verifiedAt: string | null;
};

type DomainRow = {
	domain: string;
	last_checked_at: Date | null;
	last_error: string;
	status: StoreDomain["status"];
	verification_token: string;
	verified_at: Date | null;
};

function toDomain(row: DomainRow): StoreDomain {
	return {
		domain: row.domain,
		lastCheckedAt: row.last_checked_at?.toISOString() ?? null,
		lastError: row.last_error,
		status: row.status,
		verificationToken: row.verification_token,
		verifiedAt: row.verified_at?.toISOString() ?? null,
	};
}

/** Avokarto's own public host (from NEXT_PUBLIC_SITE_URL). */
export function primaryHost() {
	try {
		return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").hostname.toLowerCase();
	} catch {
		return "";
	}
}

/** Where sellers point their CNAME. Defaults to the main site host. */
export function domainTarget() {
	return (process.env.STORE_DOMAIN_TARGET?.trim().toLowerCase() || primaryHost() || "stores.avokarto.com").replace(/\.$/, "");
}

export function verificationRecordName(domain: string) {
	return `_avokarto.${domain}`;
}

export function verificationRecordValue(token: string) {
	return `avokarto-verify=${token}`;
}

const HOSTNAME = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Accepts "https://Shop.Example.com/path" and returns "shop.example.com", or throws a friendly error. */
export function normalizeDomain(input: string) {
	let value = input.trim().toLowerCase();
	value = value.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/:\d+$/, "").replace(/\.$/, "");
	if (!value) throw new HttpError(400, "Enter your domain, like shop.yourbrand.com.", "INVALID_DOMAIN", { field: "domain" });
	if (!HOSTNAME.test(value) || value.length > 253) {
		throw new HttpError(400, "That doesn't look like a domain. Use something like shop.yourbrand.com.", "INVALID_DOMAIN", { field: "domain" });
	}
	const own = [primaryHost(), domainTarget()].filter(Boolean);
	if (own.some((host) => value === host || value.endsWith(`.${host}`)) || /(^|\.)avokarto\./.test(value)) {
		throw new HttpError(400, "Use a domain you own, not an Avokarto address.", "INVALID_DOMAIN", { field: "domain" });
	}
	if (/(^|\.)(localhost|local|internal|test|example|invalid)$/.test(value)) {
		throw new HttpError(400, "Use a real, public domain.", "INVALID_DOMAIN", { field: "domain" });
	}
	return value;
}

const DOMAIN_COLUMNS = "domain, verification_token, status, last_error, last_checked_at, verified_at";

export async function getStoreDomain(storeId: string) {
	const result = await dbQuery<DomainRow>(`SELECT ${DOMAIN_COLUMNS} FROM reseller_store_domains WHERE store_id = $1`, [storeId]);
	return result.rows[0] ? toDomain(result.rows[0]) : null;
}

export async function setStoreDomain(storeId: string, rawDomain: string) {
	const domain = normalizeDomain(rawDomain);
	const token = randomBytes(16).toString("hex");
	try {
		// Replacing a store's domain starts verification over.
		const result = await dbQuery<DomainRow>(
			`
				INSERT INTO reseller_store_domains (store_id, domain, verification_token)
				VALUES ($1, $2, $3)
				ON CONFLICT (store_id) DO UPDATE SET
					domain = EXCLUDED.domain,
					verification_token = EXCLUDED.verification_token,
					status = 'pending', last_error = '', last_checked_at = NULL, verified_at = NULL
				RETURNING ${DOMAIN_COLUMNS}
			`,
			[storeId, domain, token],
		);
		forgetDomain(domain);
		return toDomain(result.rows[0]);
	} catch (error) {
		const pgError = error as { code?: string; constraint?: string };
		if (pgError?.code === "23505" && pgError.constraint === "reseller_store_domains_domain_key") {
			throw new HttpError(409, "That domain is already connected to another store.", "DOMAIN_TAKEN", { field: "domain" });
		}
		throw error;
	}
}

export async function removeStoreDomain(storeId: string) {
	const result = await dbQuery<{ domain: string }>(`DELETE FROM reseller_store_domains WHERE store_id = $1 RETURNING domain`, [storeId]);
	for (const row of result.rows) forgetDomain(row.domain);
}

type DnsCheck = { ok: boolean; problem: string };

async function checkOwnership(domain: string, token: string): Promise<DnsCheck> {
	const name = verificationRecordName(domain);
	try {
		const records = (await dns.resolveTxt(name)).map((chunks) => chunks.join(""));
		return records.includes(verificationRecordValue(token))
			? { ok: true, problem: "" }
			: { ok: false, problem: `The TXT record on ${name} doesn't contain the verification code yet.` };
	} catch {
		return { ok: false, problem: `No TXT record found on ${name} yet.` };
	}
}

async function checkRouting(domain: string): Promise<DnsCheck> {
	const target = domainTarget();
	try {
		const cnames = (await dns.resolveCname(domain)).map((name) => name.toLowerCase().replace(/\.$/, ""));
		if (cnames.includes(target)) return { ok: true, problem: "" };
		if (cnames.length) return { ok: false, problem: `${domain} points to ${cnames[0]}, not ${target}.` };
	} catch {
		// No CNAME (normal for an apex domain) - fall through to A records.
	}
	try {
		const [mine, theirs] = await Promise.all([dns.resolve4(domain), dns.resolve4(target)]);
		if (mine.some((address) => theirs.includes(address))) return { ok: true, problem: "" };
		return { ok: false, problem: `${domain} doesn't point to Avokarto yet. Add a CNAME to ${target}.` };
	} catch {
		return { ok: false, problem: `${domain} doesn't point anywhere yet. Add a CNAME to ${target}.` };
	}
}

/** Look up the DNS records and activate the domain when both checks pass. */
export async function checkStoreDomain(storeId: string) {
	const current = await getStoreDomain(storeId);
	if (!current) throw new HttpError(404, "Add a domain first.", "NO_DOMAIN");

	const [ownership, routing] = await Promise.all([
		checkOwnership(current.domain, current.verificationToken),
		checkRouting(current.domain),
	]);
	const active = ownership.ok && routing.ok;
	const problem = [ownership.problem, routing.problem].filter(Boolean).join(" ");

	const result = await dbQuery<DomainRow>(
		`
			UPDATE reseller_store_domains
			SET status = $2, last_error = $3, last_checked_at = now(),
				verified_at = CASE WHEN $2 = 'active' THEN COALESCE(verified_at, now()) ELSE NULL END
			WHERE store_id = $1
			RETURNING ${DOMAIN_COLUMNS}
		`,
		// A domain that was live and broke is "failed"; one never verified stays "pending".
		[storeId, active ? "active" : current.status === "active" ? "failed" : "pending", problem],
	);
	forgetDomain(current.domain);
	return toDomain(result.rows[0]);
}

/** The domain plus the exact DNS records the seller must create. */
export function withInstructions(domain: StoreDomain | null) {
	if (!domain) return { domain: null, records: [], target: domainTarget() };
	const apex = domain.domain.split(".").length === 2;
	return {
		domain,
		records: [
			{ name: domain.domain, purpose: "Points your domain at your Avokarto store", type: "CNAME", value: domainTarget() },
			{ name: verificationRecordName(domain.domain), purpose: "Proves you own the domain", type: "TXT", value: verificationRecordValue(domain.verificationToken) },
		],
		// Apex domains can't hold a CNAME at most DNS providers.
		apexNote: apex
			? `Root domains often can't use CNAME. If yours can't, use your provider's ALIAS/ANAME record to ${domainTarget()}, or connect a subdomain like shop.${domain.domain} instead.`
			: null,
		target: domainTarget(),
	};
}

/* ------------------------------------------------------------------------
 * Request routing (used by proxy.ts)
 * --------------------------------------------------------------------- */

// Best-effort per-process cache. Correctness never depends on it: entries
// expire quickly and changes evict their own domain on this instance.
const CACHE_TTL_MS = 60_000;
const routeCache = new Map<string, { expires: number; handle: string | null }>();

function forgetDomain(domain: string) {
	routeCache.delete(domain);
}

/** The store handle an active custom domain serves, or null. */
export async function resolveStoreDomain(host: string) {
	const domain = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
	if (!HOSTNAME.test(domain)) return null;
	const cached = routeCache.get(domain);
	if (cached && cached.expires > Date.now()) return cached.handle;

	const result = await dbQuery<{ handle: string }>(
		`
			SELECT s.handle
			FROM reseller_store_domains d
			JOIN reseller_stores s ON s.id = d.store_id
			WHERE d.domain = $1 AND d.status = 'active' AND s.status = 'active'
		`,
		[domain],
	);
	const handle = result.rows[0]?.handle ?? null;
	if (routeCache.size > 5000) routeCache.clear();
	routeCache.set(domain, { expires: Date.now() + CACHE_TTL_MS, handle });
	return handle;
}

/** Active custom domain for a store handle, for building share links. */
export async function activeDomainForHandle(handle: string) {
	const result = await dbQuery<{ domain: string }>(
		`
			SELECT d.domain FROM reseller_store_domains d
			JOIN reseller_stores s ON s.id = d.store_id
			WHERE s.handle = $1 AND d.status = 'active'
		`,
		[handle],
	);
	return result.rows[0]?.domain ?? null;
}
