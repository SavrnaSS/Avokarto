import { NextRequest } from "next/server";
import { resolveStoreDomain } from "@/lib/backend/store-domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * "May I issue a TLS certificate for this host?" - for an on-demand TLS
 * edge such as Caddy (`on_demand_tls { ask https://<site>/api/domains/tls-check }`).
 * 200 only for verified, active custom domains; anything else is refused so
 * nobody can make the server request certificates for arbitrary hostnames.
 */
export async function GET(request: NextRequest) {
	const domain = request.nextUrl.searchParams.get("domain") ?? "";
	try {
		const handle = await resolveStoreDomain(domain);
		return new Response(handle ? "ok" : "unknown domain", { status: handle ? 200 : 404 });
	} catch {
		return new Response("unavailable", { status: 503 });
	}
}
