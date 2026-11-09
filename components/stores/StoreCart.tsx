"use client";

import { ArrowRight, Check, CreditCard, Lock, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import ProductImage from "@/components/seller/ProductImage";
import { money } from "@/components/seller/sellerApi";
import { useStore } from "@/context/store";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getFreeShippingRemaining } from "@/lib/shippingPolicy";
import type { CartProduct } from "@/types";
import DeliveryEstimate from "./DeliveryEstimate";
import { PAYMENT_METHODS } from "./StoreFooter";
import type { PublicListing } from "./StoreHome";
import type { StoreSearchItem } from "./StoreSearch";
import { ProductRail } from "./StoreProductCard";
import { useStoreCart } from "./useStoreCart";
import { storeHref, useStoreCartLines, useStoreSite, type StoreSite } from "./storeSite";
import styles from "./storefront.module.css";

/** Progress towards free shipping, in the store's colours. */
export function FreeShippingMeter({ total }: { total: number }) {
	// Admin -> Settings -> Shipping: the live minimum; nothing when it's off.
	const { freeShipping } = useStorePolicy();
	const remaining = getFreeShippingRemaining(total, freeShipping);
	const progress = freeShipping.thresholdUsd > 0 ? Math.min(100, (total / freeShipping.thresholdUsd) * 100) : 100;
	if (!freeShipping.enabled) return null;
	return (
		<div className={styles.shipNudge} data-done={remaining === 0 || undefined}>
			<p>
				<Truck aria-hidden="true" size={16} />
				{remaining === 0 ? (
					<span><strong>Free shipping</strong> unlocked</span>
				) : (
					<span>Add <strong>{money(remaining)}</strong> for free shipping</span>
				)}
			</p>
			<span aria-hidden="true" className={styles.shipNudgeBar}><span style={{ width: `${progress}%` }} /></span>
		</div>
	);
}

/** A cart line's photo; falls back to a neutral icon if the image is gone. */
function LineThumb({ src }: { src?: string }) {
	const [failed, setFailed] = useState(false);
	if (!src || failed) return <span aria-hidden="true" className={styles.cartThumbFallback}><ShoppingBag size={22} /></span>;
	return <ProductImage alt="" onError={() => setFailed(true)} sizes="88px" src={src} />;
}

/**
 * The store's cart lines. Editable (drawer, cart page) with quantity
 * steppers and remove-with-undo, or read-only (checkout summary). The line
 * total sits on the actions row, so long names never collide with prices.
 */
