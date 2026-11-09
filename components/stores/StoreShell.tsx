"use client";

import { ArrowLeft, Facebook, Globe, Instagram, Lock, MessageCircle, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useStore } from "@/context/store";
import type { PublicStore } from "@/lib/backend/resellers";
import { customCssProblem } from "@/lib/storeCustomCss";
import { isStoreFont } from "@/lib/storeFonts";
import { isStoreTheme, type StoreTheme } from "@/lib/storeThemes";
import { BrandCollab } from "./AvokartoCredit";
import { StoreCartDrawer } from "./StoreCart";
import StoreFooter from "./StoreFooter";
import StoreHeader, { type StoreCategory } from "./StoreHeader";
import type { StoreSearchItem } from "./StoreSearch";
import { storeFontStyle } from "./storeFontFaces";
import { initialsOf, storeThemeStyle } from "./storeTheme";
import { StoreSiteContext, storeHref, useStoreCartLines, type StoreSite } from "./storeSite";
import { useInstallPrompt } from "./useInstallPrompt";
import styles from "./storefront.module.css";


export function whatsappChatUrl(number: string, text: string) {
	return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Store details the customizer can preview before they're published. */
type PreviewStore = Partial<Pick<PublicStore, "about" | "announcement" | "bannerUrl" | "contactEmail" | "customCss" | "font" | "logoUrl" | "name" | "socials" | "tagline" | "whatsapp">>;
type StudioPreview = { accent: string; store: PreviewStore; theme: StoreTheme };

const UPLOAD_PATH = /^\/api\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/;
const TEXT_LIMITS = { about: 1000, announcement: 140, contactEmail: 200, name: 60, tagline: 140, whatsapp: 20 } as const;

/** Keep only well-formed draft fields: bounded text, our own upload paths, https social links. */
function cleanPreviewStore(raw: unknown): PreviewStore {
	if (!raw || typeof raw !== "object") return {};
	const input = raw as Record<string, unknown>;
	const out: PreviewStore = {};
	for (const [key, limit] of Object.entries(TEXT_LIMITS) as [keyof typeof TEXT_LIMITS, number][]) {
		const value = input[key];
		if (typeof value === "string" && value.length <= limit) out[key] = value;
	}
	for (const key of ["logoUrl", "bannerUrl"] as const) {
		const value = input[key];
		if (typeof value === "string" && (value === "" || UPLOAD_PATH.test(value))) out[key] = value;
	}
	if (typeof input.customCss === "string" && !customCssProblem(input.customCss)) out.customCss = input.customCss;
	if (isStoreFont(input.font)) out.font = input.font;
	if (input.socials && typeof input.socials === "object") {
		const socials: PublicStore["socials"] = {};
		for (const key of ["facebook", "instagram", "website", "youtube"] as const) {
			const value = (input.socials as Record<string, unknown>)[key];
			if (typeof value === "string" && (value === "" || /^https:\/\/[^\s]{1,200}$/.test(value))) socials[key] = value;
		}
		out.socials = socials;
	}
	return out;
}

/** The store as it should render: the saved one, with any customizer draft on top. */
const PreviewStoreContext = createContext<PreviewStore | null>(null);
export function usePreviewStore<T extends PublicStore>(store: T): T {
	const draft = useContext(PreviewStoreContext);
	return useMemo(() => (draft ? { ...store, ...draft, socials: draft.socials ?? store.socials } : store), [draft, store]);
}
type ViewTransitionLike = { finished: Promise<void>; ready: Promise<void> };

/** The theme the store is showing right now (the saved one, or a studio preview). */
const ActiveThemeContext = createContext<StoreTheme | null>(null);
export function useActiveTheme(fallback: StoreTheme) {
	return useContext(ActiveThemeContext) ?? fallback;
}

/**
 * Live theme preview. When the store is shown inside the seller's Theme
 * Studio (a same-origin iframe), the studio posts the theme and colour being
 * tried and the page restyles instantly - cross-faded where the browser
 * supports view transitions. Only affects that iframe; real visitors never
 * receive these messages.
 */
function useStudioPreview() {
	const [state, setPreview] = useState<StudioPreview | null>(null);
	const preview = useRef<StudioPreview | null>(null);
	useEffect(() => {
		if (window.self === window.top) return;
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin || event.source !== window.parent) return;
			const data = event.data as { accent?: unknown; source?: unknown; store?: unknown; theme?: unknown } | null;
			if (data?.source !== "avk-theme-studio" || !isStoreTheme(data.theme)) return;
			if (typeof data.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(data.accent)) return;
			const next = { accent: data.accent, store: cleanPreviewStore(data.store), theme: data.theme };
			// Text and image edits apply directly; only a theme or colour change gets the cross-fade.
			if (preview.current && preview.current.theme === next.theme && preview.current.accent === next.accent) {
				preview.current = next;
				return setPreview(next);
			}
			preview.current = next;
			const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.visibilityState !== "visible";
			const start = (document as Document & { startViewTransition?: (update: () => void) => ViewTransitionLike }).startViewTransition;
			if (!start || calm) return setPreview(next);
			const transition = start.call(document, () => flushSync(() => setPreview(next)));
			// A newer tap (or a hidden frame) aborts the cross-fade; the theme still applies.
			transition.ready.catch(() => undefined);
			transition.finished.catch(() => undefined);
		};
		window.addEventListener("message", onMessage);
		// Tell the studio we're listening (also after every reload/navigation).
		window.parent.postMessage({ source: "avk-store", type: "ready" }, window.location.origin);
		return () => window.removeEventListener("message", onMessage);
	}, []);
	return state;
}

