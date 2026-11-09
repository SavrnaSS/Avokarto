"use client";

import { Check, ChevronRight, FileText, MessageCircle, RotateCcw, Share2, ShieldCheck, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProductImage from "@/components/seller/ProductImage";
import { money, shareLink } from "@/components/seller/sellerApi";
import type { PublicStore } from "@/lib/backend/resellers";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getFreeShippingRemaining } from "@/lib/shippingPolicy";
import type { PublicListing } from "./StoreHome";
import DeliveryEstimate from "./DeliveryEstimate";
import ProductGallery, { galleryLayoutFor } from "./ProductGallery";
import { ProductRail, toCartItem } from "./StoreProductCard";
import { StoreLogo, useActiveTheme, usePreviewStore, whatsappChatUrl } from "./StoreShell";
import { useRecentlyViewed } from "./useRecentlyViewed";
import { trackStoreEvent } from "./storeAnalytics";
import { useStoreCart, type StoreCartItem } from "./useStoreCart";
import styles from "./storefront.module.css";

export type StoreProductData = {
	cartId: number | string;
	category: string;
	description: string;
	highlights: string[];
	id: string;
	imageUrl: string;
	images: string[];
	inStock: boolean;
	price: number;
	productId: string;
	productName: string;
	productSlug: string;
	rating: number;
	reviewCount: number;
	shortSummary: string;
	stock: number;
};