export function CartLines({
	editable = true,
	lines,
	onNavigate,
	site,
}: {
	editable?: boolean;
	lines: CartProduct[];
	onNavigate?: () => void;
	site: StoreSite;
}) {
	const { remove, restore, setQuantity } = useStoreCartLines(site.store.handle);
	// The last removal, offered for undo in its old place for a few seconds.
	// `cartIndex` restores it in the whole cart; `listIndex` shows the undo row where it was here.
	const [removed, setRemoved] = useState<{ cartIndex: number; line: CartProduct; listIndex: number } | null>(null);
	useEffect(() => {
		if (!removed) return;
		const timer = window.setTimeout(() => setRemoved(null), 6000);
		return () => window.clearTimeout(timer);
	}, [removed]);

	const removeLine = (line: CartProduct, listIndex: number) => {
		const cartIndex = useStore.getState().cartProducts.findIndex((entry) => String(entry.id) === String(line.id));
		setRemoved({ cartIndex: Math.max(0, cartIndex), line, listIndex });
		remove(line.id);
	};
	const undoRow = removed ? (
		<li className={styles.cartUndo} key={`removed-${String(removed.line.id)}`} role="status">
			<span>Removed <strong>{removed.line.title}</strong></span>
			<button className={styles.textButton} onClick={() => { restore(removed.line, removed.cartIndex); setRemoved(null); }} type="button">Undo</button>
		</li>
	) : null;
	const undoAt = removed ? Math.min(removed.listIndex, lines.length) : -1;

	return (
		<ul className={styles.cartLines} data-editable={editable || undefined}>
			{lines.map((line, position) => {
				const href = line.slug ? storeHref(site.basePath, `/${line.slug}`) : site.href();
				const limit = Number.isFinite(line.availableQuantity) ? line.availableQuantity! : 99;
				const problem = line.inStock === false || limit <= 0 ? "No longer available" : line.quantity > limit ? `Only ${limit} left` : null;
				return (
					<Fragment key={String(line.id)}>
						{position === undoAt ? undoRow : null}
						<li className={styles.cartLine} data-problem={problem ? "" : undefined}>
							<Link aria-hidden="true" className={styles.cartThumb} href={href} onClick={onNavigate} tabIndex={-1}>
								<LineThumb src={line.imgSrc} />
								{!editable ? <span className={styles.cartQtyBadge}>{line.quantity}</span> : null}
							</Link>
							<div className={styles.cartLineBody}>
								<Link className={styles.cartLineName} href={href} onClick={onNavigate}>{line.title}</Link>
								<span className={styles.cartLineUnit}>{money(line.price)}{editable ? " each" : ` × ${line.quantity}`}</span>
								{problem ? <span className={styles.cartLineProblem} role="status">{problem}</span> : null}
							</div>
							{editable ? (
								<div className={styles.cartLineActions}>
									<div className={styles.miniStepper}>
										<button aria-label={`One fewer ${line.title}`} disabled={line.quantity <= 1} onClick={() => setQuantity(line.id, line.quantity - 1)} type="button">
											<Minus size={14} />
										</button>
										<output aria-label={`${line.title} quantity`} aria-live="polite">{line.quantity}</output>
										<button aria-label={`One more ${line.title}`} disabled={line.quantity >= limit} onClick={() => setQuantity(line.id, line.quantity + 1)} type="button">
											<Plus size={14} />
										</button>
									</div>
									<button aria-label={`Remove ${line.title}`} className={styles.cartRemove} onClick={() => removeLine(line, position)} type="button">
										<Trash2 size={15} />
									</button>
								</div>
							) : null}
							<span className={styles.cartLineTotal}>{money(line.price * line.quantity)}</span>
						</li>
					</Fragment>
				);
			})}
			{undoAt === lines.length ? undoRow : null}
		</ul>
	);
}

function OtherItemsNote({ count }: { count: number }) {
	if (!count) return null;
	return (
		<p className={styles.cartNote}>
			Your cart also has {count} {count === 1 ? "item" : "items"} from other shops - {count === 1 ? "it's" : "they're"} kept for later.
		</p>
	);
}

function EmptyCart({ onShop, site }: { onShop?: () => void; site: StoreSite }) {
	return (
		<div className={styles.cartEmpty}>
			<span className={styles.trustIcon}><ShoppingBag size={22} /></span>
			<h3>Your cart is empty</h3>
			<p className={styles.muted}>Find something you love in {site.store.name}.</p>
			<Link className={styles.button} href={`${site.href()}#shop`} onClick={onShop}>
				Start shopping <ArrowRight size={18} />
			</Link>
		</div>
	);
}

/**
 * The store's cart, sliding in from the side (a bottom sheet on phones,
 * swipe down to close). A modal <dialog>: focus is trapped, Esc closes,
 * the page behind is inert.
 */
