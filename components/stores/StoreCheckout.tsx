"use client";

import { Banknote, CalendarClock, Check, ChevronDown, CreditCard, Loader2, Lock, MessageCircle, RotateCcw, ShieldCheck, Smartphone, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { money } from "@/components/seller/sellerApi";
import { useCartCatalog } from "@/components/store/CartCatalogProvider";
import { useCheckoutDetails, useCheckoutDetailsHydrated, type CheckoutDetails } from "@/hooks/use-checkout-details";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useShippingMethods } from "@/hooks/use-shipping-methods";
import { saveLastOrder, type LastOrderItem } from "@/lib/lastOrder";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getShippingCost } from "@/lib/shippingPolicy";
import { etaDays, etaRange } from "./DeliveryEstimate";
import { CartLines, FreeShippingMeter } from "./StoreCart";
import { PAYMENT_METHODS } from "./StoreFooter";
import { whatsappChatUrl } from "./StoreShell";
import { storeHref, useStoreCartLines, useStoreSite } from "./storeSite";
import styles from "./storefront.module.css";

// Same labels Avokarto's checkout sends, so orders read the same in admin.
const PAYMENT_OPTIONS = [
	{ icon: CreditCard, key: "card", label: "Credit or debit card", note: "Visa, Mastercard, Amex" },
	{ icon: Wallet, key: "paypal", label: "PayPal", note: "Pay with your PayPal account" },
	{ icon: Smartphone, key: "googlepay", label: "Google Pay", note: "Fast, on supported devices" },
	{ icon: Banknote, key: "cod", label: "Cash on delivery", note: "Pay when it arrives" },
] as const;

const COUNTRIES = ["United States", "India", "United Kingdom", "Canada", "Australia", "Germany", "France", "United Arab Emirates", "Singapore"];

type FieldKey = "address1" | "city" | "email" | "name" | "postcode";
const FIELD_ORDER: FieldKey[] = ["email", "name", "address1", "city", "postcode"];

function fieldErrors(details: CheckoutDetails): Partial<Record<FieldKey, string>> {
	const errors: Partial<Record<FieldKey, string>> = {};
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim())) errors.email = "Enter an email like you@example.com - your receipt goes there.";
	if (details.name.trim().length < 2) errors.name = "Enter the name for the delivery.";
	if (!details.address1.trim()) errors.address1 = "Enter the street address.";
	if (!details.city.trim()) errors.city = "Enter the city.";
	if (!details.postcode.trim()) errors.postcode = "Enter the postcode.";
	return errors;
}

// Common email domains, for a gentle "did you mean …?" on typos (gmial.com).
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "live.com", "proton.me", "protonmail.com", "yahoo.co.in", "rediffmail.com"];

function editDistance(a: string, b: string) {
	const row = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i++) {
		let previous = row[0];
		row[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const current = row[j];
			row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
			previous = current;
		}
	}
	return row[b.length];
}

/** "you@gmial.com" → "you@gmail.com"; null when it looks fine or isn't close to a known domain. */
function suggestEmail(email: string) {
	const match = /^([^\s@]+)@([^\s@]+\.[^\s@]+)$/.exec(email.trim().toLowerCase());
	if (!match || EMAIL_DOMAINS.includes(match[2])) return null;
	const close = EMAIL_DOMAINS.find((domain) => editDistance(match[2], domain) <= 2);
	return close ? `${match[1]}@${close}` : null;
}

/** The shopper's country name from their browser's region (en-IN → India), for a sensible default. */
function localeCountry() {
	try {
		const region = new Intl.Locale(navigator.language).maximize().region;
		return region ? new Intl.DisplayNames(["en"], { type: "region" }).of(region) ?? "" : "";
	} catch {
		return "";
	}
}

const subscribeOnline = (onChange: () => void) => {
	window.addEventListener("online", onChange);
	window.addEventListener("offline", onChange);
	return () => {
		window.removeEventListener("online", onChange);
		window.removeEventListener("offline", onChange);
	};
};

