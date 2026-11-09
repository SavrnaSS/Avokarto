"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import StoreHome, { type PublicListing } from "@/components/stores/StoreHome";
import StoreShell from "@/components/stores/StoreShell";
import type { PublicStore } from "@/lib/backend/resellers";
import type { SellLandingProduct } from "@/lib/backend/sell-landing";
import { resellerPrice } from "@/lib/resellerPricing";
import { isStoreTheme, STORE_THEME_INFO, type StoreTheme } from "@/lib/storeThemes";

// The margin the demo prices at until the page sends the seller's own.
const DEMO_MARGIN = 20;
const DEMO_HANDLE = "your-store";

/**
 * A store that doesn't exist yet, rendered by the real storefront (the same
 * StoreShell and StoreHome every seller store uses) with real catalog
 * products. The landing and /start embed it in an iframe and post the
 * theme, colour, name and margin being tried; all of it is applied here,
 * so it never depends on StoreShell's own preview path. View-only: links,
 * buttons and forms do nothing, so nobody can add a non-existent listing
 * to a cart.
 */
export default function DemoStorefront({
	initial = {},
	pricing,
	products,
	since,
}: {
	/** The look from the iframe URL, already validated - rendered on the server so the first paint matches. */
	initial?: { accent?: string | null; margin?: number; name?: string; theme?: StoreTheme };
	pricing: { maxMarginPercent: number; platformFeePercent: number };
	products: SellLandingProduct[];
	/** Fixed on the server, so the "since" date can't differ at hydration. */
	since: string;
}) {
	const [name, setName] = useState(initial.name ?? "Your Store");
	const [theme, setTheme] = useState<StoreTheme>(initial.theme ?? "minimal");
	const [accent, setAccent] = useState<string | null>(initial.accent ?? null);
	const [margin, setMargin] = useState(() => Math.max(0, Math.min(initial.margin ?? DEMO_MARGIN, pricing.maxMarginPercent)));

	// Same message the Theme Studio sends, plus the name typed on the landing.
	useEffect(() => {
		if (window.self === window.top) return;
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin || event.source !== window.parent) return;
			const data = event.data as { accent?: unknown; margin?: unknown; name?: unknown; source?: unknown; theme?: unknown } | null;
			if (data?.source !== "avk-theme-studio") return;
			if (isStoreTheme(data.theme)) setTheme(data.theme);
			if (typeof data.name === "string") setName(data.name.trim().slice(0, 60) || "Your Store");
			if (typeof data.accent === "string" && /^#[0-9a-f]{6}$/i.test(data.accent)) setAccent(data.accent);
			if (typeof data.margin === "number" && Number.isFinite(data.margin)) setMargin(Math.max(0, Math.min(data.margin, pricing.maxMarginPercent)));
		};
		window.addEventListener("message", onMessage);
		// Listening now - ask for the current look (covers any missed handshake).
		window.parent.postMessage({ source: "avk-store", type: "ready" }, window.location.origin);
		return () => window.removeEventListener("message", onMessage);
	}, [pricing.maxMarginPercent]);

	// View-only: swallow every activation before the store's own handlers run.
	useEffect(() => {
		const block = (event: Event) => {
			const target = event.target as Element | null;
			if (event.type === "submit" || target?.closest("a, button, [role='button'], input, select, textarea, summary, label")) {
				event.preventDefault();
				event.stopPropagation();
			}
		};
		document.addEventListener("click", block, true);
		document.addEventListener("submit", block, true);
		return () => {
			document.removeEventListener("click", block, true);
			document.removeEventListener("submit", block, true);
		};
	}, []);

	const store = useMemo<PublicStore>(
		() => ({
			about: "",
			accentColor: accent ?? STORE_THEME_INFO[theme].accents[0],
			announcement: "Free tracked delivery on every order",
			bannerUrl: "",
			contactEmail: "",
			customCss: "",
			font: "theme",
			handle: DEMO_HANDLE,
			logoUrl: "",
			name,
			since,
			socials: {},
			tagline: "Good finds, picked just for you.",
			theme,
			whatsapp: "",
		}),
		[accent, name, since, theme],
	);

	const listings = useMemo<PublicListing[]>(
		() =>
			products.map((product, index) => ({
				cartId: product.id,
				category: product.category,
				featured: index < 4,
				id: product.id,
				imageUrl: product.imgSrc,
				inStock: true,
				price: resellerPrice(product.price, "percent", margin, pricing).salePrice,
				productId: product.id,
				productName: product.title,
				productSlug: product.slug,
				stock: product.stock,
			})),
		[margin, pricing, products],
	);

	const categories = useMemo(() => {
		const counts = new Map<string, number>();
		for (const listing of listings) if (listing.category) counts.set(listing.category, (counts.get(listing.category) ?? 0) + 1);
		return [...counts].map(([category, count]) => ({ count, name: category })).sort((a, b) => b.count - a.count);
	}, [listings]);

	const searchIndex = useMemo(
		() =>
			listings.map((listing) => ({
				cartId: listing.cartId,
				category: listing.category,
				imageUrl: listing.imageUrl,
				inStock: true,
				listingId: listing.id,
				name: listing.productName,
				price: listing.price,
				productId: listing.productId,
				slug: listing.productSlug,
				stock: listing.stock,
			})),
		[listings],
	);

	const basePath = `/store/${DEMO_HANDLE}`;
	return (
		<StoreShell basePath={basePath} categories={categories} searchIndex={searchIndex} store={store}>
			<Suspense>
				<StoreHome basePath={basePath} listings={listings} store={store} />
			</Suspense>
		</StoreShell>
	);
}