export function StoreCartDrawer({ onClose, open, products = [] }: { onClose: () => void; open: boolean; products?: StoreSearchItem[] }) {
	const site = useStoreSite();
	const dialog = useRef<HTMLDialogElement>(null);
	const sheet = useRef<HTMLDivElement>(null);
	const drag = useRef<{ start: number; y: number; time: number; velocity: number } | null>(null);
	const cart = useStoreCartLines(site?.store.handle ?? "");
	const remaining = getFreeShippingRemaining(cart.pricing.total, useStorePolicy().freeShipping);
	const picks = useMemo(() => {
		const inCart = new Set(cart.lines.map((line) => line.slug).filter(Boolean));
		const candidates = products.filter((product) => product.inStock && product.stock > 0 && !inCart.has(product.slug));
		if (remaining > 0) {
			const unlocks = candidates.filter((product) => product.price >= remaining).sort((a, b) => a.price - b.price);
			const rest = candidates.filter((product) => product.price < remaining).sort((a, b) => b.price - a.price);
			return [...unlocks, ...rest].slice(0, 3);
		}
		return candidates.slice(0, 3);
	}, [cart.lines, products, remaining]);

	// Opening plays the CSS slide-in. Closing (any path: button, Esc, backdrop,
	// swipe, navigating away) slides the panel out first, then closes the dialog.
	useEffect(() => {
		const element = dialog.current;
		if (!element) return;
		if (open) {
			delete element.dataset.closing;
			if (!element.open) element.showModal();
			return;
		}
		if (!element.open) return;
		const panel = sheet.current;
		let fallback = 0;
		const finish = () => {
			window.clearTimeout(fallback);
			delete element.dataset.closing;
			if (panel) panel.style.transform = panel.style.transition = "";
			element.close();
		};
		if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			finish();
			return;
		}
		const onEnd = (event: AnimationEvent) => event.target === panel && finish();
		element.dataset.closing = "";
		panel.addEventListener("animationend", onEnd);
		fallback = window.setTimeout(finish, 400);
		return () => {
			panel.removeEventListener("animationend", onEnd);
			window.clearTimeout(fallback);
		};
	}, [open]);

	if (!site) return null;

	// Phones: drag the grabber down to dismiss. The panel follows the finger
	// 1:1 (no transition while dragging); a long drag or a quick flick closes it.
	const onPointerDown = (event: ReactPointerEvent) => {
		drag.current = { start: event.clientY, y: 0, time: event.timeStamp, velocity: 0 };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		if (sheet.current) sheet.current.style.transition = "none";
	};
	const onPointerMove = (event: ReactPointerEvent) => {
		const state = drag.current;
		if (!state || !sheet.current) return;
		const raw = event.clientY - state.start;
		// Resist dragging upwards past the resting position.
		const y = raw < 0 ? -Math.sqrt(-raw) * 2 : raw;
		const elapsed = event.timeStamp - state.time;
		if (elapsed > 0) state.velocity = (y - state.y) / elapsed;
		state.y = y;
		state.time = event.timeStamp;
		sheet.current.style.transform = `translate3d(0, ${y}px, 0)`;
	};
	const onPointerUp = () => {
		const state = drag.current;
		const panel = sheet.current;
		drag.current = null;
		if (!state || !panel) return;
		panel.style.transition = "";
		const dismiss = state.y > Math.min(140, panel.offsetHeight * 0.3) || (state.y > 20 && state.velocity > 0.5);
		// Dismissing: leave the panel where it is; the exit animation runs from there.
		if (dismiss) onClose();
		else panel.style.transform = "";
	};

	return (
		<dialog
			aria-label={`${site.store.name} cart`}
			className={styles.drawer}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onCancel={(event) => {
				// Esc: animate out instead of the browser's instant close.
				event.preventDefault();
				onClose();
			}}
			onClose={onClose}
			ref={dialog}
		>
			<div className={styles.drawerPanel} ref={sheet}>
				<div aria-hidden="true" className={styles.drawerGrab} onPointerCancel={onPointerUp} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
					<span />
				</div>
				<header className={styles.drawerHead}>
					<h2>Your cart {cart.itemCount ? <span>({cart.itemCount})</span> : null}</h2>
					<button aria-label="Close cart" className={styles.iconButton} onClick={onClose} type="button"><X size={20} /></button>
				</header>
				{cart.lines.length ? (
					<>
						<div className={styles.drawerScroll}>
							<FreeShippingMeter total={cart.pricing.total} />
							<CartLines lines={cart.lines} onNavigate={onClose} site={site} />
							<OtherItemsNote count={cart.otherCount} />
							{picks.length ? (
								<DrawerPicks onNavigate={onClose} picks={picks} site={site} title={remaining > 0 ? "Unlock free shipping with one of these" : "You might also like"} />
							) : null}
						</div>
						<footer className={styles.drawerFoot}>
							<div className={styles.sumRow}><span>Subtotal</span><strong>{money(cart.pricing.total)}</strong></div>
							{/* Only while open: shipping methods are fetched for shoppers who look, not every page view. */}
							{open ? <DeliveryEstimate compact /> : null}
							<p className={styles.muted}>Shipping is calculated at checkout.</p>
							<Link aria-disabled={cart.issues.length > 0 || undefined} className={`${styles.button} ${styles.drawerCheckout}`} href={site.href("/checkout")} onClick={(event) => (cart.issues.length ? event.preventDefault() : onClose())}>
								<Lock size={16} /> Checkout · {money(cart.pricing.total)}
							</Link>
							{cart.issues.length ? <p className={styles.cartLineProblem} role="alert">{cart.issues[0]}</p> : null}
							<Link className={styles.drawerLink} href={site.href("/cart")} onClick={onClose}>View full cart</Link>
							<p className={styles.drawerPay}>
								<Lock aria-hidden="true" size={13} />
								<span className="visually-hidden">Secure checkout. We accept:</span>
								{PAYMENT_METHODS.map((method) => <span key={method}>{method}</span>)}
							</p>
						</footer>
					</>
				) : (
					<div className={styles.drawerScroll}>
						<EmptyCart onShop={onClose} site={site} />
						<OtherItemsNote count={cart.otherCount} />
					</div>
				)}
			</div>
		</dialog>
	);
}

