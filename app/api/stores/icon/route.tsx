import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { initialsOf, readableOn } from "@/components/stores/storeTheme";
import { getPublicStoreBranding } from "@/lib/backend/resellers";
import { shareImageDataUrl } from "@/lib/backend/share-image-assets";

/** Home-screen icon for a reseller store: its logo, or its initials on its colour. */
export async function GET(request: NextRequest) {
	const params = request.nextUrl.searchParams;
	const handle = (params.get("handle") ?? "").toLowerCase();
	const size = params.get("size") === "192" ? 192 : 512;
	// Maskable icons get cropped to a circle/squircle: keep the logo in the safe zone.
	const maskable = params.get("maskable") === "1";
	if (!/^[a-z0-9-]{3,60}$/.test(handle)) return new Response("Not found", { status: 404 });
	const store = await getPublicStoreBranding(handle);
	if (!store) return new Response("Not found", { status: 404 });

	const accent = store.accentColor || "#1f7a3f";
	const inner = Math.round(size * (maskable ? 0.62 : 0.84));
	const logo = await shareImageDataUrl(store.logoUrl, { height: inner, transparent: true, width: inner });

	return new ImageResponse(
		<div style={{ alignItems: "center", background: logo ? "#ffffff" : accent, color: readableOn(accent), display: "flex", fontFamily: "sans-serif", fontSize: size * 0.4, fontWeight: 800, height: "100%", justifyContent: "center", width: "100%" }}>
			{/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
			{logo ? <img alt="" height={inner} src={logo} style={{ objectFit: "contain" }} width={inner} /> : initialsOf(store.name)}
		</div>,
		{ headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }, height: size, width: size },
	);
}
