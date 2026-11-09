import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { initialsOf, readableOn } from "@/components/stores/storeTheme";
import { getPublicStoreBranding, getPublicStoreProduct } from "@/lib/backend/resellers";
import { shareImageDataUrl } from "@/lib/backend/share-image-assets";
import { activeDomainForHandle } from "@/lib/backend/store-domains";
import { siteUrl } from "@/lib/seo";
import { formatCurrency } from "@/lib/price";

/*
 * Branded share images for reseller stores, in the store's own colours:
 *   ?handle=x                      link preview for the store   (1200×630)
 *   ?handle=x&product=slug         link preview for a product   (1200×630)
 *   ?handle=x&product=slug&format=story   WhatsApp/Instagram story (1080×1920)
 * Used as og:image by the store pages and downloadable from the seller dashboard.
 */

// Same currency as the storefront.
const price = (value: number) => formatCurrency(value, "USD");
const CACHE = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

function clip(text: string, max: number) {
	return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

async function storeAddress(handle: string) {
	const domain = await activeDomainForHandle(handle).catch(() => null);
	if (domain) return domain;
	return `${new URL(siteUrl()).host}/store/${handle}`;
}

function Logo({ accent, logo, name, size }: { accent: string; logo: string | null; name: string; size: number }) {
	return logo ? (
		// eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
		<img alt="" height={size} src={logo} style={{ background: "#fff", borderRadius: size / 4, objectFit: "contain" }} width={size} />
	) : (
		<div style={{ alignItems: "center", background: accent, borderRadius: size / 4, color: readableOn(accent), display: "flex", fontSize: size * 0.42, fontWeight: 800, height: size, justifyContent: "center", width: size }}>
			{initialsOf(name)}
		</div>
	);
}

export async function GET(request: NextRequest) {
	const params = request.nextUrl.searchParams;
	const handle = (params.get("handle") ?? "").toLowerCase();
	const productSlug = params.get("product");
	const story = params.get("format") === "story";
	if (!/^[a-z0-9-]{3,60}$/.test(handle)) return new Response("Not found", { status: 404 });

	const data = productSlug ? await getPublicStoreProduct(handle, productSlug) : null;
	const store = data?.store ?? (await getPublicStoreBranding(handle));
	if (!store || (productSlug && !data)) return new Response("Not found", { status: 404 });

	const accent = store.accentColor || "#1f7a3f";
	const onAccent = readableOn(accent);
	const address = await storeAddress(handle);
	const headers = { "Cache-Control": CACHE };

	if (story && data) {
		const [logo, photo] = await Promise.all([
			shareImageDataUrl(store.logoUrl, { height: 192, transparent: true, width: 192 }),
			shareImageDataUrl(data.product.imageUrl, { height: 920, width: 920 }),
		]);
		return new ImageResponse(
			<div style={{ background: accent, color: onAccent, display: "flex", flexDirection: "column", fontFamily: "sans-serif", height: "100%", padding: "120px 80px 110px", width: "100%" }}>
				<div style={{ alignItems: "center", display: "flex", gap: 28 }}>
					<Logo accent={onAccent === "#ffffff" ? "#ffffff33" : "#00000022"} logo={logo} name={store.name} size={96} />
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ fontSize: 50, fontWeight: 800 }}>{clip(store.name, 26)}</span>
						{store.tagline ? <span style={{ fontSize: 30, opacity: 0.85 }}>{clip(store.tagline, 44)}</span> : null}
					</div>
				</div>
				<div style={{ background: "#fff", borderRadius: 48, display: "flex", marginTop: 70, overflow: "hidden", padding: 0, width: 920, height: 920 }}>
					{/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
					{photo ? <img alt="" height={920} src={photo} style={{ objectFit: "cover" }} width={920} /> : null}
				</div>
				<span style={{ display: "flex", fontSize: 58, fontWeight: 800, lineHeight: 1.15, marginTop: 56 }}>{clip(data.product.productName, 70)}</span>
				<span style={{ display: "flex", fontSize: 84, fontWeight: 900, marginTop: 18 }}>{price(data.product.price)}</span>
				<div style={{ display: "flex", flex: 1 }} />
				<div style={{ alignItems: "center", background: onAccent, borderRadius: 999, color: accent, display: "flex", fontSize: 38, fontWeight: 800, justifyContent: "center", padding: "30px 40px" }}>
					Order now · {clip(address, 40)}
				</div>
			</div>,
			{ headers, height: 1920, width: 1080 },
		);
	}

	if (data) {
		const [logo, photo] = await Promise.all([
			shareImageDataUrl(store.logoUrl, { height: 128, transparent: true, width: 128 }),
			shareImageDataUrl(data.product.imageUrl, { height: 630, width: 630 }),
		]);
		return new ImageResponse(
			<div style={{ background: "#ffffff", display: "flex", fontFamily: "sans-serif", height: "100%", width: "100%" }}>
				<div style={{ background: "#f4f4f5", display: "flex", height: 630, width: 630 }}>
					{/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
					{photo ? <img alt="" height={630} src={photo} style={{ objectFit: "cover" }} width={630} /> : null}
				</div>
				<div style={{ borderLeft: `14px solid ${accent}`, color: "#111", display: "flex", flex: 1, flexDirection: "column", padding: "56px 48px" }}>
					<div style={{ alignItems: "center", display: "flex", gap: 18 }}>
						<Logo accent={accent} logo={logo} name={store.name} size={64} />
						<span style={{ fontSize: 30, fontWeight: 700 }}>{clip(store.name, 22)}</span>
					</div>
					<span style={{ display: "flex", fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginTop: 44 }}>{clip(data.product.productName, 60)}</span>
					<span style={{ color: accent === "#ffffff" ? "#111" : accent, display: "flex", fontSize: 64, fontWeight: 900, marginTop: 20 }}>{price(data.product.price)}</span>
					<div style={{ display: "flex", flex: 1 }} />
					<span style={{ color: "#52525b", display: "flex", fontSize: 24 }}>{clip(address, 44)}</span>
				</div>
			</div>,
			{ headers, height: 630, width: 1200 },
		);
	}

	const [logo, banner] = await Promise.all([
		shareImageDataUrl(store.logoUrl, { height: 192, transparent: true, width: 192 }),
		shareImageDataUrl(store.bannerUrl, { height: 630, width: 1200 }),
	]);
	return new ImageResponse(
		<div style={{ background: accent, color: banner ? "#fff" : onAccent, display: "flex", fontFamily: "sans-serif", height: "100%", position: "relative", width: "100%" }}>
			{/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
			{banner ? <img alt="" height={630} src={banner} style={{ left: 0, objectFit: "cover", position: "absolute", top: 0 }} width={1200} /> : null}
			<div
				style={{
					background: banner ? "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.1) 100%)" : "transparent",
					display: "flex",
					flexDirection: "column",
					height: "100%",
					justifyContent: "center",
					padding: "0 80px",
					width: "100%",
				}}
			>
				<Logo accent={banner ? accent : onAccent === "#ffffff" ? "#ffffff33" : "#00000022"} logo={logo} name={store.name} size={120} />
				<span style={{ display: "flex", fontSize: 76, fontWeight: 900, letterSpacing: -2, marginTop: 34 }}>{clip(store.name, 28)}</span>
				{store.tagline ? <span style={{ display: "flex", fontSize: 34, marginTop: 10, opacity: 0.9 }}>{clip(store.tagline, 60)}</span> : null}
				<span style={{ display: "flex", fontSize: 26, fontWeight: 700, marginTop: 40, opacity: 0.85 }}>{clip(address, 50)}</span>
			</div>
		</div>,
		{ headers, height: 630, width: 1200 },
	);
}
