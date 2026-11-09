import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import type { AdminOrderDetail } from "@/lib/backend/admin-data";

function formatAddress(address: AdminOrderDetail["billingAddress"]) {
	const lines = [
		[address.address1, address.address2].filter(Boolean).join(", "),
		[address.city, address.state, address.postcode].filter(Boolean).join(", "),
		address.country,
	].filter(Boolean);

	return lines.length ? lines : ["No address on file."];
}

function money(value: number) {
	return new Intl.NumberFormat("en-US", {
		currency: "USD",
		style: "currency",
	}).format(value);
}

export function OrderDetail({
	order,
	resellerStores = [],
}: {
	order: AdminOrderDetail;
	// Reseller stores this order was sold through (see lib/backend/resellers.ts).
	resellerStores?: { earning: number; handle: string; id: string; name: string; status: string }[];
}) {
	const detailCards = [
		{
			items: [
				["calendar", "Date Added", order.createdAt],
				["credit-card", "Payment Method", order.paymentMethod || "Not set"],
				["badge-percent", "Payment Status", capitalize(order.paymentStatus)],
				["truck", "Shipping Method", order.shippingMethodName],
			],
			title: `Order Details (#${order.orderNumber})`,
		},
		{
			items: [
				["user", "Customer", order.customerName],
				["mail", "Email", order.customerEmail || "Not provided"],
			],
			title: "Customer Details",
		},
		...resellerStores.map((store) => ({
			items: [
				["store", "Sold through", `${store.name} (/store/${store.handle})`],
				[
					"dollar-sign",
					"Reseller earns",
					`${new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(store.earning)} · ${store.status}`,
				],
			],
			title: resellerStores.length > 1 ? `Reseller Store · ${store.name}` : "Reseller Store",
		})),
	];

	return (
		<>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<Breadcrumb
						items={[
							{ href: routes.dashboard, label: "Home" },
							{ href: routes.orders, label: "Orders" },
							{ label: "Order Details" },
						]}
					/>
					<h1 className="text-[22px] font-semibold text-ink-900">
						Order #{order.orderNumber}
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<Link
						aria-label="Back to orders"
						className="grid h-11 w-11 place-items-center rounded-base border border-surface-line text-ink-700 hover:bg-surface-muted"
						href={routes.orders}
					>
						<Icon className="h-4 w-4" name="arrow-left" />
					</Link>
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-success-600 px-4 text-[14px] font-semibold text-white hover:bg-success-700"
						href={routes.editOrder(order.orderNumber)}
					>
						<Icon className="h-4 w-4" name="pencil" />
						Edit Order
					</Link>
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addOrder}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add New Order
					</Link>
				</div>
			</div>
			<section className="grid gap-6 lg:grid-cols-2">
				{detailCards.map((card) => (
					<article
						className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card"
						key={card.title}
					>
						<h2 className="mb-4 text-[18px] font-semibold text-ink-900">
							{card.title}
						</h2>
						<dl className="space-y-3 text-[14px]">
							{card.items.map(([icon, label, value]) => (
								<div
									className="flex items-center justify-between gap-3"
									key={label}
								>
									<dt className="flex items-center gap-2 text-ink-500">
										<Icon className="h-4 w-4 text-ink-400" name={icon} />
										{label}
									</dt>
									<dd className="font-medium text-ink-900">{value}</dd>
								</div>
							))}
						</dl>
					</article>
				))}
			</section>
			<section className="mt-6 grid gap-6 lg:grid-cols-2">
				{(
					[
						["Billing Address", order.billingAddress, "credit-card"],
						["Shipping Address", order.shippingAddress, "truck"],
					] as const
				).map(([title, address, icon]) => (
					<article
						className="relative overflow-hidden rounded-card border border-surface-line bg-surface-card p-6 shadow-card"
						key={title}
					>
						<Icon
							className="pointer-events-none absolute bottom-2 right-2 h-28 w-28 text-surface-line/70"
							name={icon}
						/>
						<h2 className="mb-3 text-[18px] font-semibold text-ink-900">
							{title}
						</h2>
						<address className="text-[14px] not-italic leading-relaxed text-ink-600">
							{formatAddress(address).map((line, index) => (
								<span key={index}>
									{line}
									<br />
								</span>
							))}
						</address>
					</article>
				))}
			</section>
			<section className="mt-6 rounded-card border border-surface-line bg-surface-card p-6 shadow-card">
				<h2 className="mb-5 text-[18px] font-semibold text-ink-900">
					Order Items
				</h2>
				<div className="dashboard-scrollbar overflow-x-auto">
					<table className="w-full min-w-[680px] text-left">
						<thead>
							<tr className="border-b border-surface-line text-[13px] uppercase text-ink-400">
								<th className="pb-3 pr-4 font-semibold">Product</th>
								<th className="pb-3 pr-4 font-semibold">SKU</th>
								<th className="pb-3 pr-4 text-right font-semibold">Qty</th>
								<th className="pb-3 pr-4 text-right font-semibold">
									Unit Price
								</th>
								<th className="pb-3 text-right font-semibold">Total</th>
							</tr>
						</thead>
						<tbody className="text-[14px]">
							{order.items.length ? (
								order.items.map((item) => (
									<tr className="border-b border-surface-line" key={item.sku}>
										<td className="py-4 pr-4">
											<div className="flex items-center gap-3">
												{item.image ? (
													<Image
														alt={item.name}
														className="h-11 w-11 rounded-base object-cover"
														height={44}
														src={item.image}
														width={44}
													/>
												) : null}
												<p className="font-semibold text-ink-900">
													{item.name}
												</p>
											</div>
										</td>
										<td className="py-4 pr-4 text-ink-700">{item.sku}</td>
										<td className="py-4 pr-4 text-right text-ink-700">
											{item.qty}
										</td>
										<td className="py-4 pr-4 text-right text-ink-700">
											{money(item.unitPrice)}
										</td>
										<td className="py-4 text-right font-semibold text-ink-900">
											{money(item.total)}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td className="py-6 text-center text-ink-400" colSpan={5}>
										No line items recorded for this order.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<div className="mt-5 flex justify-end">
					<dl className="w-full max-w-xs space-y-3 text-[14px]">
						<div className="flex items-center justify-between">
							<dt className="text-ink-500">Subtotal</dt>
							<dd className="font-semibold text-ink-900">
								{money(order.subtotal)}
							</dd>
						</div>
						<div className="flex items-center justify-between">
							<dt className="text-ink-500">
								Shipping
								{order.shippingMethodName !== "Not set"
									? ` (${order.shippingMethodName})`
									: ""}
							</dt>
							<dd className="font-semibold text-ink-900">
								{money(order.shippingCost)}
							</dd>
						</div>
						<div className="flex items-center justify-between border-t border-surface-line pt-3">
							<dt className="text-[15px] font-semibold text-ink-900">
								Grand Total
							</dt>
							<dd className="text-[18px] font-semibold text-ink-900">
								{money(order.total)}
							</dd>
						</div>
					</dl>
				</div>
			</section>
		</>
	);
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
