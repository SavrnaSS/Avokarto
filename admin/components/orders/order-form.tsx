"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
	Field,
	FormCard,
	SelectField,
} from "@/admin/components/forms/admin-form-primitives";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import type { Product } from "@/admin/data/products/data";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import { useRealtimeResource } from "@/admin/hooks/use-realtime-resource";
import { cn } from "@/admin/utils/cn";
import type { AdminOrderDetail } from "@/lib/backend/admin-data";

type OrderFormProps = {
	mode: "add" | "edit";
	order?: AdminOrderDetail;
};

function addressesMatch(
	a: AdminOrderDetail["billingAddress"],
	b: AdminOrderDetail["shippingAddress"],
) {
	const keys = ["address1", "address2", "city", "state", "postcode", "country"] as const;
	return keys.every((key) => (a[key] ?? "") === (b[key] ?? ""));
}

export function OrderForm({ mode, order }: OrderFormProps) {
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<Set<string>>(
		new Set(order?.items.map((item) => item.sku) ?? []),
	);
	const [sameAddress, setSameAddress] = useState(
		order ? addressesMatch(order.billingAddress, order.shippingAddress) : true,
	);
	const {
		data: products,
		error: productsError,
		loading: productsLoading,
	} = useRealtimeResource<Product[]>({
		endpoint: "/api/admin/products",
		fallbackData: [],
		topics: ["products"],
	});
	const visibleProducts = products.filter((product) =>
		`${product.name} ${product.sku} ${product.category}`
			.toLowerCase()
			.includes(query.toLowerCase()),
	);
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/orders",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.orders,
	});
	const total = useMemo(
		() =>
			products
				.filter((product) => selected.has(product.sku))
				.reduce((sum, product) => sum + product.price, 0),
		[products, selected],
	);
	const title = mode === "edit" ? "Edit Order" : "Add Order";

	return (
		<>
			<div className="mb-6">
				<Breadcrumb
					items={[
						{ href: routes.dashboard, label: "Home" },
						{ href: routes.orders, label: "Orders" },
						{ label: title },
					]}
				/>
				<h1 className="text-[24px] font-semibold text-ink-900">{title}</h1>
			</div>
			<form
				className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]"
				id={`${mode}-order-form`}
				onSubmit={(event) => void onSubmit(event)}
			>
				<aside className="min-w-0">
					<FormCard title="Order Details">
						{[...selected].map((sku) => (
							<input key={sku} name="product_skus" type="hidden" value={sku} />
						))}
						{order ? (
							// order_number is the key mutateOrder upserts on - without it,
							// saving this form would always create a brand new order
							// instead of updating this one.
							<input name="order_number" type="hidden" value={order.orderNumber} />
						) : null}
						<div className="mb-5">
							<p className="text-[13px] font-semibold text-ink-700">Order ID</p>
							<p className="mt-1 text-[15px] font-semibold text-ink-900">
								{order ? `#${order.orderNumber}` : "Generated on save"}
							</p>
						</div>
						<div className="space-y-5">
							<Field
								defaultValue={order?.customerName}
								help="Customer name shown in the order list."
								label="Customer Name"
								name="customer_name"
								placeholder="Customer name"
								required
							/>
							<Field
								defaultValue={order?.customerEmail}
								help="Used for order confirmation and support lookups."
								label="Customer Email"
								name="customer_email"
								placeholder="customer@example.com"
								type="email"
							/>
							<Field
								defaultValue={order?.paymentMethod}
								help="Set the payment method for the order."
								label="Payment Method"
								name="payment_method"
								placeholder="e.g. Credit Card, PayPal, Cash on Delivery"
							/>
							<SelectField
								defaultValue={order?.status ?? "delivering"}
								help="Set the order processing status."
								label="Order Status"
								name="status"
								options={[
									"delivering",
									"completed",
									"failed",
									"pending",
									"cancelled",
								]}
								required
							/>
							<SelectField
								defaultValue={order?.paymentStatus ?? "unpaid"}
								help="Set the payment collection status."
								label="Payment Status"
								name="payment_status"
								options={["paid", "unpaid", "refunded"]}
								required
							/>
						</div>
					</FormCard>
				</aside>
				<div className="min-w-0 space-y-6">
					<FormCard title="Select Products">
						<p className="mt-1 text-[14px] text-ink-700">
							Add products to this order
						</p>
						{mode === "edit" ? (
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								{products
									.filter((product) => selected.has(product.sku))
									.slice(0, 2)
									.map((product) => (
										<ProductPreview key={product.sku} product={product} />
									))}
							</div>
						) : (
							<p className="mt-1 text-[13px] text-ink-400">
								Select one or more products from the list below by ticking the
								checkbox.
							</p>
						)}
						<p className="mt-4 text-[15px] font-semibold text-ink-900">
							Total Cost: $ <span>{total.toFixed(2)}</span>
						</p>
						<label className="relative mt-5 block">
							<span className="sr-only">Search products</span>
							<Icon
								className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
								name="search"
							/>
							<input
								className="h-11 w-full rounded-base border border-surface-line bg-surface-body pl-11 pr-4 text-[14px] focus:border-brand-600"
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search Products"
								type="search"
								value={query}
							/>
						</label>
						<div className="dashboard-scrollbar mt-4 max-h-[360px] overflow-y-auto pr-1">
							<div className="sticky top-0 flex items-center justify-between border-b border-surface-line bg-surface-card pb-2 text-[13px] uppercase text-ink-400">
								<span className="font-semibold">Product</span>
								<span className="font-semibold">Qty Remaining</span>
							</div>
							{productsError ? (
								<p className="mt-3 rounded-base bg-warning-50 px-3 py-2 text-[13px] text-warning-600">
									{productsError}
								</p>
							) : null}
							{productsLoading ? (
								<LoadingSkeleton layout="table" count={3} label="Loading products" />
							) : null}
							{visibleProducts.map((product) => {
								const checked = selected.has(product.sku);
								return (
									<label
										className={cn(
											"mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-base border border-surface-line bg-surface-body p-3",
											checked ? "border-brand-600 bg-brand-50/40" : "",
										)}
										key={product.sku}
									>
										<span className="flex items-center gap-3">
											<input
												checked={checked}
												className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
												onChange={(event) => {
													setSelected((current) => {
														const next = new Set(current);
														if (event.target.checked) {
															next.add(product.sku);
														} else {
															next.delete(product.sku);
														}
														return next;
													});
												}}
												type="checkbox"
											/>
											<Image
												alt={product.name}
												className="h-11 w-11 rounded-base bg-surface-card object-cover"
												height={44}
												src={product.image}
												width={44}
											/>
											<span>
												<span className="block font-semibold text-ink-900">
													{product.name}
												</span>
												<span className="text-[13px] text-ink-400">
													SKU: {product.sku} · ${product.price.toFixed(2)}
												</span>
											</span>
										</span>
										<span className="text-[13px] font-semibold text-ink-700">
											{product.stock}
										</span>
									</label>
								);
							})}
						</div>
						{!productsLoading && !productsError && visibleProducts.length === 0 ? (
							<p className="py-8 text-center text-[14px] text-ink-400">
								No products match your search.
							</p>
						) : null}
					</FormCard>
					<FormCard title="Delivery Details">
						<AddressFields
							address={order?.billingAddress}
							prefix="billing"
							title="Billing Address"
						/>
						<label className="mt-5 flex items-center gap-2.5">
							<input
								checked={sameAddress}
								className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
								onChange={(event) => setSameAddress(event.target.checked)}
								type="checkbox"
							/>
							<span className="text-[14px] text-ink-700">
								Shipping address is the same as billing address
							</span>
						</label>
						{sameAddress ? null : (
							<AddressFields
								address={order?.shippingAddress}
								prefix="shipping"
								title="Shipping Address"
							/>
						)}
					</FormCard>
				</div>
			</form>
			<div className="mt-8 border-t border-surface-line pt-5">
				{error ? (
					<p className="mb-4 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
						{error}
					</p>
				) : null}
				<div className="flex items-center justify-end gap-3">
				<Link
					className="inline-flex h-11 items-center gap-2 rounded-base border border-surface-line px-5 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
					href={routes.orders}
				>
					Cancel
				</Link>
				<button
					className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
					disabled={submitting}
					form={`${mode}-order-form`}
					type="submit"
				>
					<Icon className="h-4 w-4" name="save" />
					{submitting ? "Saving..." : "Save Changes"}
				</button>
				</div>
			</div>
		</>
	);
}

