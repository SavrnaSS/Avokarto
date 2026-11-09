import pg from "pg";
import type { Pool, PoolClient, QueryResultRow } from "pg";

const { Client, Pool: PgPool, types } = pg;

// pg's default parser for DATE columns (OID 1082) builds a JS Date at LOCAL
// midnight, which then serializes to a different calendar day in UTC
// whenever the server isn't running in UTC (e.g. IST is UTC+5:30, so local
// midnight becomes 18:30 the PREVIOUS day in UTC) - a well-known pg gotcha.
// DATE columns have no time component to begin with, so there's never a
// reason to round-trip them through a JS Date; returning the raw
// "YYYY-MM-DD" string PostgreSQL sent avoids the shift entirely. This
// affects every `date` column in the schema (customers.date_of_birth,
// coupons.starts_at/ends_at, ...), not just one call site.
types.setTypeParser(1082, (value: string) => value);

const DATABASE_CONNECTION_ERROR_CODES = new Set([
	"EAI_AGAIN",
	"EMAXCONNSESSION", // Supabase/Supavisor session pool exhausted
	"ECONNREFUSED",
	"ECONNRESET",
	"EHOSTUNREACH",
	"ENETUNREACH",
	"ENOTFOUND",
	"EPIPE",
	"ERR_SOCKET_CLOSED",
	"ETIMEDOUT",
	"53300", // too_many_connections
	"57P01", // admin_shutdown
	"57P02", // crash_shutdown
	"57P03", // cannot_connect_now
]);

type DatabaseRuntime = typeof globalThis & {
	__unimartDatabasePool?: Pool;
};

// Next.js can re-evaluate server modules during development. Keeping the pool
// in module scope creates another set of PostgreSQL sessions after each hot
// reload while the previous pool waits for its idle timeout. Store it on the
// process global instead so every copy of this module shares the same cap.
const databaseRuntime = globalThis as DatabaseRuntime;

function positiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function databaseConnectionTimeoutMillis() {
	return positiveInteger(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 5_000);
}

export function getDatabaseConnectionErrorCode(error: unknown) {
	const pending = [error];
	const visited = new Set<unknown>();

	while (pending.length) {
		const current = pending.shift();

		if (
			(!current || (typeof current !== "object" && typeof current !== "function")) ||
			visited.has(current)
		) {
			continue;
		}

		visited.add(current);
		const candidate = current as {
			cause?: unknown;
			code?: unknown;
			errors?: unknown;
			message?: unknown;
		};
		const code = typeof candidate.code === "string" ? candidate.code : null;

		if (
			code &&
			(DATABASE_CONNECTION_ERROR_CODES.has(code) || code.startsWith("08"))
		) {
			return code;
		}

		if (
			typeof candidate.message === "string" &&
			/\btenant(?:\/user| or user)(?:\s+\S+)?\s+not found\b/i.test(candidate.message)
		) {
			// Supabase's pooler reports tenant lookup failures as XX000,
			// which is also used for unrelated internal PostgreSQL errors.
			return "TENANT_NOT_FOUND";
		}

		if (
			typeof candidate.message === "string" &&
			/(?:EMAXCONNSESSION|max clients reached|too many connections|(?:connect|connection).*(?:closed|terminated|timed? ?out)|query read timeout|timeout expired)/i.test(
				candidate.message,
			)
		) {
			return candidate.message.includes("EMAXCONNSESSION")
				? "EMAXCONNSESSION"
				: (code ?? "CONNECTION_FAILURE");
		}

		if (candidate.cause) {
			pending.push(candidate.cause);
		}

		if (Array.isArray(candidate.errors)) {
			pending.push(...candidate.errors);
		}
	}

	return null;
}

export class BackendConfigurationError extends Error {
	code = "BACKEND_NOT_CONFIGURED";

	constructor(message = "DATABASE_URL is required for backend API routes.") {
		super(message);
		this.name = "BackendConfigurationError";
	}
}

export function hasDatabaseConfig() {
	return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDatabaseSsl(databaseUrl: string) {
	if (process.env.DATABASE_SSL === "false") {
		return undefined;
	}

	if (process.env.DATABASE_SSL === "true") {
		return { rejectUnauthorized: false };
	}

	if (
		databaseUrl.includes("localhost") ||
		databaseUrl.includes("127.0.0.1")
	) {
		return undefined;
	}

	return { rejectUnauthorized: false };
}

export function getPool() {
	const databaseUrl = process.env.DATABASE_URL?.trim();

	if (!databaseUrl) {
		throw new BackendConfigurationError();
	}

	if (!databaseRuntime.__unimartDatabasePool) {
		const pool = new PgPool({
			connectionString: databaseUrl,
			max: positiveInteger(process.env.DATABASE_POOL_MAX, 10),
			ssl: getDatabaseSsl(databaseUrl),
			connectionTimeoutMillis: databaseConnectionTimeoutMillis(),
			// Without TCP keepalive, a connection silently killed by a network
			// change (NAT/router timeout, brief connectivity drop over a
			// long-running server process) looks perfectly healthy to the
			// pool - it only discovers the connection is dead when a real
			// query is attempted on it, surfacing as an ETIMEDOUT deep inside
			// request handling instead of the pool recycling it beforehand.
			keepAlive: true,
			keepAliveInitialDelayMillis: 10_000,
			// Recycle connections that have sat idle a while, on top of
			// keepalive - a second line of defense against the same failure
			// mode.
			idleTimeoutMillis: 30_000,
		});

		// A dead/reset connection sitting idle in the pool emits its error
		// here, not at the query call site - without a listener that's an
		// unhandled 'error' event, which crashes the whole Node process (this
		// is what turned one stale connection into every in-flight request
		// failing at once). Logging and letting the pool evict+replace the
		// client is the correct recovery.
		pool.on("error", (error) => {
			console.error("Unexpected idle client error on the pg pool.", error);
		});

		databaseRuntime.__unimartDatabasePool = pool;
	}

	return databaseRuntime.__unimartDatabasePool;
}

export async function dbQuery<T extends QueryResultRow>(
	text: string,
	params: unknown[] = [],
) {
	return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
	callback: (client: PoolClient) => Promise<T>,
) {
	const client = await getPool().connect();

	try {
		await client.query("BEGIN");
		const result = await callback(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

/**
 * The connection for work that needs its own PostgreSQL session - the
 * realtime LISTEN client (and migrations, in scripts/). With Supabase,
 * DATABASE_URL can point at the transaction pooler (port 6543), which
 * shares server connections between queries but can't hold a LISTEN; this
 * then points at the session pooler (port 5432). Unset, DATABASE_URL is used.
 */
function sessionDatabaseUrl() {
	return process.env.DATABASE_SESSION_URL?.trim() || process.env.DATABASE_URL?.trim();
}

export function createRealtimeClient() {
	const databaseUrl = sessionDatabaseUrl();

	if (!databaseUrl) {
		throw new BackendConfigurationError();
	}

	return new Client({
		connectionString: databaseUrl,
		ssl: getDatabaseSsl(databaseUrl),
		connectionTimeoutMillis: databaseConnectionTimeoutMillis(),
		query_timeout: databaseConnectionTimeoutMillis(),
		keepAlive: true,
		keepAliveInitialDelayMillis: 10_000,
	});
}
