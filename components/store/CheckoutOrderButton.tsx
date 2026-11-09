"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useContextElement } from "@/context/Context";
import { useCheckoutDetails } from "@/hooks/use-checkout-details";
import { useCurrency } from "@/lib/currency";
import { getCartPricing } from "@/lib/cartQuantity";
import { saveLastOrder, type LastOrderItem } from "@/lib/lastOrder";
import { getProductDetailsHref } from "@/lib/productLinks";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getShippingCost } from "@/lib/shippingPolicy";
import { useCartCatalog } from "./CartCatalogProvider";

type CheckoutResponse = {
	data?: {
		orderNumber?: string;
		subtotal?: number;
		bundleDiscount?: number;
		shippingCost?: number;
		total?: number;
		items?: LastOrderItem[];
	};
	error?: {
		code?: string;
		message?: string;
	};
};

export default function CheckoutOrderButton({
	paymentMethod,
	shippingCost,
	shippingMethodName,
	shippingEstimate,
	onRefreshShipping,
}: {
	paymentMethod: string;
	shippingCost?: number;
	shippingMethodName?: string;
	shippingEstimate?: string;
	onRefreshShipping: () => Promise<void>;
}) {
	// Admin -> Settings -> Shipping: the live free-shipping rule.
	const { freeShipping } = useStorePolicy();
	const router = useRouter();
	const { ready: cartReady, refresh: refreshCart } = useCartCatalog();
	const submittingRef = useRef(false);
	const { cartProducts, mounted, setCartProducts, totalPrice } =
		useContextElement();
	const details = useCheckoutDetails();
	const { formatPrice } = useCurrency();
	const [accepted, setAccepted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const hasRequiredDetails = Boolean(
		details.name.trim() && details.email.trim() && details.address1.trim(),
	);
	const hasShippingMethod = Boolean(details.shippingMethodId) && shippingCost !== undefined;
	const canSubmit =
		mounted &&
		cartReady &&
		accepted &&
		cartProducts.length > 0 &&
		hasRequiredDetails &&
		hasShippingMethod &&
		!submitting;
	const effectiveShippingCost = getShippingCost(totalPrice, shippingCost ?? 0, freeShipping);
	const grandTotal = totalPrice + effectiveShippingCost;

	async function submitOrder() {
		if (!canSubmit || submittingRef.current) {
			return;
		}

		submittingRef.current = true;
		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/checkout", {
				body: JSON.stringify({
					billingAddress: {
						address1: details.address1,
						city: details.city,
						country: details.country,
						postcode: details.postcode,
						state: details.state,
					},
					customerEmail: details.email,
					customerName: details.name,
					customerPhone: details.phone,
					items: cartProducts.map((product) => ({
						id: product.id,
						quantity: product.quantity,
						expectedUnitPrice: product.price,
						...(product.bundleId ? { bundleId: product.bundleId } : {}),
						...(product.resellerListingId ? { resellerListingId: product.resellerListingId } : {}),
					})),
					notes: details.notes,
					paymentMethod,
					shippingAddress: {
						address1: details.address1,
						city: details.city,
						country: details.country,
						postcode: details.postcode,
						state: details.state,
					},
					shippingMethodId: details.shippingMethodId,
					expectedTotals: {
						subtotal: totalPrice,
						shippingCost: effectiveShippingCost,
						total: grandTotal,
					},
				}),
				cache: "no-store",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			});
			const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;

			if (!response.ok) {
				if (payload.error?.code?.startsWith("CHECKOUT_")) {
					setAccepted(false);
					await Promise.allSettled([refreshCart(), onRefreshShipping()]);
				}
				throw new Error(payload.error?.message ?? "Unable to place order.");
			}

			const orderNumber = payload.data?.orderNumber ?? "";
			if (!orderNumber) throw new Error("The order confirmation is incomplete. Your cart has been kept.");
			// Keep what the shopper just bought in their own browser for the
			// thank-you page (see lib/lastOrder.ts). Totals are the server's;
			// Line prices come from the committed order, including bundle discounts.
			if (orderNumber) {
				const pricing = getCartPricing(cartProducts);
				saveLastOrder({
					orderNumber,
					placedAt: new Date().toISOString(),
					customerName: details.name.trim(),
					email: details.email.trim(),
					phone: details.phone.trim() || undefined,
					addressLines: [
						details.address1,
						[details.city, details.state, details.postcode].filter(Boolean).join(", "),
						details.country,
					]
						.map((line) => line.trim())
						.filter(Boolean),
					shippingMethod: shippingMethodName
						? { name: shippingMethodName, estimate: shippingEstimate }
						: undefined,
					paymentMethod,
					items: payload.data?.items ?? cartProducts.map((product) => {
						const charged = pricing.discountedUnitPrice.get(String(product.id));
						return {
							title: product.title,
							imgSrc: product.imgSrc,
							href: getProductDetailsHref(product),
							quantity: product.quantity,
							unitPrice: charged ?? product.price,
							regularUnitPrice: charged !== undefined ? product.price : undefined,
						};
					}),
					subtotal: payload.data?.subtotal ?? pricing.total,
					bundleDiscount: payload.data?.bundleDiscount ?? pricing.discount,
					shippingCost: payload.data?.shippingCost ?? effectiveShippingCost,
					total: payload.data?.total ?? pricing.total + effectiveShippingCost,
				});
			}

			setCartProducts([]);
			// Don't clear the checkout details here: the payment page redirects
			// to /checkout-shipping as soon as they're empty, which beat this
			// navigation and sent shoppers back to the form after ordering.
			// The thank-you page clears them once it has mounted.
			router.replace(
				`/checkout-thankyou?order=${encodeURIComponent(payload.data?.orderNumber ?? "")}`,
			);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to place order.",
			);
		} finally {
			submittingRef.current = false;
			setSubmitting(false);
		}
	}

	return (
		<>
			<div className="form-check mb-lg-4">
				<input
					checked={accepted}
					className="form-check-input"
					id="accept-terms"
					onChange={(event) => setAccepted(event.target.checked)}
					type="checkbox"
				/>
				<label
					className="form-check-label nav align-items-center rbt-link-hover"
					htmlFor="accept-terms"
				>
					I accept the
					<Link className="nav-link ms-1 p-0" href="/terms-policy">
						Terms and Conditions
					</Link>
				</label>
			</div>
			{error ? (
				<p role="alert" className="mb--12 rounded-2 bg-danger-subtle px-3 py-2 text-danger">
					{error}
				</p>
			) : null}
			{mounted && cartProducts.length === 0 ? (
				<p className="mb--12 rounded-2 bg-warning-subtle px-3 py-2 text-warning-emphasis">
					Add items to your cart before placing an order.
				</p>
			) : null}
			{mounted && cartProducts.length > 0 && !hasRequiredDetails ? (
				<p className="mb--12 rounded-2 bg-warning-subtle px-3 py-2 text-warning-emphasis">
					Fill in your name, email, and address on the shipping step before
					placing an order.
				</p>
			) : null}
			{mounted && cartProducts.length > 0 && hasRequiredDetails && !hasShippingMethod ? (
				<p className="mb--12 rounded-2 bg-warning-subtle px-3 py-2 text-warning-emphasis">
					Choose a shipping method on the shipping step before placing an
					order.
				</p>
			) : null}
			<div className="text-center mt--12 text-center rbt-btn-area d-block">
				<button
					className="rbt-btn splash-btn icon-reverse-left rbt-scroll-trigger fade_in animation-order-5 rbt-rounded--4 d-block w-100 border-0"
					disabled={!canSubmit}
					onClick={() => void submitOrder()}
					type="button"
				>
					<span className="icon-left">
						<i className="fa-sharp fa-regular fa-arrow-right mr--4" />
					</span>
					<span>
						{submitting
							? "Placing Order..."
							: `Place Order ${formatPrice(grandTotal)}`}
					</span>
					<span className="icon-right">
						<i className="fa-solid fa-money-bill-1-wave ml--4" />
					</span>
				</button>
			</div>
		</>
	);
}