/** The store's logo. `eager` for the header copy - it's always above the fold. */
export function StoreLogo({ eager = false, size = 40, store }: { eager?: boolean; size?: number; store: PublicStore }) {
	return (
		<span className={`${styles.logo} ${store.logoUrl ? styles.logoImage : ""}`} style={{ height: size, width: size }}>
			{store.logoUrl ? (
				<Image alt={`${store.name} logo`} fill loading={eager ? "eager" : undefined} sizes={`${size * 2}px`} src={store.logoUrl} style={{ objectFit: "cover" }} />
			) : (
				initialsOf(store.name)
			)}
		</span>
	);
}

/**
 * The store's own website chrome: announcement bar, branded header with
 * navigation and cart, footer with contact and social links. Replaces
 * Avokarto's header/footer on /store/* so the store reads as its own site.
 */
export default function StoreShell({
	basePath,
	categories,
	children,
	searchIndex,
	store: savedStore,
}: {
	/** "" on the store's own domain, "/store/<handle>" on Avokarto. */
	basePath: string;
	/** For the header's Shop menu, biggest first. */
	categories: StoreCategory[];
	/** Products for the header's live search suggestions. */
	searchIndex: StoreSearchItem[];
	children: ReactNode;
	store: PublicStore;
}) {
	const pathname = usePathname();
	const preview = useStudioPreview();
	const draft = preview?.store ?? null;
	const store = useMemo(() => (draft ? { ...savedStore, ...draft, socials: draft.socials ?? savedStore.socials } : savedStore), [draft, savedStore]);
	const theme = preview?.theme ?? store.theme;
	const accent = preview?.accent ?? store.accentColor;
	// The badge counts this store's items only - its cart and checkout show just those.
	const storeCart = useStoreCartLines(store.handle);
	const cartCount = storeCart.itemCount;
	const [cartOpen, setCartOpen] = useState(false);
	const openCart = useCallback(() => setCartOpen(true), []);
	const closeCart = useCallback(() => setCartOpen(false), []);
	const site = useMemo<StoreSite>(
		() => ({ basePath, closeCart, href: (path = "") => storeHref(basePath, path), openCart, store }),
		[basePath, closeCart, openCart, store],
	);
	// Checkout and its confirmation get a focused header: no nav, no
	// distractions - just the store's brand and a way back.
	const inStorePath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
	const checkoutMode = inStorePath === "/checkout" || inStorePath.startsWith("/checkout/");

	// The cart is shared by every tab of this site: when another tab changes
	// it (adds, removes, checks out), reload it here so no tab shows a stale
	// cart or checks out items that are already gone.
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key === "avokarto-store") void useStore.persist.rehydrate();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const install = useInstallPrompt();

	const home = basePath || "/";
	const socials = [
		{ href: store.socials.instagram, Icon: Instagram, label: "Instagram" },
		{ href: store.socials.facebook, Icon: Facebook, label: "Facebook" },
		{ href: store.socials.youtube, Icon: Youtube, label: "YouTube" },
		{ href: store.socials.website, Icon: Globe, label: "Website" },
	].filter((social): social is { href: string; Icon: typeof Instagram; label: string } => Boolean(social.href));

	return (
		<PreviewStoreContext.Provider value={draft}>
		<StoreSiteContext.Provider value={site}>
		<div className={styles.site} data-checkout={checkoutMode || undefined} data-font={store.font} data-st="site" data-theme={theme} style={{ ...storeThemeStyle(accent), ...storeFontStyle(store.font) }}>
			{/* The seller's Additional CSS - re-checked here, and never on checkout. */}
			{store.customCss && !checkoutMode && !customCssProblem(store.customCss) ? <style data-st="custom-css">{store.customCss}</style> : null}
			{/* Keyboard users can jump past the header straight to the page. */}
			<a className={styles.skipLink} href="#store-content">Skip to content</a>
			{store.announcement && !checkoutMode ? <div className={styles.announcement} data-st="announcement">{store.announcement}</div> : null}

			{checkoutMode ? (
				<header className={`${styles.header} ${styles.checkoutHeader}`}>
					<div className={`${styles.container} ${styles.headerInner}`}>
						<Link aria-label={`Back to ${store.name}`} className={styles.checkoutBack} href={home}>
							<ArrowLeft size={18} /> <span className={styles.hideSm}>Back to store</span>
						</Link>
						<Link aria-label={`${store.name} home`} className={`${styles.brand} ${styles.checkoutBrand}`} href={home}>
							<StoreLogo eager size={34} store={store} />
							<span className={styles.brandText}>
								<span className={styles.brandName}>{store.name}</span>
								<BrandCollab />
							</span>
						</Link>
						<span className={styles.secureTag}><Lock size={14} /> <span className={styles.hideSm}>Secure checkout</span></span>
					</div>
				</header>
			) : (
			<StoreHeader
				basePath={basePath}
				cartCount={cartCount}
				cartTotal={storeCart.pricing.total}
				categories={categories}
				install={install}
				onOpenCart={openCart}
				pauseAutoHide={cartOpen}
				searchIndex={searchIndex}
				socials={socials}
				store={store}
			/>
			)}

			<div className={styles.storeContent} data-st="content" id="store-content" tabIndex={-1}>
				<ActiveThemeContext.Provider value={theme}>{children}</ActiveThemeContext.Provider>
			</div>

			{checkoutMode ? (
				<footer className={styles.checkoutFooter}>
					<div className={styles.container}>
						<span>© {new Date().getFullYear()} {store.name}</span>
						<span>
							Secure checkout &amp; delivery by Avokarto · <a href="/terms-policy" rel="noopener" target="_blank">Terms</a> ·{" "}
							<a href="/return-policy" rel="noopener" target="_blank">Returns</a>
						</span>
					</div>
				</footer>
			) : (
			<StoreFooter basePath={basePath} categories={categories} install={install} onOpenCart={openCart} socials={socials} store={store} />
			)}

			{store.whatsapp && !checkoutMode ? (
				<a
					aria-label={`Chat with ${store.name} on WhatsApp`}
					className={styles.chatBubble}
					href={whatsappChatUrl(store.whatsapp, `Hi ${store.name}! I'm browsing your store.`)}
					rel="noopener noreferrer"
					target="_blank"
				>
					<MessageCircle size={26} />
				</a>
			) : null}

			<StoreCartDrawer onClose={closeCart} open={cartOpen} products={searchIndex} />
		</div>
		</StoreSiteContext.Provider>
		</PreviewStoreContext.Provider>
	);
}
