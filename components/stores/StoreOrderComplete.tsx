"use client";

import { ArrowRight, Banknote, CalendarClock, Check, Copy, Mail, MapPin, MessageCircle, Package, Printer, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductImage from "@/components/seller/ProductImage";
import { money } from "@/components/seller/sellerApi";
import { useCheckoutDetails } from "@/hooks/use-checkout-details";
import { readLastOrder, type LastOrder } from "@/lib/lastOrder";
import { daysFromEstimate, etaRange } from "./DeliveryEstimate";
import type { PublicListing } from "./StoreHome";
import { ProductRail } from "./StoreProductCard";
import { whatsappChatUrl } from "./StoreShell";
import { useStoreSite } from "./storeSite";
import styles from "./storefront.module.css";

/**
 * The store's own thank-you page. Details come from the buyer's browser
 * (lib/lastOrder.ts), never looked up by order number, so a shared link
 * shows nothing personal.
 */
export default function StoreOrderComplete({ listings = [], orderNumber }: { listings?: PublicListing[]; orderNumber: string }) {
	const site = useStoreSite()!;
	const [order, setOrder] = useState<LastOrder | null | undefined>(undefined);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage only exists on the client
		setOrder(readLastOrder(orderNumber));
		// The order is in: forget the address/contact details for this tab.
		useCheckoutDetails.getState().reset();
	}, [orderNumber]);

	const firstName = order?.customerName.split(/\s+/)[0];
	// Arrival window from when the order was placed (not from whenever this page is reopened).
	const days = order?.shippingMethod?.estimate ? daysFromEstimate(order.shippingMethod.estimate) : null;
	const placedAt = order ? Date.parse(order.placedAt) : NaN;
	const arrives = days && Number.isFinite(placedAt) ? etaRange(days, placedAt) : null;
	const cashOnDelivery = /cash on delivery/i.test(order?.paymentMethod ?? "");
	// Keep shopping: in-stock products they didn't just buy, featured first.
	const picks = useMemo(() => {
		const bought = new Set((order?.items ?? []).map((item) => item.title));
		return listings.filter((listing) => listing.inStock && !bought.has(listing.productName)).sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8);
	}, [listings, order]);
	const copy = async () => {
		await navigator.clipboard?.writeText(orderNumber);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1800);
	};

	return (
		<div className={styles.flowPage}>
			<div className={`${styles.container} ${styles.doneWrap}`}>
				<section className={`${styles.flowCard} ${styles.doneHero}`}>
					<span aria-hidden="true" className={styles.doneTick}><Check size={30} strokeWidth={3} /></span>
					<p className={styles.eyebrow}>Order confirmed</p>
					<h1 className={styles.flowTitle}>Thank you{firstName ? `, ${firstName}` : ""}!</h1>
					<p className={styles.muted}>
						{order?.email ? <>A confirmation is on its way to <strong>{order.email}</strong>.</> : <>Your order with {site.store.name} is in.</>}
					</p>
					{orderNumber ? (
						<button className={styles.orderChip} onClick={() => void copy()} type="button">
							Order <strong>{orderNumber}</strong> {copied ? <Check size={14} /> : <Copy size={14} />}
							<span className="visually-hidden">{copied ? "Copied" : "Copy order number"}</span>
						</button>
					) : null}
					<ol className={styles.doneTimeline}>
						<li data-done=""><span><Check size={14} /></span>Order placed</li>
						<li><span><Package size={14} /></span>Packed by Avokarto</li>
						<li><span><Truck size={14} /></span>{arrives ? <p className={styles.doneStepText}>Arrives <strong>{arrives}</strong></p> : "On its way"}</li>
					</ol>
					<div className={styles.contactRow}>
						<Link className={styles.button} href={site.href()}>Continue shopping <ArrowRight size={18} /></Link>
						{site.store.whatsapp ? (
							<a
								className={styles.buttonWhatsapp}
								href={whatsappChatUrl(site.store.whatsapp, `Hi ${site.store.name}! I just placed order ${orderNumber}.`)}
								rel="noopener noreferrer"
								target="_blank"
							>
								<MessageCircle size={18} /> Message {site.store.name}
							</a>
						) : null}
						{order ? (
							<button className={`${styles.buttonGhost} ${styles.donePrint}`} onClick={() => window.print()} type="button">
								<Printer size={18} /> Print receipt
							</button>
						) : null}
					</div>
				</section>

				{order ? (
					<div className={styles.doneGrid}>
						<section className={styles.flowCard}>
							<h2 className={styles.summaryTitle}>What you ordered</h2>
							<ul className={styles.cartLines}>
								{order.items.map((item, index) => (
									<li className={styles.cartLine} key={`${item.title}-${index}`}>
										<span className={styles.cartThumb}>
											{item.imgSrc ? <ProductImage alt="" sizes="88px" src={item.imgSrc} /> : null}
											<span className={styles.cartQtyBadge}>{item.quantity}</span>
										</span>
										<div className={styles.cartLineBody}>
											<span className={styles.cartLineName}>{item.title}</span>
											<span className={styles.cartLineUnit}>{money(item.unitPrice)} × {item.quantity}</span>
										</div>
										<span className={styles.cartLineTotal}>{money(item.unitPrice * item.quantity)}</span>
									</li>
								))}
							</ul>
							<dl className={styles.sumList}>
								<div className={styles.sumRow}><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
								{order.bundleDiscount > 0 ? <div className={styles.sumRow}><dt>Bundle savings</dt><dd>-{money(order.bundleDiscount)}</dd></div> : null}
								<div className={styles.sumRow}><dt>Shipping</dt><dd>{order.shippingCost === 0 ? "Free" : money(order.shippingCost)}</dd></div>
								<div className={`${styles.sumRow} ${styles.sumTotal}`}><dt>Total</dt><dd>{money(order.total)}</dd></div>
							</dl>
						</section>
						<section className={`${styles.flowCard} ${styles.doneFacts}`}>
							<div>
								<h3><MapPin size={16} /> Delivering to</h3>
								<p>{order.customerName}</p>
								{order.addressLines.map((line) => <p className={styles.muted} key={line}>{line}</p>)}
							</div>
							{order.shippingMethod ? (
								<div>
									<h3><Truck size={16} /> Shipping</h3>
									<p>{order.shippingMethod.name}</p>
									{arrives ? (
										<p className={styles.doneEta}><CalendarClock aria-hidden="true" size={14} /> Arrives {arrives} <span className={styles.muted}>({order.shippingMethod.estimate})</span></p>
									) : order.shippingMethod.estimate ? (
										<p className={styles.muted}>{order.shippingMethod.estimate}</p>
									) : null}
								</div>
							) : null}
							<div>
								<h3><Mail size={16} /> Contact</h3>
								<p>{order.email}</p>
								{order.phone ? <p className={styles.muted}>{order.phone}</p> : null}
							</div>
							<div>
								<h3>Payment</h3>
								<p>{order.paymentMethod}</p>
								{cashOnDelivery ? (
									<p className={styles.doneCod}><Banknote aria-hidden="true" size={14} /> Have {money(order.total)} ready when it arrives.</p>
								) : null}
							</div>
						</section>
					</div>
				) : order === null ? (
					<p className={`${styles.muted} ${styles.doneNote}`}>Your order details are in your confirmation email.</p>
				) : null}
			</div>
			{picks.length ? (
				<div className={styles.donePicks}>
					<ProductRail basePath={site.basePath} eyebrow={`More from ${site.store.name}`} listings={picks} store={site.store} title="Keep shopping" />
				</div>
			) : null}
		</div>
	);
}
