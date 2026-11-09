import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";

export const customerSessionCookie = "unimart_customer_session";

const sessionSchema = z.object({
	email: z.email(),
	name: z.string(),
	sub: z.string(),
});

export type CustomerSession = z.infer<typeof sessionSchema>;

type CustomerRow = {
	email: string;
	id: string;
	name: string;
	password_hash: string | null;
	status: string;
};

function getJwtSecret() {
	const secret = process.env.JWT_SECRET?.trim();

	if (!secret || secret.length < 32) {
		throw new HttpError(
			503,
			"JWT_SECRET must be configured with at least 32 characters.",
			"AUTH_NOT_CONFIGURED",
		);
	}

	return new TextEncoder().encode(secret);
}

function getSessionMaxAge() {
	const days = Number(process.env.CUSTOMER_SESSION_DAYS ?? "30");
	return Math.max(1, days) * 24 * 60 * 60;
}

// See the matching comment in lib/backend/auth.ts - NODE_ENV is always
// "production" under `next start` regardless of protocol, so gating Secure
// on it forces the flag on even for plain-HTTP local/testing deployments.
// Safari (unlike Chrome) doesn't reliably exempt localhost from the
// Secure-cookies-need-HTTPS rule, so the cookie silently never persists
// there while the client optimistically believes it's signed in.
function isHttpsDeployment() {
	return Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim().startsWith("https://"));
}

export function getCustomerSessionCookieOptions() {
	return {
		httpOnly: true,
		maxAge: getSessionMaxAge(),
		path: "/",
		sameSite: "lax" as const,
		secure: isHttpsDeployment(),
	};
}

export async function createCustomerSessionToken(session: CustomerSession) {
	return new SignJWT({
		email: session.email,
		name: session.name,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(session.sub)
		.setIssuedAt()
		.setExpirationTime(`${getSessionMaxAge()}s`)
		.sign(getJwtSecret());
}

export async function verifyCustomerSessionToken(token?: string) {
	if (!token) {
		throw new HttpError(401, "Sign in required.", "UNAUTHENTICATED");
	}

	try {
		const { payload } = await jwtVerify(token, getJwtSecret());
		return sessionSchema.parse({
			email: payload.email,
			name: payload.name,
			sub: payload.sub,
		});
	} catch {
		throw new HttpError(401, "Sign in required.", "UNAUTHENTICATED");
	}
}

export async function requireCustomer(request: NextRequest) {
	return verifyCustomerSessionToken(
		request.cookies.get(customerSessionCookie)?.value,
	);
}

// Same shape as requireCustomer, but resolves to null instead of throwing -
// callers that just want to know "is anyone signed in" (e.g. the header,
// or the realtime route's topic gate) shouldn't have to catch an error for
// the common logged-out case.
export async function getOptionalCustomer(request: NextRequest) {
	try {
		return await requireCustomer(request);
	} catch {
		return null;
	}
}

export async function registerCustomer(
	name: string,
	email: string,
	password: string,
) {
	const normalizedEmail = email.trim().toLowerCase();

	// A historical guest row may own orders and profile data. An unverified
	// email address is not proof of ownership, so signup must never claim it.
	const existing = await dbQuery<CustomerRow>(
		"SELECT id, email, name, password_hash, status FROM customers WHERE lower(email) = lower($1) LIMIT 1",
		[normalizedEmail],
	);

	if (existing.rows[0]) {
		throw new HttpError(
			409,
			"An account with this email already exists.",
			"ACCOUNT_EXISTS",
		);
	}

	const passwordHash = await bcrypt.hash(password, 12);
	const result = await dbQuery<{ email: string; id: string; name: string }>(
		`
			INSERT INTO customers (name, email, password_hash, segment, status)
			VALUES ($1, $2, $3, 'Retail', 'active')
			ON CONFLICT (email)
			DO NOTHING
			RETURNING id::text, email, name
		`,
		[name.trim(), normalizedEmail, passwordHash],
	);
	const customer = result.rows[0];

	// A competing signup may have inserted after the read above. Let the
	// unique constraint arbitrate; never replace an existing password.
	if (!customer) {
		throw new HttpError(409, "An account with this email already exists.", "ACCOUNT_EXISTS");
	}

	return {
		email: customer.email,
		name: customer.name,
		sub: customer.id,
	} satisfies CustomerSession;
}

export async function authorizeCustomer(email: string, password: string) {
	const normalizedEmail = email.trim().toLowerCase();
	const result = await dbQuery<CustomerRow>(
		"SELECT id, email, name, password_hash, status FROM customers WHERE lower(email) = lower($1) LIMIT 1",
		[normalizedEmail],
	);
	const customer = result.rows[0];

	// "review" is an admin-held state (kept blocked, same as before) -
	// "deleted" is a self-service soft-delete, and a correct password is
	// exactly the "reactivation" Account Info's delete confirmation
	// promises, so it's allowed through and flipped back to active below.
	if (!customer || !customer.password_hash || customer.status === "review") {
		throw new HttpError(
			401,
			"Invalid email or password.",
			"INVALID_CREDENTIALS",
		);
	}

	const passwordMatches = await bcrypt.compare(
		password,
		customer.password_hash,
	);

	if (!passwordMatches) {
		throw new HttpError(
			401,
			"Invalid email or password.",
			"INVALID_CREDENTIALS",
		);
	}

	if (customer.status === "deleted") {
		await dbQuery("UPDATE customers SET status = 'active' WHERE id = $1", [
			customer.id,
		]);
	}

	return {
		email: customer.email,
		name: customer.name,
		sub: customer.id,
	} satisfies CustomerSession;
}