// A lost response must not invite a duplicate order: after this long we stop
// waiting and ask the shopper to check their email before trying again.
const ORDER_TIMEOUT_MS = 30_000;

type CheckoutResponse = {
	data?: { bundleDiscount?: number; items?: LastOrderItem[]; orderNumber?: string; shippingCost?: number; subtotal?: number; total?: number };
	error?: { code?: string; message?: string };
};

/**
 * The store's own one-page checkout. Looks and feels like the seller's site
 * (theme, colours, logo); underneath it places exactly the order Avokarto's
 * checkout would - same /api/checkout payload, prices and stock checks -
 * for this store's items, credited to the store.
 */
export default function StoreCheckout() {
	const site = useStoreSite()!;
	const router = useRouter();
	const formId = useId();
	const cart = useStoreCartLines(site.store.handle);
	const catalog = useCartCatalog();
	const details = useCheckoutDetails();
	const detailsHydrated = useCheckoutDetailsHydrated();
	const customer = useCustomerSession((state) => state.customer);
	const shipping = useShippingMethods();
	const [payment, setPayment] = useState<(typeof PAYMENT_OPTIONS)[number]["key"]>("card");
	// Admin -> Settings -> Payments / Shipping. A switched-off method isn't offered;
	// if the shopper's pick goes away, the first one still on is used.
	const policy = useStorePolicy();
	const paymentOptions = PAYMENT_OPTIONS.filter((option) => policy.paymentMethods.includes(option.key));
	const activePayment = paymentOptions.some((option) => option.key === payment) ? payment : (paymentOptions[0]?.key ?? payment);
	const [accepted, setAccepted] = useState(false);
	const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
	const [submitted, setSubmitted] = useState(false);
	const [placing, setPlacing] = useState(false);
	const [placed, setPlaced] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [summaryOpen, setSummaryOpen] = useState(false);
	const [noteOpen, setNoteOpen] = useState(Boolean(details.notes));
	const [mainButtonVisible, setMainButtonVisible] = useState(true);
	const buttonObserver = useRef<IntersectionObserver | null>(null);
	const placingRef = useRef(false);
	const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

	// No country yet? Start from the browser's region.
	useEffect(() => {
		if (!detailsHydrated) return;
		const state = useCheckoutDetails.getState();
		if (!state.country) {
			const country = localeCountry();
			if (country) state.setField("country", country);
		}
	}, [detailsHydrated]);

	// Closing the tab mid-order would leave the shopper unsure whether it went through.
	useEffect(() => {
		if (!placing) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [placing]);

	// Signed in? Start from the account's name and email.
	useEffect(() => {
		if (!customer || !detailsHydrated) return;
		const state = useCheckoutDetails.getState();
		if (!state.name) state.setField("name", customer.name);
		if (!state.email) state.setField("email", customer.email);
	}, [customer, detailsHydrated]);

	// Pick the first shipping option when none (or a retired one) is chosen.
	useEffect(() => {
		if (!detailsHydrated || shipping.loading || shipping.error || !shipping.methods.length) return;
		const state = useCheckoutDetails.getState();
		if (!shipping.methods.some((method) => method.id === state.shippingMethodId)) state.setField("shippingMethodId", shipping.methods[0].id);
	}, [detailsHydrated, shipping.error, shipping.loading, shipping.methods]);

	// Phones: a pay bar slides up whenever the real button is off screen. A
	// callback ref, so it attaches whenever the button actually mounts (after
	// the loading placeholder, an empty cart, …).
	const mainButton = useCallback((button: HTMLButtonElement | null) => {
		buttonObserver.current?.disconnect();
		buttonObserver.current = null;
		if (!button || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(([entry]) => setMainButtonVisible(entry.isIntersecting), { threshold: 0.4 });
		observer.observe(button);
		buttonObserver.current = observer;
	}, []);
	useEffect(() => () => buttonObserver.current?.disconnect(), []);

	const errors = fieldErrors(details);
	const show = (key: FieldKey) => (touched[key] || submitted) && errors[key] ? errors[key] : undefined;
	// Wires an input to its error message for screen readers.
	const describe = (key: FieldKey) => ({
		"aria-describedby": show(key) ? `${formId}-${key}-msg` : undefined,
		"aria-invalid": Boolean(show(key)),
		"aria-required": true,
	});
	const emailSuggestion = (touched.email || submitted) && !errors.email ? suggestEmail(details.email) : null;
	const missingCount = FIELD_ORDER.filter((key) => errors[key]).length;
	const method = shipping.methods.find((entry) => entry.id === details.shippingMethodId);
	const merchandise = cart.pricing.total;
	const shippingCost = method ? getShippingCost(merchandise, method.price, policy.freeShipping) : undefined;
	const total = merchandise + (shippingCost ?? 0);
	const catalogReady = !catalog.loading && !catalog.error && cart.issues.length === 0;
	const contactDone = !errors.email;
	const deliveryDone = !errors.name && !errors.address1 && !errors.city && !errors.postcode;
	const arrival = method ? etaDays(method) : null;
	// What still needs the shopper: their details and the terms (shipping and payment have defaults).
	const progress = [
		{ done: contactDone, label: "Contact" },
		{ done: deliveryDone, label: "Delivery" },
		{ done: Boolean(method), label: "Shipping" },
		{ done: accepted, label: "Review" },
	];
	const doneSteps = progress.filter((step) => step.done).length;

	if (placed) {
		return (
			<div className={styles.flowPage}>
				<div className={`${styles.container} ${styles.placingState}`}>
					<Loader2 className={styles.spin} size={30} />
					<p>Confirming your order…</p>
				</div>
			</div>
		);
	}

	// Until the saved cart is read, show the page's shape - never a $0 total.
	if (!cart.hydrated) {
		return (
			<div className={styles.checkout}>
				<div className={`${styles.container} ${styles.checkoutGrid}`}>
					<div className={styles.checkoutForm}>
						<div className={styles.flowSkeleton} style={{ height: 44, maxWidth: 260 }} />
						<div className={styles.flowSkeleton} style={{ height: 180 }} />
						<div className={styles.flowSkeleton} style={{ height: 320 }} />
					</div>
					<div className={`${styles.flowSkeleton} ${styles.summarySkeleton}`} />
				</div>
			</div>
		);
	}

	if (cart.hydrated && !cart.lines.length) {
		return (
			<div className={styles.flowPage}>
				<div className={styles.container}>
					<section className={`${styles.flowCard} ${styles.cartEmpty}`}>
						<h1 className={styles.flowTitle}>Your cart is empty</h1>
						<p className={styles.muted}>Add something from {site.store.name} to check out.</p>
						<Link className={styles.button} href={`${site.href()}#shop`}>Back to the shop</Link>
					</section>
				</div>
			</div>
		);
	}

	const touch = (key: FieldKey) => setTouched((current) => ({ ...current, [key]: true }));
	const input = (key: keyof CheckoutDetails) => ({
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => details.setField(key, event.target.value),
		value: details[key],
	});

	async function place() {
		if (placingRef.current) return;
		placingRef.current = true;
		setPlacing(true);
		setError(null);
		const address = { address1: details.address1, city: details.city, country: details.country, postcode: details.postcode, state: details.state };
		try {
			const controller = new AbortController();
			const timer = window.setTimeout(() => controller.abort(), ORDER_TIMEOUT_MS);
			const response = await fetch("/api/checkout", {
				body: JSON.stringify({
					billingAddress: address,
					customerEmail: details.email,
					customerName: details.name,
					customerPhone: details.phone,
					expectedTotals: { shippingCost: shippingCost ?? 0, subtotal: merchandise, total },
					items: cart.lines.map((line) => ({
						expectedUnitPrice: line.price,
						id: line.id,
						quantity: line.quantity,
						...(line.bundleId ? { bundleId: line.bundleId } : {}),
						...(line.resellerListingId ? { resellerListingId: line.resellerListingId } : {}),
					})),
					notes: details.notes,
					paymentMethod: PAYMENT_OPTIONS.find((option) => option.key === activePayment)?.label ?? "pending",
					shippingAddress: address,
					shippingMethodId: details.shippingMethodId,
				}),
				cache: "no-store",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				method: "POST",
				signal: controller.signal,
			}).finally(() => window.clearTimeout(timer));
			const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;
			if (!response.ok) {
				// Price, stock or shipping changed underneath us: refresh and let the shopper re-confirm.
				if (payload.error?.code?.startsWith("CHECKOUT_")) {
					setAccepted(false);
					await Promise.allSettled([catalog.refresh(), shipping.refresh()]);
				}
				throw new Error(payload.error?.message ?? "We couldn't place your order. Please try again.");
			}
			const orderNumber = payload.data?.orderNumber ?? "";
			if (!orderNumber) throw new Error("The order confirmation is incomplete. Your cart has been kept.");

			saveLastOrder({
				addressLines: [details.address1, [details.city, details.state, details.postcode].filter(Boolean).join(", "), details.country].map((line) => line.trim()).filter(Boolean),
				bundleDiscount: payload.data?.bundleDiscount ?? cart.pricing.discount,
				customerName: details.name.trim(),
				email: details.email.trim(),
				items:
					payload.data?.items ??
					cart.lines.map((line) => ({
						href: line.slug ? storeHref(site.basePath, `/${line.slug}`) : undefined,
						imgSrc: line.imgSrc,
						quantity: line.quantity,
						title: line.title,
						unitPrice: cart.pricing.discountedUnitPrice.get(String(line.id)) ?? line.price,
					})),
				orderNumber,
				paymentMethod: PAYMENT_OPTIONS.find((option) => option.key === activePayment)?.label ?? "pending",
				phone: details.phone.trim() || undefined,
				placedAt: new Date().toISOString(),
				shippingCost: payload.data?.shippingCost ?? shippingCost ?? 0,
				shippingMethod: method ? { estimate: method.deliveryEstimate, name: method.name } : undefined,
				subtotal: payload.data?.subtotal ?? merchandise,
				total: payload.data?.total ?? total,
			});
			setPlaced(true);
			cart.clearStoreLines();
			router.replace(site.href(`/checkout/complete?order=${encodeURIComponent(orderNumber)}`));
		} catch (caught) {
			if (caught instanceof DOMException && caught.name === "AbortError") {
				setError("This is taking longer than usual and your order may still go through. Check your email for a confirmation before trying again.");
			} else if (caught instanceof TypeError) {
				setError("We couldn't reach the store. Check your connection, then try again - if a confirmation email arrives, your order went through.");
			} else {
				setError(caught instanceof Error ? caught.message : "We couldn't place your order. Please try again.");
			}
		} finally {
			placingRef.current = false;
			setPlacing(false);
		}
	}

	const onSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitted(true);
		const firstInvalid = FIELD_ORDER.find((key) => errors[key]);
		const focus = (id: string) => {
			const element = document.getElementById(id);
			element?.scrollIntoView({ behavior: "smooth", block: "center" });
			element?.focus({ preventScroll: true });
		};
		if (firstInvalid) return focus(`${formId}-${firstInvalid}`);
		if (!method) return focus(`${formId}-shipping`);
		if (!accepted) return focus(`${formId}-terms`);
		if (!catalogReady) return setError(cart.issues[0] ?? "Checking prices and stock - one moment.");
		if (!online) return setError("You're offline. Reconnect to place your order - your details are saved.");
		void place();
	};

	const summary = (
		<>
			<CartLines editable={false} lines={cart.lines} site={site} />
			<Link className={styles.drawerLink} href={site.href("/cart")}>Edit cart</Link>
			<dl className={styles.sumList}>
				<div className={styles.sumRow}><dt>Subtotal</dt><dd>{money(cart.pricing.subtotal)}</dd></div>
				{cart.pricing.discount > 0 ? <div className={styles.sumRow}><dt>Bundle savings</dt><dd>-{money(cart.pricing.discount)}</dd></div> : null}
				<div className={styles.sumRow}>
					<dt>Shipping{method ? ` · ${method.name}` : ""}</dt>
					<dd>{shippingCost === undefined ? "Choose below" : shippingCost === 0 ? "Free" : money(shippingCost)}</dd>
				</div>
				{arrival ? <div className={`${styles.sumRow} ${styles.sumEta}`}><dt><CalendarClock aria-hidden="true" size={14} /> Estimated arrival</dt><dd>{etaRange(arrival)}</dd></div> : null}
				<div className={`${styles.sumRow} ${styles.sumTotal}`}><dt>Total</dt><dd>{money(total)}</dd></div>
			</dl>
			<FreeShippingMeter total={merchandise} />
			<ul className={styles.checkoutTrust}>
				<li><ShieldCheck size={16} /> Secure, encrypted checkout</li>
				<li><Truck size={16} /> Packed &amp; tracked by Avokarto</li>
			</ul>
			{site.store.whatsapp ? (
				<a className={styles.drawerLink} href={whatsappChatUrl(site.store.whatsapp, `Hi ${site.store.name}! I have a question before I order.`)} rel="noopener noreferrer" target="_blank">
					<MessageCircle size={14} /> Questions? Chat with {site.store.name}
				</a>
			) : null}
		</>
	);

	return (
		<div className={styles.checkout}>
			<div className={styles.container}>
				<div className={styles.checkoutGrid}>
					{/* Summary: a collapsible bar on phones, a sticky card on desktop. */}
					<aside aria-label="Order summary" className={styles.checkoutSummary} data-open={summaryOpen || undefined}>
						<button aria-expanded={summaryOpen} className={styles.summaryToggle} onClick={() => setSummaryOpen((open) => !open)} type="button">
							<span>{summaryOpen ? "Hide" : "Show"} order summary <ChevronDown aria-hidden="true" size={16} /></span>
							<strong>{money(total)}</strong>
						</button>
						<div className={styles.summaryBody}>
							<h2 className={styles.summaryTitle}>Order summary <span>({cart.itemCount})</span></h2>
							{summary}
						</div>
					</aside>

					<form className={styles.checkoutForm} id={formId} noValidate onSubmit={onSubmit}>
						<div className={styles.checkoutHead}>
							<h1 className={styles.flowTitle}>Checkout</h1>
							<p aria-live="polite" className={styles.checkoutProgressText}>{doneSteps === progress.length ? "Ready to place your order" : `${doneSteps} of ${progress.length} done`}</p>
						</div>
						<ol aria-label="Checkout progress" className={styles.checkoutProgress}>
							{progress.map((step) => (
								<li data-done={step.done || undefined} key={step.label}>
									<span aria-hidden="true" />
									{step.label}
									<span className="visually-hidden">{step.done ? " (done)" : " (to do)"}</span>
								</li>
							))}
						</ol>

						<Step done={contactDone} number={1} title="Contact">
							<Field error={show("email")} id={`${formId}-email`} label="Email">
								<input {...input("email")} {...describe("email")} autoComplete="email" className={styles.input} enterKeyHint="next" id={`${formId}-email`} inputMode="email" maxLength={254} onBlur={() => touch("email")} placeholder="you@example.com" spellCheck={false} type="email" />
							</Field>
							{emailSuggestion ? (
								<button className={styles.textButton} onClick={() => details.setField("email", emailSuggestion)} type="button">
									Did you mean <strong>{emailSuggestion}</strong>?
								</button>
							) : null}
							<Field hint="Optional - for delivery updates" id={`${formId}-phone`} label="Phone">
								<input {...input("phone")} aria-describedby={`${formId}-phone-msg`} autoComplete="shipping tel" className={styles.input} enterKeyHint="next" id={`${formId}-phone`} inputMode="tel" maxLength={40} type="tel" />
							</Field>
						</Step>

						<Step done={deliveryDone} number={2} title="Delivery address">
							<div className={styles.fieldGrid}>
								<Field error={show("name")} id={`${formId}-name`} label="Full name" wide>
									<input {...input("name")} {...describe("name")} autoComplete="shipping name" className={styles.input} enterKeyHint="next" id={`${formId}-name`} maxLength={120} onBlur={() => touch("name")} />
								</Field>
								<Field error={show("address1")} id={`${formId}-address1`} label="Street address" wide>
									<input {...input("address1")} {...describe("address1")} autoComplete="shipping address-line1" className={styles.input} enterKeyHint="next" id={`${formId}-address1`} maxLength={200} onBlur={() => touch("address1")} placeholder="House number and street" />
								</Field>
								<Field error={show("city")} id={`${formId}-city`} label="City">
									<input {...input("city")} {...describe("city")} autoComplete="shipping address-level2" className={styles.input} enterKeyHint="next" id={`${formId}-city`} maxLength={100} onBlur={() => touch("city")} />
								</Field>
								<Field id={`${formId}-state`} label="State / province">
									<input {...input("state")} autoComplete="shipping address-level1" className={styles.input} enterKeyHint="next" id={`${formId}-state`} maxLength={100} />
								</Field>
								<Field error={show("postcode")} id={`${formId}-postcode`} label="Postcode">
									<input {...input("postcode")} {...describe("postcode")} autoCapitalize="characters" autoComplete="shipping postal-code" className={styles.input} enterKeyHint="next" id={`${formId}-postcode`} maxLength={20} onBlur={() => touch("postcode")} />
								</Field>
								<Field id={`${formId}-country`} label="Country">
									<input {...input("country")} autoComplete="shipping country-name" className={styles.input} enterKeyHint="done" id={`${formId}-country`} list={`${formId}-countries`} maxLength={80} />
									<datalist id={`${formId}-countries`}>{COUNTRIES.map((country) => <option key={country} value={country} />)}</datalist>
								</Field>
							</div>
						</Step>

						<Step done={Boolean(method)} number={3} title="Shipping">
							{shipping.error ? (
								<p className={styles.formAlert} role="alert">{shipping.error}</p>
							) : shipping.loading ? (
								<div className={styles.flowSkeleton} style={{ height: 64 }} />
							) : !shipping.methods.length ? (
								<p className={styles.formAlert}>No delivery options are available right now. Please check back shortly.</p>
							) : (
								<div aria-label="Shipping method" className={styles.choiceList} id={`${formId}-shipping`} role="radiogroup" tabIndex={-1}>
									{shipping.methods.map((option) => {
										const cost = getShippingCost(merchandise, option.price, policy.freeShipping);
										const days = etaDays(option);
										return (
											<label className={styles.choice} key={option.id}>
												<input checked={details.shippingMethodId === option.id} name="shipping-method" onChange={() => details.setField("shippingMethodId", option.id)} type="radio" />
												<span className={styles.choiceText}>
													<strong>{option.name}</strong>
													{days ? <span className={styles.choiceEta}><CalendarClock aria-hidden="true" size={13} /> Arrives {etaRange(days)}</span> : null}
													<small>{[option.description, days ? "" : option.deliveryEstimate].filter(Boolean).join(" · ")}</small>
												</span>
												<span className={styles.choicePrice}>{cost === 0 ? "Free" : money(cost)}</span>
											</label>
										);
									})}
								</div>
							)}
						</Step>

						<Step done={false} number={4} title="Payment">
							<div aria-label="Payment method" className={styles.payGrid} role="radiogroup">
								{paymentOptions.map((option) => (
									<label className={styles.payOption} key={option.key}>
										<input checked={activePayment === option.key} name="payment-method" onChange={() => setPayment(option.key)} type="radio" />
										<option.icon aria-hidden="true" size={20} />
										<span><strong>{option.label}</strong><small>{option.note}</small></span>
									</label>
								))}
							</div>
							<p className={styles.muted}><Lock aria-hidden="true" size={13} /> Payment is handled securely by Avokarto - {site.store.name} never sees your payment details.</p>
							{noteOpen ? (
								<Field id={`${formId}-notes`} label="Order note">
									<textarea className={`${styles.input} ${styles.textarea}`} id={`${formId}-notes`} maxLength={1000} onChange={(event) => details.setField("notes", event.target.value)} placeholder="Gift message, delivery instructions…" rows={3} value={details.notes} />
								</Field>
							) : (
								<button className={styles.textButton} onClick={() => setNoteOpen(true)} type="button">+ Add an order note</button>
							)}
						</Step>

						<div className={styles.placeOrder}>
							<label className={styles.terms}>
								<input checked={accepted} id={`${formId}-terms`} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
								<span>I accept the <a href="/terms-policy" rel="noopener" target="_blank">terms</a> and <a href="/return-policy" rel="noopener" target="_blank">return policy</a>.</span>
							</label>
							{submitted && !accepted ? <p className={styles.fieldError}>Please accept the terms to place your order.</p> : null}
							{submitted && missingCount ? <p className={styles.fieldError}>Please complete {missingCount} {missingCount === 1 ? "field" : "fields"} above.</p> : null}
							{!online ? <p className={styles.formAlert} role="status">You&apos;re offline. Your details are saved - reconnect to place your order.</p> : null}
							{error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
							{!error && cart.issues.length ? <p className={styles.formAlert} role="alert">{cart.issues[0]} <Link href={site.href("/cart")}>Update cart</Link></p> : null}
							<button className={`${styles.button} ${styles.placeButton}`} disabled={placing || !cart.hydrated} ref={mainButton} type="submit">
								{placing ? <Loader2 className={styles.spin} size={18} /> : <Lock size={18} />}
								{placing ? "Placing your order…" : `Place order · ${money(total)}`}
							</button>
							<ul aria-label="Shopping with us" className={styles.cartAssure}>
								<li><ShieldCheck aria-hidden="true" size={16} /> Secure, encrypted checkout</li>
								<li><RotateCcw aria-hidden="true" size={16} /> Easy returns · <Truck aria-hidden="true" size={16} /> Tracked delivery</li>
								<li className={styles.cartPay}>
									<CreditCard aria-hidden="true" size={16} />
									<span className="visually-hidden">We accept:</span>
									{PAYMENT_METHODS.map((name) => <span key={name}>{name}</span>)}
								</li>
							</ul>
						</div>
					</form>
				</div>
			</div>

			<div aria-hidden={mainButtonVisible} className={styles.payBar} data-show={!mainButtonVisible || undefined}>
				<span><small>Total</small><strong>{money(total)}</strong></span>
				<button className={styles.button} disabled={placing || !cart.hydrated} form={formId} tabIndex={mainButtonVisible ? -1 : 0} type="submit">
					<Lock size={16} /> Place order
				</button>
			</div>
		</div>
	);
}

function Step({ children, done, number, title }: { children: ReactNode; done: boolean; number: number; title: string }) {
	return (
		<section className={styles.step} data-done={done || undefined}>
			<h2 className={styles.stepTitle}>
				<span aria-hidden="true" className={styles.stepNum}>{done ? <Check size={14} /> : number}</span>
				{title}
			</h2>
			<div className={styles.stepBody}>{children}</div>
		</section>
	);
}

function Field({ children, error, hint, id, label, wide }: { children: ReactNode; error?: string; hint?: string; id: string; label: string; wide?: boolean }) {
	return (
		<div className={styles.field} data-wide={wide || undefined}>
			<label className={styles.fieldLabel} htmlFor={id}>{label}</label>
			{children}
			{error ? <p className={styles.fieldError} id={`${id}-msg`}>{error}</p> : hint ? <p className={styles.fieldHint} id={`${id}-msg`}>{hint}</p> : null}
		</div>
	);
}
