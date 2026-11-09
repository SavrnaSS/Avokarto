"use client";

import { ArrowRight, ChevronDown, MessageCircle, Plus, RotateCcw, Search, Share2, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ProductImage from "@/components/seller/ProductImage";
import { money, shareLink } from "@/components/seller/sellerApi";
import type { PublicStore } from "@/lib/backend/resellers";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { freeShippingThresholdLabel } from "@/lib/shippingPolicy";
import StoreProductCard, { ProductRail, toCartItem } from "./StoreProductCard";
import { STORE_FILTER_EVENT, type StoreFilterDetail } from "./storeSite";
import { HeroPartner } from "./AvokartoCredit";
import { StoreLogo, usePreviewStore, whatsappChatUrl } from "./StoreShell";
import { trackStoreEvent } from "./storeAnalytics";
import { useRecentSlugs } from "./useRecentlyViewed";
import { useStoreCart } from "./useStoreCart";
import styles from "./storefront.module.css";

export type PublicListing = {
	cartId: number | string;
	category: string;
	featured: boolean;
	id: string;
	imageUrl: string;
	inStock: boolean;
	price: number;
	productId: string;
	productName: string;
	productSlug: string;
	stock: number;
};

type Sort = "featured" | "price-asc" | "price-desc" | "name";
const SORTS: Sort[] = ["featured", "price-asc", "price-desc", "name"];
// Products rendered per step; more load as the shopper nears the end.
const PAGE_SIZE = 24;

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
// Catalog size only impresses once it's sizeable - "4 products" reads as a tiny shop.
const SHOW_PRODUCT_COUNT = 12;
const SHOW_CATEGORY_COUNT = 3;

const PERKS = [
	// Title filled in from the live free-shipping rule (see StoreHome); "Tracked delivery" when it's off.
	{ Icon: Truck, text: "Packed and shipped by Avokarto, tracked to your door.", title: "Tracked delivery" },
	{ Icon: RotateCcw, text: "Changed your mind? Returns are simple and quick.", title: "Easy returns" },
	{ Icon: ShieldCheck, text: "Pay safely - your details stay protected.", title: "Secure checkout" },
	{ Icon: MessageCircle, text: "Real people behind this store, happy to help.", title: "Friendly support" },
];

/** A reseller store's home page: its banner, featured picks and full catalog. */
export default function StoreHome({
	basePath,
	listings,
	store: savedStore,
}: {
	basePath: string;
	listings: PublicListing[];
	store: PublicStore;
}) {
	// "Free delivery over $X" from Admin -> Settings -> Shipping; null when free shipping is off.
	const freeOver = freeShippingThresholdLabel(useStorePolicy().freeShipping);
	// Inside the seller's customizer the store shows their unpublished edits.
	const store = usePreviewStore(savedStore);
	useEffect(() => trackStoreEvent(store.handle, "view_store"), [store.handle]);
	// Search, category and sort live in the URL (?q=&category=&sort=), so a
	// refresh, the back button or a shared link keeps the shopper's view.
	const params = useSearchParams();
	const [query, setQuery] = useState(() => params.get("q") ?? "");
	const [category, setCategory] = useState(() => params.get("category") ?? "");
	const [sort, setSort] = useState<Sort>(() => (SORTS.includes(params.get("sort") as Sort) ? (params.get("sort") as Sort) : "featured"));
	const [limit, setLimit] = useState(PAGE_SIZE);
	const [shared, setShared] = useState(false);
	const searchRef = useRef<HTMLInputElement>(null);
	const sentinel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const url = new URL(window.location.href);
		const set = (key: string, value: string, fallback = "") => (value && value !== fallback ? url.searchParams.set(key, value) : url.searchParams.delete(key));
		set("q", query.trim());
		set("category", category);
		set("sort", sort, "featured");
		if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
	}, [category, query, sort]);

	// Changing what's shown starts again from the first page.
	const updateQuery = (value: string) => { setQuery(value); setLimit(PAGE_SIZE); };
	const updateCategory = useCallback((value: string) => { setCategory(value); setLimit(PAGE_SIZE); }, []);
	const updateSort = (value: Sort) => { setSort(value); setLimit(PAGE_SIZE); };

	// The header's search and category menu filter this page in place.
	useEffect(() => {
		const onFilter = (event: Event) => {
			const { category: nextCategory, q } = (event as CustomEvent<StoreFilterDetail>).detail ?? {};
			if (q !== undefined) setQuery(q);
			if (nextCategory !== undefined) setCategory(nextCategory);
			setLimit(PAGE_SIZE);
		};
		window.addEventListener(STORE_FILTER_EVENT, onFilter);
		return () => window.removeEventListener(STORE_FILTER_EVENT, onFilter);
	}, []);

	// "/" jumps to search, like most shops and docs sites.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target;
			if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
			event.preventDefault();
			searchRef.current?.focus();
			searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const categories = useMemo(
		() => [...new Set(listings.map((listing) => listing.category).filter(Boolean))].sort(),
		[listings],
	);
	const featured = useMemo(() => listings.filter((listing) => listing.featured && listing.inStock), [listings]);
	const visible = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const filtered = listings.filter(
			(listing) =>
				(!category || listing.category === category) &&
				(!needle || listing.productName.toLowerCase().includes(needle) || listing.category.toLowerCase().includes(needle)),
		);
		const sorted = [...filtered];
		if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
		else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
		else if (sort === "name") sorted.sort((a, b) => a.productName.localeCompare(b.productName));
		// "featured": featured first, then in-stock, keeping the seller's order.
		else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.inStock) - Number(a.inStock));
		return sorted;
	}, [category, listings, query, sort]);

	// Products this shopper opened before, newest first (only ones still listed).
	const recentSlugs = useRecentSlugs(store.handle);
	const recent = useMemo(() => {
		const bySlug = new Map(listings.map((listing) => [listing.productSlug, listing]));
		return recentSlugs.map((slug) => bySlug.get(slug)).filter((listing): listing is PublicListing => Boolean(listing)).slice(0, 8);
	}, [listings, recentSlugs]);

	const card = (listing: PublicListing, priority = false) => (
		<StoreProductCard basePath={basePath} key={listing.id} listing={listing} priority={priority} store={store} />
	);

	// The hero's visuals: featured, in-stock products first.
	const showcase = useMemo(
		() => [...listings].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.inStock) - Number(a.inStock)).slice(0, 3),
		[listings],
	);
	const fromPrice = useMemo(() => {
		const prices = listings.filter((listing) => listing.inStock).map((listing) => listing.price);
		return prices.length ? Math.min(...prices) : null;
	}, [listings]);
	const categoryTiles = useMemo(
		() =>
			categories.map((name) => {
				const inCategory = listings.filter((listing) => listing.category === name);
				const cover = inCategory.find((listing) => listing.featured) ?? inCategory[0];
				// A few more of the category's products, previewed on wide cards.
				const thumbs = inCategory.filter((listing) => listing !== cover && listing.imageUrl).slice(0, 3).map((listing) => listing.imageUrl);
				return { count: inCategory.length, imageUrl: cover?.imageUrl ?? "", name, thumbs };
			}),
		[categories, listings],
	);

	// Load the next page shortly before the shopper reaches the end.
	const hasMore = visible.length > limit;
	const shown = visible.slice(0, limit);
	// Themes with a "cover story" first tile (2x2 in a 3-column grid) only use it
	// when the rest of the page fills evenly - 4 + (n - 1) cells divisible by 3.
	const coverFits = shown.length >= 3 && shown.length % 3 === 0;
	useEffect(() => {
		const element = sentinel.current;
		if (!element || !hasMore || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setLimit((current) => current + PAGE_SIZE), { rootMargin: "800px 0px" });
		observer.observe(element);
		return () => observer.disconnect();
	}, [hasMore, limit]);

	const browseCategory = (name: string) => {
		updateCategory(name);
		document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const share = async () => {
		const result = await shareLink({ text: `Check out ${store.name}`, title: store.name, url: window.location.origin + window.location.pathname });
		if (result === "copied") {
			setShared(true);
			window.setTimeout(() => setShared(false), 2000);
		}
	};

	return (
		<div>
			<StoreHero
				categories={categories}
				fromPrice={fromPrice}
				onBrowse={browseCategory}
				onShare={share}
				productCount={listings.length}
				shared={shared}
				showcase={showcase}
				store={store}
				basePath={basePath}
			/>

			{/* The trust bar below covers delivery, returns and checkout, so the strip is about the store itself. */}
			<Marquee items={[...categories.slice(0, 6), `Handpicked by ${store.name}`]} />

			{/* Reassurance right under the hero, where shoppers decide whether to trust the store. */}
			<section data-st="trust" className={`${styles.perks} ${styles.perksTop}`} aria-label="Why shop with us">
				<div className={styles.container}>
					<div className={styles.perksGrid}>
						{PERKS.filter((perk) => perk.title !== "Friendly support" || store.whatsapp || store.contactEmail).map(({ Icon, text, title: baseTitle }) => {
							const title = baseTitle === "Tracked delivery" && freeOver ? `Free delivery over ${freeOver}` : baseTitle;
							return (
							<div className={`${styles.perk} ${styles.reveal}`} key={title}>
								<span className={styles.trustIcon}><Icon size={20} /></span>
								<div>
									<p className={styles.perkTitle}>{title}</p>
									<p className={styles.muted}>{text}</p>
								</div>
							</div>
							);
						})}
					</div>
				</div>
			</section>

			{categoryTiles.length > 1 ? (
				<section data-st="categories" className={styles.section}>
					<div className={styles.container}>
						<div className={`${styles.sectionHead} ${styles.reveal}`}>
							<div>
								<p className={styles.eyebrow}>Browse</p>
								<h2 className={styles.sectionTitle}>Shop by category</h2>
							</div>
						</div>
						<div className={styles.categoryGrid}>
							{categoryTiles.map((tile) => (
								<button className={`${styles.categoryTile} ${styles.reveal}`} key={tile.name} onClick={() => browseCategory(tile.name)} type="button">
									{tile.imageUrl ? <ProductImage alt="" sizes="(min-width: 1100px) 290px, (min-width: 768px) 32vw, 48vw" src={tile.imageUrl} /> : null}
									<span className={styles.categoryLabel}>
										<small className={styles.categoryKicker}>Collection</small>
										<strong>{tile.name}</strong>
										<span>{tile.count} {tile.count === 1 ? "product" : "products"} <ArrowRight aria-hidden="true" size={14} /></span>
										{tile.thumbs.length ? (
											<span aria-hidden="true" className={styles.categoryThumbs}>
												{tile.thumbs.map((src) => (
													<span className={styles.categoryThumb} key={src}>
														<ProductImage alt="" sizes="64px" src={src} />
													</span>
												))}
												{tile.count - 1 - tile.thumbs.length > 0 ? <span className={styles.categoryMore}>+{tile.count - 1 - tile.thumbs.length}</span> : null}
											</span>
										) : null}
										<span aria-hidden="true" className={styles.categoryCta}>Shop {tile.name} <ArrowRight size={16} /></span>
									</span>
								</button>
							))}
						</div>
					</div>
				</section>
			) : null}

			{featured.length ? (
				<section data-st="featured" className={styles.section}>
					<div className={styles.container}>
						<div className={`${styles.sectionHead} ${styles.reveal}`}>
							<div>
								<p className={styles.eyebrow}>Handpicked</p>
								<h2 className={styles.sectionTitle}>Featured picks</h2>
							</div>
						</div>
						<div className={styles.rail}>{featured.map((listing, index) => card(listing, index < 2))}</div>
					</div>
				</section>
			) : null}

			<section data-st="catalog" className={styles.section} id="shop" style={{ paddingTop: featured.length ? 0 : undefined, scrollMarginTop: 90 }}>
				<div className={styles.container}>
					<div className={styles.sectionHead}>
						<div>
							<p className={styles.eyebrow}>The collection</p>
							<h2 className={styles.sectionTitle}>Shop {store.name}</h2>
						</div>
						<p className={styles.muted}>{visible.length} of {listings.length} products</p>
					</div>

					{listings.length ? (
						<>
							{/* Stays under the header while browsing a long catalog. */}
							<div className={styles.catalogBar}>
								<div className={styles.toolbar}>
									<label className={styles.search}>
										<Search aria-hidden="true" />
										<span className="visually-hidden">Search {store.name}</span>
										<input
											className={styles.searchInput}
											enterKeyHint="search"
											id="store-search"
											onChange={(event) => updateQuery(event.target.value)}
											placeholder={`Search ${store.name}`}
											ref={searchRef}
											type="search"
											value={query}
										/>
										<kbd aria-hidden="true" className={styles.searchKey}>/</kbd>
									</label>
									<label className={styles.sortControl}>
										<span className="visually-hidden">Sort products</span>
										<select className={styles.select} onChange={(event) => updateSort(event.target.value as Sort)} value={sort}>
											<option value="featured">Featured</option>
											<option value="price-asc">Price: Low to high</option>
											<option value="price-desc">Price: High to low</option>
											<option value="name">Name: A to Z</option>
										</select>
										<ChevronDown aria-hidden="true" size={16} />
									</label>
								</div>
								{categories.length > 1 ? (
									<div aria-label="Filter by category" className={styles.chips} role="group">
										<button aria-pressed={!category} className={styles.chip} onClick={() => updateCategory("")} type="button">All</button>
										{categories.map((entry) => (
											<button aria-pressed={category === entry} className={styles.chip} key={entry} onClick={() => updateCategory(entry)} type="button">
												{entry}
											</button>
										))}
									</div>
								) : null}
							</div>
							<p aria-live="polite" className="visually-hidden">{visible.length} {visible.length === 1 ? "product" : "products"} shown</p>
							{visible.length ? (
								<>
									<div className={styles.grid} data-cover={coverFits || undefined} data-fit={!coverFits && shown.length % 4 === 0 ? "4" : undefined}>{shown.map((listing) => card(listing))}</div>
									{hasMore ? (
										<div className={styles.moreRow} ref={sentinel}>
											<button className={styles.buttonGhost} onClick={() => setLimit((current) => current + PAGE_SIZE)} type="button">
												Show more <span className={styles.moreCount}>({visible.length - limit} left)</span>
											</button>
										</div>
									) : null}
								</>
							) : (
								<div className={`${styles.panel} ${styles.empty}`}>
									<h3>{query.trim() ? <>Nothing matches “{query.trim()}”</> : "Nothing here yet"}</h3>
									<p className={styles.muted}>Try another word or browse everything in {store.name}.</p>
									<button className={styles.buttonGhost} onClick={() => { updateQuery(""); updateCategory(""); }} type="button">Show all products</button>
								</div>
							)}
						</>
					) : (
						<div className={`${styles.panel} ${styles.empty}`}>
							<h3>{store.name} is stocking up</h3>
							<p className={styles.muted}>New products are on the way. Check back soon!</p>
						</div>
					)}
				</div>
			</section>

			{recent.length ? <ProductRail basePath={basePath} eyebrow="Pick up where you left off" listings={recent} store={store} title="Recently viewed" /> : null}

			<section data-st="about" className={styles.section} id="about" style={{ scrollMarginTop: 90 }}>
				<div className={styles.container}>
					<div className={`${styles.story} ${styles.reveal}`}>
						<div className={styles.storyMedia}>
							{showcase[1] || showcase[0] ? (
								<ProductImage alt="" sizes="(min-width: 900px) 480px, 100vw" src={(showcase[1] ?? showcase[0]).imageUrl} />
							) : null}
							<span className={styles.storyStamp}>
								<StoreLogo size={64} store={store} />
							</span>
						</div>
						<div className={styles.storyCopy}>
							<p className={styles.eyebrow}>Our story</p>
							<h2 className={styles.sectionTitle}>Hi, we&apos;re {store.name}</h2>
							<p className={styles.prose}>
								{store.about || store.tagline || `Welcome to ${store.name}! Every product here is handpicked for you and delivered by Avokarto.`}
							</p>
							<p className={styles.muted}>Curating since {shortDate.format(new Date(store.since))}</p>
							<div className={styles.contactRow}>
								<a className={styles.button} href="#shop">Start shopping <ArrowRight size={18} /></a>
								{store.whatsapp ? (
									<a className={styles.buttonWhatsapp} href={whatsappChatUrl(store.whatsapp, `Hi ${store.name}!`)} rel="noopener noreferrer" target="_blank">
										<MessageCircle size={18} /> Chat with us
									</a>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</section>

			{store.whatsapp ? (
				<section data-st="cta" className={styles.ctaBand}>
					<div className={`${styles.container} ${styles.ctaInner}`}>
						<div>
							<h2 className={styles.ctaTitle}>Need help choosing?</h2>
							<p className={styles.ctaText}>Message {store.name} on WhatsApp about sizes, gifts or anything else.</p>
						</div>
						<a className={styles.buttonOnImage} href={whatsappChatUrl(store.whatsapp, `Hi ${store.name}! Can you help me pick something?`)} rel="noopener noreferrer" target="_blank">
							<MessageCircle size={18} /> Ask on WhatsApp
						</a>
					</div>
				</section>
			) : null}
		</div>
	);
}

/**
 * The store's landing hero. With a banner it's a full-bleed photo; without
 * one, the store's own products become an editorial collage, so every store
 * opens like a real brand site. Each theme restyles the same markup into
 * its own layout (storefront.module.css, "Theme heroes"): the optional bits
 * here - kicker, category links, captions, price sticker, scroll cue - are
 * shown only by the themes that use them.
 */
function StoreHero({
	basePath,
	categories,
	fromPrice,
	onBrowse,
	onShare,
	productCount,
	shared,
	showcase,
	store,
}: {
	basePath: string;
	categories: string[];
	fromPrice: number | null;
	onBrowse: (category: string) => void;
	onShare: () => void;
	productCount: number;
	shared: boolean;
	showcase: PublicListing[];
	store: PublicStore;
}) {
	const { addToCart } = useStoreCart();
	const spotlight = showcase.find((listing) => listing.inStock);
	const banner = Boolean(store.bannerUrl);
	const since = new Date(store.since).getFullYear();
	// How many characters wide the name must fit: its longest word, or about
	// half of a long multi-word name (it wraps onto two lines). Big-type
	// themes size the headline from this so any name fills its column
	// without overflowing.
	const words = store.name.trim().split(/\s+/);
	const nameFit = Math.max(4, ...words.map((word) => word.length), Math.min(store.name.trim().length, 9));
	const showCount = productCount >= SHOW_PRODUCT_COUNT;
	const showCategories = categories.length >= SHOW_CATEGORY_COUNT;
	const kicker = [Number.isFinite(since) ? `Since ${since}` : "", categories.slice(0, 2).join(" & ")].filter(Boolean).join(" · ");

	return (
		<section data-st="hero" className={styles.storeHero} data-layout={banner ? "banner" : "collage"}>
			{banner ? (
				<>
					<div className={styles.heroImage}>
						<Image alt="" fetchPriority="high" fill loading="eager" sizes="100vw" src={store.bannerUrl} />
					</div>
					<div className={styles.heroShade} />
				</>
			) : (
				<div aria-hidden="true" className={styles.heroDecor} />
			)}
			<div className={styles.container}>
				<div className={styles.heroGrid}>
					<div className={styles.heroCopy}>
						{kicker ? <p className={styles.heroKicker}><span aria-hidden="true" className={styles.heroKickerDot} />{kicker}</p> : null}
						<h1 className={styles.heroHeadline} style={{ "--name-fit": nameFit } as CSSProperties}>{store.name}</h1>
						{store.tagline ? <p className={styles.heroLead}>{store.tagline}</p> : null}
						<div className={styles.heroActions}>
							<a className={styles.heroPrimary} href="#shop">
								Shop the collection <ArrowRight size={18} />
							</a>
							{store.whatsapp ? (
								<a className={styles.buttonWhatsapp} href={whatsappChatUrl(store.whatsapp, `Hi ${store.name}!`)} rel="noopener noreferrer" target="_blank">
									<MessageCircle size={18} /> <span className={styles.hideSm}>Chat</span>
								</a>
							) : null}
							<button aria-label="Share this store" className={styles.heroGhost} onClick={onShare} type="button">
								<Share2 size={18} /> <span className={styles.hideSm}>{shared ? "Link copied" : "Share"}</span>
							</button>
						</div>
						{showCount || showCategories || fromPrice !== null ? (
							<dl className={styles.heroStats} data-count={[showCount, showCategories, fromPrice !== null].filter(Boolean).length}>
								{showCount ? <div><dt>Products</dt><dd>{productCount}</dd></div> : null}
								{showCategories ? <div><dt>Categories</dt><dd>{categories.length}</dd></div> : null}
								{fromPrice !== null ? <div><dt>Prices from</dt><dd>{money(fromPrice)}</dd></div> : null}
							</dl>
						) : null}
						{categories.length > 1 ? (
							<nav aria-label="Popular categories" className={styles.heroCats}>
								{categories.slice(0, 4).map((name) => (
									<button key={name} onClick={() => onBrowse(name)} type="button">{name}</button>
								))}
							</nav>
						) : null}
						<HeroPartner store={store} />
					</div>

					<div className={styles.heroVisual}>
						{!banner && showcase.length ? (
							<div className={styles.collage} data-count={showcase.length}>
								{showcase.map((listing, index) => (
									<Link
										aria-label={listing.productName}
										className={styles.collageItem}
										data-spotlight={listing.id === spotlight?.id || undefined}
										href={`${basePath}/${listing.productSlug}`}
										key={listing.id}
									>
										{/* Every hero photo is above the fold in every theme - load all eagerly. */}
										<ProductImage alt="" priority sizes={index === 0 ? "(min-width: 900px) 340px, 60vw" : "(min-width: 900px) 220px, 40vw"} src={listing.imageUrl} />
										<span aria-hidden="true" className={styles.collageCaption}>
											<span>{listing.productName}</span>
											<strong>{money(listing.price)}</strong>
										</span>
									</Link>
								))}
							</div>
						) : null}
						{!banner && !showcase.length ? (
							<div className={styles.collageEmpty}>
								<StoreLogo size={120} store={store} />
							</div>
						) : null}
						{!banner && fromPrice !== null && showcase.length ? (
							<span aria-hidden="true" className={styles.heroSticker}>
								<small>From</small>
								<strong>{money(fromPrice)}</strong>
							</span>
						) : null}
						{spotlight ? (
							<div className={styles.spotlight}>
								<Link aria-hidden="true" className={styles.spotlightThumb} href={`${basePath}/${spotlight.productSlug}`} tabIndex={-1}>
									<ProductImage alt="" sizes="64px" src={spotlight.imageUrl} />
								</Link>
								<div className={styles.spotlightBody}>
									<span className={styles.spotlightLabel}>{spotlight.featured ? "Featured pick" : "Top pick"}</span>
									<Link className={styles.spotlightName} href={`${basePath}/${spotlight.productSlug}`}>{spotlight.productName}</Link>
									<span className={styles.spotlightPrice}>{money(spotlight.price)}</span>
								</div>
								<button
									aria-label={`Add ${spotlight.productName} to cart`}
									className={styles.spotlightAdd}
									onClick={() => addToCart(toCartItem(spotlight, store))}
									type="button"
								>
									<Plus size={20} />
								</button>
							</div>
						) : null}
					</div>
				</div>
			</div>
			<a aria-label="Scroll to the products" className={styles.heroScroll} href="#shop">
				<ChevronDown size={20} />
			</a>
		</section>
	);
}

/** A slow, endless strip of what the store is about. Decorative only. */
function Marquee({ items }: { items: string[] }) {
	const unique = [...new Set(items.filter(Boolean))];
	if (unique.length < 2) return null;
	// Two identical halves so the loop is seamless.
	const run = [...unique, ...unique];
	return (
		<div aria-hidden="true" className={styles.marquee}>
			<div className={styles.marqueeTrack}>
				{[run, run].map((half, copy) => (
					<span className={styles.marqueeHalf} key={copy}>
						{half.map((item, index) => (
							<span key={`${item}-${index}`}>{item}<span className={styles.marqueeDot}>✦</span></span>
						))}
					</span>
				))}
			</div>
		</div>
	);
}