function ProductPreview({
	product,
}: {
	product: Product;
}) {
	return (
		<div className="flex items-center gap-3 rounded-base border border-surface-line bg-surface-body p-3">
			<Image
				alt={product.name}
				className="h-11 w-11 rounded-base object-cover"
				height={44}
				src={product.image}
				width={44}
			/>
			<div className="min-w-0">
				<p className="font-semibold text-ink-900">{product.name}</p>
				<p className="text-[13px] text-ink-400">
					Price: ${product.price.toFixed(2)}
				</p>
				<p className="text-[13px] text-ink-400">SKU: {product.sku}</p>
			</div>
		</div>
	);
}

function AddressFields({
	address,
	prefix,
	title,
}: {
	address?: { address1?: string; address2?: string; city?: string; country?: string; postcode?: string; state?: string };
	prefix: "billing" | "shipping";
	title: string;
}) {
	return (
		<div className={prefix === "shipping" ? "mt-6" : ""}>
			<h3 className="mb-4 mt-5 text-[15px] font-semibold text-ink-900">
				{title}
			</h3>
			<div className="grid gap-5 sm:grid-cols-2">
				<Field
					defaultValue={address?.address1}
					label="Address Line 1"
					name={`${prefix}_address1`}
				/>
				<Field
					defaultValue={address?.address2}
					label="Address Line 2"
					name={`${prefix}_address2`}
					placeholder="Address Line 2"
				/>
			</div>
			<div className="mt-5 grid gap-5 sm:grid-cols-3">
				<Field
					defaultValue={address?.city}
					label="City"
					name={`${prefix}_city`}
				/>
				<Field
					defaultValue={address?.postcode}
					label="Postcode"
					name={`${prefix}_postcode`}
				/>
				<Field
					defaultValue={address?.state}
					label="State"
					name={`${prefix}_state`}
				/>
			</div>
			<div className="mt-5">
				<Field
					defaultValue={address?.country}
					label="Country"
					name={`${prefix}_country`}
					placeholder="Country"
				/>
			</div>
		</div>
	);
}
