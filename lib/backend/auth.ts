import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";

export const adminSessionCookie = "unimart_session";

const sessionSchema = z.object({
	email: z.email(),
	name: z.string(),
	role: z.literal("admin"),
	sub: z.string(),
});

export type AdminSession = z.infer<typeof sessionSchema>;

type AdminUserRow = {
	email: string;
	id: string;
	name: string;
	password_hash: string;
	role: string;
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

export function getSessionMaxAge() {
	const days = Number(process.env.ADMIN_SESSION_DAYS ?? "7");
	return Math.max(1, days) * 24 * 60 * 60;
}

// `next start` always sets NODE_ENV=production, even for local/HTTP testing,
// so gating the cookie's Secure flag on NODE_ENV forces it on regardless of
// whether the site is actually served over HTTPS. Chrome quietly exempts
// "localhost" from the usual "Secure cookies need HTTPS" rule, but Safari
// does not extend that exception as reliably - a Secure cookie issued over
// plain http://localhost gets silently dropped there, so the client thinks
// it's signed in (from the response body) while no session actually
// persists server-side. Deriving Secure from the configured site URL
// instead reflects reality regardless of NODE_ENV or browser.
function isHttpsDeployment() {
	return Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim().startsWith("https://"));
}

/** `maxAge` (seconds) is the admin's session length from Settings -> Permissions; the env default otherwise. */
export function getSessionCookieOptions(maxAge = getSessionMaxAge()) {
	return {
		httpOnly: true,
		maxAge,
		path: "/",
		sameSite: "lax" as const,
		secure: isHttpsDeployment(),
	};
}

export async function createAdminSessionToken(session: AdminSession, maxAge = getSessionMaxAge()) {
	return new SignJWT({
		email: session.email,
		name: session.name,
		role: session.role,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(session.sub)
		.setIssuedAt()
		.setExpirationTime(`${maxAge}s`)
		.sign(getJwtSecret());
}

export async function verifyAdminSessionToken(token?: string) {
	if (!token) {
		throw new HttpError(401, "Admin sign in required.", "UNAUTHENTICATED");
	}

	try {
		const { payload } = await jwtVerify(token, getJwtSecret());
		return sessionSchema.parse({
			email: payload.email,
			name: payload.name,
			role: payload.role,
			sub: payload.sub,
		});
	} catch {
		throw new HttpError(401, "Admin sign in required.", "UNAUTHENTICATED");
	}
}

export async function requireAdmin(request: NextRequest) {
	const session = await verifyAdminSessionToken(
		request.cookies.get(adminSessionCookie)?.value,
	);

	if (session.role !== "admin") {
		throw new HttpError(403, "Admin access required.", "FORBIDDEN");
	}

	return session;
}

export async function authorizeAdmin(email: string, password: string) {
	const normalizedEmail = email.trim().toLowerCase();
	const result = await dbQuery<AdminUserRow>(
		`
			SELECT id, email, password_hash, name, role, status
			FROM app_users
			WHERE lower(email) = lower($1)
			LIMIT 1
		`,
		[normalizedEmail],
	);

	const user = result.rows[0];

	if (!user || user.role !== "admin" || user.status !== "active") {
		throw new HttpError(
			401,
			"Invalid email or password.",
			"INVALID_CREDENTIALS",
		);
	}

	const passwordMatches = await bcrypt.compare(password, user.password_hash);

	if (!passwordMatches) {
		throw new HttpError(
			401,
			"Invalid email or password.",
			"INVALID_CREDENTIALS",
		);
	}

	return {
		email: user.email,
		name: user.name,
		role: "admin",
		sub: user.id,
	} satisfies AdminSession;
}
