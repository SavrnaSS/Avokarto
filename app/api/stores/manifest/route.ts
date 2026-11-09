import type { NextRequest } from "next/server";
import { getPublicStoreBranding } from "@/lib/backend/resellers";
import { resolveStoreDomain } from "@/lib/backend/store-domains";

/*
 * Web app manifest for one reseller store, so shoppers can add it to their
 * home screen as its own app (its name, icon and colour). On the store's
 * custom domain the app starts at "/", on Avokarto at /store/<handle>.
 */
export async function GET(request: NextRequest) {
	const handle = (request.nextUrl.searchParams.get("handle") ?? "").toLowerCase();
	if (!/^[a-z0-9-]{3,60}$/.test(handle)) return new Response("Not found", { status: 404 });
	const store = await getPublicStoreBranding(handle);
	if (!store) return new Response("Not found", { status: 404 });

	const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || "";
	const onOwnDomain = (await resolveStoreDomain(host).catch(() => null)) === handle;
	const start = onOwnDomain ? "/" : `/store/${handle}`;
	const icon = (size: number, purpose: "any" | "maskable") => ({
		purpose,
		sizes: `${size}x${size}`,
		src: `/api/stores/icon?handle=${handle}&size=${size}${purpose === "maskable" ? "&maskable=1" : ""}`,
		type: "image/png",
	});

	const manifest = {
		background_color: "#ffffff",
		description: store.tagline || `Shop ${store.name}`,
		display: "standalone",
		icons: [icon(192, "any"), icon(512, "any"), icon(512, "maskable")],
		id: start,
		name: store.name,
		// Scope must contain start_url, which has no trailing slash on Avokarto.
		scope: start,
		short_name: store.name.length > 12 ? store.name.split(/\s+/)[0].slice(0, 12) : store.name,
		start_url: `${start}?source=app`,
		theme_color: store.accentColor || "#1f7a3f",
	};
	return new Response(JSON.stringify(manifest), {
		headers: { "Cache-Control": "public, max-age=300, s-maxage=600", "Content-Type": "application/manifest+json" },
	});
}