/**
 * Products to add next: while free shipping isn't reached, the cheapest ones
 * that would unlock it come first (then the rest by price); once it is, the
 * store's featured picks. Never something already in the cart.
 */
function useCartSuggestions(listings: PublicListing[], lines: CartProduct[], remaining: number) {
	return useMemo(() => {
		const inCart = new Set(lines.map((line) => line.slug).filter(Boolean));
		const candidates = listings.filter((listing) => listing.inStock && !inCart.has(listing.productSlug));
		if (remaining > 0) {
			const unlocks = candidates.filter((listing) => listing.price >= remaining).sort((a, b) => a.price - b.price);
			const rest = candidates.filter((listing) => listing.price < remaining).sort((a, b) => b.price - a.price);
			return [...unlocks, ...rest].slice(0, 8);
		}
		return [...candidates].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8);
	}, [lines, listings, remaining]);
}

/** A few one-tap additions in the drawer - the ones that unlock free shipping first. */
function DrawerPicks({ onNavigate, picks, site, title }: { onNavigate: () => void; picks: StoreSearchItem[]; site: StoreSite; title: string }) {
	const { addToCart } = useStoreCart();
	const [added, setAdded] = useState<string | null>(null);
	return (
		<section aria-label={title} className={styles.drawerPicks}>
			<h3>{title}</h3>
			<ul>
				{picks.map((pick) => (
					<li key={pick.slug}>
						<Link aria-hidden="true" className={styles.drawerPickThumb} href={storeHref(site.basePath, `/${pick.slug}`)} onClick={onNavigate} tabIndex={-1}>
							<ProductImage alt="" sizes="56px" src={pick.imageUrl} />
						</Link>
						<div className={styles.drawerPickBody}>
							<Link href={storeHref(site.basePath, `/${pick.slug}`)} onClick={onNavigate}>{pick.name}</Link>
							<span>{money(pick.price)}</span>
						</div>
						<button
							aria-label={`Add ${pick.name} to cart`}
							className={styles.drawerPickAdd}
							onClick={() => {
								addToCart({ cartId: pick.cartId, imageUrl: pick.imageUrl, listingId: pick.listingId, name: pick.name, price: pick.price, productId: pick.productId, slug: pick.slug, stock: pick.stock, store: { handle: site.store.handle, name: site.store.name } });
								setAdded(pick.slug);
							}}
							type="button"
						>
							{added === pick.slug ? <Check size={16} /> : <Plus size={16} />}
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}

/** /cart inside a store: the same lines, as a page with a summary beside them. */
export function StoreCartPage({ listings = [] }: { listings?: PublicListing[] }) {
	const site = useStoreSite();
	const cart = useStoreCartLines(site?.store.handle ?? "");
	const remaining = getFreeShippingRemaining(cart.pricing.total, useStorePolicy().freeShipping);
	const suggestions = useCartSuggestions(listings, cart.lines, remaining);
	// Phones: a checkout bar slides up whenever the summary's button is off screen.
	const [checkoutVisible, setCheckoutVisible] = useState(true);
	const observer = useRef<IntersectionObserver | null>(null);
	const checkoutRef = useCallback((element: HTMLAnchorElement | null) => {
		observer.current?.disconnect();
		observer.current = null;
		if (!element || typeof IntersectionObserver === "undefined") return;
		const next = new IntersectionObserver(([entry]) => setCheckoutVisible(entry.isIntersecting), { threshold: 0.5 });
		next.observe(element);
		observer.current = next;
	}, []);
	useEffect(() => () => observer.current?.disconnect(), []);
	if (!site) return null;
	const blocked = cart.issues.length > 0;

	return (
		<div className={styles.flowPage}>
			<div className={styles.container}>
				<div className={styles.cartHeading}>
					<h1 className={styles.flowTitle}>Your cart</h1>
					{cart.hydrated && cart.lines.length ? <span className={styles.muted}>{cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}</span> : null}
				</div>
				{!cart.hydrated ? (
					<div className={styles.cartLayout}>
						<div className={styles.flowSkeleton} style={{ height: 320 }} />
						<div className={styles.flowSkeleton} style={{ height: 220 }} />
					</div>
				) : cart.lines.length ? (
					<div className={styles.cartLayout}>
						<section aria-label="Items" className={styles.flowCard}>
							<FreeShippingMeter total={cart.pricing.total} />
							<CartLines lines={cart.lines} site={site} />
							<OtherItemsNote count={cart.otherCount} />
						</section>
						<aside aria-label="Cart total" className={`${styles.flowCard} ${styles.cartSummary}`}>
							<div className={styles.sumRow}><span>Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})</span><strong>{money(cart.pricing.subtotal)}</strong></div>
							{cart.pricing.discount > 0 ? <div className={styles.sumRow}><span>Bundle savings</span><strong>-{money(cart.pricing.discount)}</strong></div> : null}
							<div className={`${styles.sumRow} ${styles.sumTotal}`}><span>Total</span><strong>{money(cart.pricing.total)}</strong></div>
							<p className={styles.muted}>Shipping is calculated at checkout.</p>
							{blocked ? <p className={styles.cartLineProblem} role="alert">{cart.issues[0]}</p> : null}
							<Link aria-disabled={blocked || undefined} className={`${styles.button} ${styles.drawerCheckout}`} href={site.href("/checkout")} onClick={(event) => blocked && event.preventDefault()} ref={checkoutRef}>
								<Lock size={16} /> Checkout
							</Link>
							<Link className={styles.drawerLink} href={`${site.href()}#shop`}>Continue shopping</Link>
							<DeliveryEstimate />
							<ul aria-label="Shopping with us" className={styles.cartAssure}>
								<li><ShieldCheck aria-hidden="true" size={16} /> Secure, encrypted checkout</li>
								<li><RotateCcw aria-hidden="true" size={16} /> Easy returns</li>
								<li className={styles.cartPay}>
									<CreditCard aria-hidden="true" size={16} />
									<span className="visually-hidden">We accept:</span>
									{PAYMENT_METHODS.map((method) => <span key={method}>{method}</span>)}
								</li>
							</ul>
						</aside>
					</div>
				) : (
					<section className={styles.flowCard}>
						<EmptyCart site={site} />
						<OtherItemsNote count={cart.otherCount} />
					</section>
				)}
			</div>

			{cart.hydrated && suggestions.length ? (
				remaining > 0 && cart.lines.length ? (
					<ProductRail basePath={site.basePath} eyebrow={`Add ${money(remaining)} more`} listings={suggestions} store={site.store} title="Unlock free shipping" />
				) : (
					<ProductRail basePath={site.basePath} eyebrow="Handpicked" listings={suggestions} store={site.store} title={cart.lines.length ? "You might also like" : `Popular in ${site.store.name}`} />
				)
			) : null}

			{cart.hydrated && cart.lines.length ? (
				<div aria-hidden={checkoutVisible} className={`${styles.payBar} ${styles.cartBar}`} data-show={!checkoutVisible || undefined} inert={checkoutVisible}>
					<span><small>Total</small><strong>{money(cart.pricing.total)}</strong></span>
					<Link aria-disabled={blocked || undefined} className={styles.button} href={site.href("/checkout")} onClick={(event) => blocked && event.preventDefault()}>
						<Lock size={16} /> Checkout
					</Link>
				</div>
			) : null}
		</div>
	);
}