/** A product as sold by a reseller store, at the store's price, in the store's design. */
export default function StoreProduct({
	basePath,
	otherListings,
	product,
	store: savedStore,
}: {
	basePath: string;
	/** The store's other visible products, for "More from" and "Recently viewed". */
	otherListings: PublicListing[];
	product: StoreProductData;
	store: PublicStore;
}) {
	// Inside the seller's customizer the store shows their unpublished edits.
	const store = usePreviewStore(savedStore);
	const recentSlugs = useRecentlyViewed(store.handle, product.productSlug);
	const galleryLayout = galleryLayoutFor(useActiveTheme(store.theme));
	const related = useMemo(() => {
		// Same category first, then featured, then the rest; in-stock before sold out.
		const score = (listing: PublicListing) =>
			(listing.category && listing.category === product.category ? 4 : 0) + (listing.featured ? 2 : 0) + (listing.inStock ? 1 : 0);
		return [...otherListings].sort((a, b) => score(b) - score(a)).slice(0, 8);
	}, [otherListings, product.category]);
	const recent = useMemo(() => {
		const bySlug = new Map(otherListings.map((listing) => [listing.productSlug, listing]));
		return recentSlugs.map((slug) => bySlug.get(slug)).filter((listing): listing is PublicListing => Boolean(listing)).slice(0, 8);
	}, [otherListings, recentSlugs]);
	const { addToCart, buyNow } = useStoreCart();
	useEffect(() => trackStoreEvent(store.handle, "view_product", product.productSlug), [product.productSlug, store.handle]);
	const [quantity, setQuantity] = useState(1);
	const [shared, setShared] = useState(false);
	const [added, setAdded] = useState(false);
	const home = basePath || "/";
	const maxQuantity = Math.max(1, Math.min(product.stock, 10));
	const images = product.images.length ? product.images : [product.imageUrl];
	const item: StoreCartItem = toCartItem(
		{ ...product, featured: false } as PublicListing,
		store,
	);
	const total = product.price * quantity;
	// Admin -> Settings -> Shipping. Off: no meter and no free-shipping promises.
	const { freeShipping } = useStorePolicy();
	const freeThreshold = freeShipping.thresholdUsd;
	const shippingLeft = getFreeShippingRemaining(total, freeShipping);

	// Shopify-style sticky buy bar: shown whenever the main buttons are off screen.
	const actionsRef = useRef<HTMLDivElement>(null);
	const [actionsVisible, setActionsVisible] = useState(true);
	useEffect(() => {
		const element = actionsRef.current;
		if (!element || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(([entry]) => setActionsVisible(entry.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const showBar = product.inStock && !actionsVisible;

	const add = (amount = quantity) => {
		addToCart(item, amount);
		setAdded(true);
		window.setTimeout(() => setAdded(false), 1800);
	};

	const share = async () => {
		const result = await shareLink({ text: `${product.productName} - ${money(product.price)}`, title: product.productName, url: window.location.origin + window.location.pathname });
		if (result === "copied") {
			setShared(true);
			window.setTimeout(() => setShared(false), 2000);
		}
	};

	return (
		<div className={showBar ? styles.hasBuyBar : undefined}>
			<div className={styles.container}>
				<nav aria-label="Breadcrumb" className={styles.crumbs}>
					<Link href={home}>Home</Link>
					<ChevronRight aria-hidden="true" size={14} />
					{product.category ? (
						<>
							{/* Opens the store already filtered to this category (StoreHome reads ?category=). */}
							<Link href={`${basePath}/?category=${encodeURIComponent(product.category)}#shop`}>{product.category}</Link>
							<ChevronRight aria-hidden="true" size={14} />
						</>
					) : null}
					<span aria-current="page">{product.productName}</span>
				</nav>

				<div className={styles.detail} data-layout={galleryLayout}>
					<ProductGallery images={images} layout={galleryLayout} name={product.productName} />

					<div className={styles.buyBox}>
						<div className={styles.buyHead}>
							<Link className={styles.vendor} href={home}>
								<StoreLogo size={22} store={store} /> {store.name}
							</Link>
							<h1 className={styles.productTitle}>{product.productName}</h1>
							{product.reviewCount > 0 ? <Stars count={product.reviewCount} rating={product.rating} /> : null}
						</div>

						<div className={styles.priceRow}>
							<p className={styles.productPrice}>{money(product.price)}</p>
							{!product.inStock ? <span className={styles.badgeSoldInline}>Sold out</span> : null}
						</div>
						<p className={styles.priceNote}>
							{!freeShipping.enabled ? (
								<>Shipping calculated at checkout</>
							) : shippingLeft === 0 ? (
								<><Truck aria-hidden="true" size={14} /> This order ships free</>
							) : product.inStock ? (
								// The free-shipping meter below spells out the threshold.
								<>Shipping calculated at checkout</>
							) : (
								<>Free shipping on orders over {wholeMoney(freeThreshold)} · shipping calculated at checkout</>
							)}
						</p>

						{product.shortSummary ? <p className={styles.prose}>{product.shortSummary}</p> : null}

						{product.inStock ? (
							<div className={styles.stockBlock}>
								<p className={styles.stock} data-level={product.stock <= 5 ? "low" : "ok"}>
									{product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock, ready to ship"}
								</p>
								{product.stock <= 10 ? (
									<span aria-hidden="true" className={styles.stockMeter}>
										<span style={{ width: `${Math.max(8, (product.stock / 10) * 100)}%` }} />
									</span>
								) : null}
							</div>
						) : (
							<p className={styles.stock} data-level="out">Sold out - check back soon</p>
						)}

						{product.inStock ? <DeliveryEstimate /> : null}

						{product.inStock ? (
							<div className={styles.qtyRow}>
								<label className={styles.label} htmlFor="store-qty">Quantity</label>
								<div className={styles.stepper}>
									<button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button">−</button>
									{/* Typeable too (bulk orders), always kept within 1…available. */}
									<input
										className={styles.qtyInput}
										id="store-qty"
										inputMode="numeric"
										max={maxQuantity}
										min={1}
										onChange={(event) => {
											const value = Math.round(Number(event.target.value));
											setQuantity(Number.isFinite(value) && value > 0 ? Math.min(maxQuantity, value) : 1);
										}}
										onFocus={(event) => event.currentTarget.select()}
										type="number"
										value={quantity}
									/>
									<button aria-label="Increase quantity" disabled={quantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} type="button">+</button>
								</div>
							</div>
						) : null}

						<div className={styles.actions} ref={actionsRef}>
							<button className={styles.addButton} disabled={!product.inStock} onClick={() => add()} type="button">
								{added ? <><Check size={18} /> Added to cart</> : <><ShoppingBag size={18} /> Add to cart · {money(total)}</>}
							</button>
							<button className={styles.buyButton} disabled={!product.inStock} onClick={() => buyNow(item, quantity)} type="button">
								<Zap size={18} /> Buy it now
							</button>
						</div>

						{freeShipping.enabled && product.inStock && shippingLeft > 0 ? (
							<div className={styles.shipMeter}>
								<p>Add <strong>{money(shippingLeft)}</strong> more for free shipping</p>
								<span aria-hidden="true"><span style={{ width: `${Math.min(100, (total / freeThreshold) * 100)}%` }} /></span>
							</div>
						) : null}

						<ul className={styles.perksInline}>
							<li><Truck size={18} /> Tracked delivery</li>
							<li><RotateCcw size={18} /> Easy returns</li>
							<li><ShieldCheck size={18} /> Secure checkout</li>
						</ul>

						<div className={styles.accordions}>
							{product.description || product.shortSummary ? (
								<details className={styles.accordion} open>
									<summary><FileText size={18} /> Description</summary>
									<p className={styles.prose}>{product.description || product.shortSummary}</p>
								</details>
							) : null}
							{product.highlights.length ? (
								<details className={styles.accordion} open={!product.description}>
									<summary><Sparkles size={18} /> Highlights</summary>
									<ul className={styles.highlights}>
										{product.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
									</ul>
								</details>
							) : null}
							<details className={styles.accordion}>
								<summary><Truck size={18} /> Shipping &amp; delivery</summary>
								<p className={styles.prose}>
									Every order is packed and shipped by Avokarto with tracking, so you can follow it to your door.{" "}
									{freeShipping.enabled
										? <>Orders over {wholeMoney(freeThreshold)} ship free; otherwise shipping is shown at checkout before you pay.</>
										: "Shipping is shown at checkout before you pay."}
								</p>
							</details>
							<details className={styles.accordion}>
								<summary><RotateCcw size={18} /> Returns</summary>
								<p className={styles.prose}>
									Not quite right? Returns are simple. <a className={styles.inlineLink} href="/return-policy">Read the return policy</a>.
								</p>
							</details>
							<details className={styles.accordion}>
								<summary><ShieldCheck size={18} /> Secure payment</summary>
								<p className={styles.prose}>Checkout is encrypted and handled by Avokarto. {store.name} never sees your payment details.</p>
							</details>
						</div>

						<div className={styles.soldBy}>
							<StoreLogo size={44} store={store} />
							<div style={{ flex: 1, minWidth: 0 }}>
								<p className={styles.muted} style={{ fontSize: 12 }}>Sold by</p>
								<Link href={home} style={{ fontWeight: 700 }}>{store.name}</Link>
							</div>
							{store.whatsapp ? (
								<a aria-label={`Ask ${store.name} on WhatsApp`} className={`${styles.buttonWhatsapp} ${styles.buttonSm}`} href={whatsappChatUrl(store.whatsapp, `Hi! I have a question about ${product.productName}`)} rel="noopener noreferrer" target="_blank">
									<MessageCircle size={16} /> Ask
								</a>
							) : null}
							<button aria-label="Share this product" className={`${styles.buttonGhost} ${styles.buttonSm}`} onClick={share} type="button">
								<Share2 size={16} /> {shared ? "Copied" : "Share"}
							</button>
						</div>
					</div>
				</div>
			</div>
			{related.length ? (
				<ProductRail basePath={basePath} eyebrow="You may also like" listings={related} store={store} title={`More from ${store.name}`} />
			) : null}
			{recent.length ? (
				<ProductRail basePath={basePath} eyebrow="Your history" listings={recent} store={store} title="Recently viewed" />
			) : null}

			<div aria-hidden={!showBar} className={styles.buyBar} data-show={showBar ? "" : undefined} inert={!showBar}>
				<div className={`${styles.container} ${styles.buyBarInner}`}>
					<span className={styles.buyBarThumb}><ProductImage alt="" sizes="48px" src={product.imageUrl} /></span>
					<div className={styles.buyBarInfo}>
						<span className={styles.buyBarName}>{product.productName}</span>
						<span className={styles.buyBarPrice}>{money(total)}</span>
					</div>
					<button className={`${styles.addButton} ${styles.buyBarAdd}`} onClick={() => add()} type="button">
						{added ? <Check size={18} /> : <ShoppingBag size={18} />} <span className={styles.hideSm}>{added ? "Added" : "Add to cart"}</span>
					</button>
					<button className={`${styles.buyButton} ${styles.buyBarBuy}`} onClick={() => buyNow(item, quantity)} type="button">
						Buy now
					</button>
				</div>
			</div>
		</div>
	);
}

/** "$100.00" reads as "$100". */
function wholeMoney(value: number) {
	return money(value).replace(/\.00$/, "");
}

/** Star rating with partial fill (4.6 shows four and a bit stars). */
function Stars({ count, rating }: { count: number; rating: number }) {
	return (
		<span className={styles.rating}>
			<span aria-hidden="true" className={styles.stars}>
				<span>★★★★★</span>
				<span className={styles.starsFill} style={{ width: `${Math.max(0, Math.min(5, rating)) * 20}%` }}>★★★★★</span>
			</span>
			<span className="visually-hidden">Rated {rating.toFixed(1)} out of 5 from {count} {count === 1 ? "review" : "reviews"}</span>
			<span aria-hidden="true">{rating.toFixed(1)}</span>
			<span aria-hidden="true" className={styles.muted}>({count} {count === 1 ? "review" : "reviews"})</span>
		</span>
	);
}
