"use client";

import Image from "next/image";
import Link from "next/link";
import {
	type EntityColumn,
	EntityTable,
} from "@/admin/components/admin/entity-table";
import { Icon } from "@/admin/components/layout/icon";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { routes } from "@/admin/config/routes";
import type {
	Advertisement,
	Coupon,
	Order,
	ProductReview,
	ShippingMethod,
	SupportTicket,
} from "@/admin/data/admin/operations";
import { cn } from "@/admin/utils/cn";

type OrderRow = Order & { id: string };
type CouponRow = Coupon & { id: string };
type ShippingMethodRow = ShippingMethod;
type AdvertisementRow = Advertisement;
type ReviewRow = ProductReview & { id: string };
type TicketRow = SupportTicket & { id: string };
type DeleteHandler = (ids: string[]) => Promise<void> | void;
type ProductReviewWithOptionalId = ProductReview & { id?: string };
type SupportTicketWithOptionalId = SupportTicket & { id?: string };

const statusClass = {
	active: "bg-success-50 text-success-600",
	approved: "bg-success-50 text-success-600",
	completed: "bg-success-50 text-success-600",
	cancelled: "bg-danger-50 text-danger-500",
	delivering: "bg-brand-50 text-brand-600",
	draft: "bg-surface-muted text-ink-600",
	expired: "bg-warning-50 text-warning-600",
	failed: "bg-danger-50 text-danger-500",
	inactive: "bg-surface-muted text-ink-600",
	open: "bg-warning-50 text-warning-600",
	pending: "bg-brand-50 text-brand-600",
	resolved: "bg-success-50 text-success-600",
	scheduled: "bg-brand-50 text-brand-600",
};

export function OrderListTable({
	onDelete,
	orders,
}: {
	onDelete?: DeleteHandler;
	orders: Order[];
}) {
	const columns: EntityColumn<OrderRow>[] = [
		{
			key: "order",
			label: "Order ID",
			render: (order) => (
				<Link
					className="font-semibold text-brand-600 hover:underline"
					href={routes.orderDetail(order.id)}
				>
					#{order.id}
				</Link>
			),
			sortValue: (order) => order.id,
		},
		{
			hideable: true,
			key: "customer",
			label: "Customer",
			render: (order) => (
				<div className="flex items-center gap-3">
					<span className="grid h-9 w-9 rounded-full bg-brand-50 text-[13px] font-semibold text-brand-600 place-items-center">
						{initials(order.customer)}
					</span>
					<span className="font-semibold text-ink-900">{order.customer}</span>
				</div>
			),
			sortValue: (order) => order.customer,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (order) => (
				<StatusBadge
					className={statusClass[order.status]}
					label={capitalize(order.status)}
				/>
			),
			sortValue: (order) => order.status,
		},
		{
			hideable: true,
			key: "total",
			label: "Total",
			render: (order) => (
				<span className="font-semibold text-ink-900">{order.total}</span>
			),
			sortValue: (order) => Number(order.total.replace(/[$,]/g, "")),
		},
		{
			hideable: true,
			key: "added",
			label: "Date Added",
			render: (order) => order.added,
			sortValue: (order) => order.added,
		},
		{
			hideable: true,
			key: "modified",
			label: "Date Modified",
			render: (order) => order.modified,
			sortValue: (order) => order.modified,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This order will be removed from the order list. This action cannot be undone."
			editHref={(row) => routes.editOrder(row.id)}
			filterOptions={[
				{ label: "Status", match: () => true, value: "all" },
				{
					label: "Delivering",
					match: (row) => row.status === "delivering",
					value: "delivering",
				},
				{
					label: "Completed",
					match: (row) => row.status === "completed",
					value: "completed",
				},
				{
					label: "Failed",
					match: (row) => row.status === "failed",
					value: "failed",
				},
				{
					label: "Pending",
					match: (row) => row.status === "pending",
					value: "pending",
				},
				{
					label: "Cancelled",
					match: (row) => row.status === "cancelled",
					value: "cancelled",
				},
			]}
			items={orders}
			onDelete={onDelete}
			searchLabel="Search orders"
			searchPlaceholder="Search Order"
			searchText={(order) => `${order.id} ${order.customer} ${order.total}`}
			singularName="order"
		/>
	);
}

export function CouponListTable({
	coupons,
	onDelete,
}: {
	coupons: Coupon[];
	onDelete?: DeleteHandler;
}) {
	const rows: CouponRow[] = coupons.map((coupon) => ({
		...coupon,
		id: coupon.code,
	}));
	const columns: EntityColumn<CouponRow>[] = [
		{
			key: "coupon",
			label: "Coupon",
			render: (coupon) => (
				<div className="flex items-center gap-3">
					<span
						className={cn(
							"grid h-11 w-11 shrink-0 place-items-center rounded-base",
							coupon.iconClass,
						)}
					>
						<Icon className="h-5 w-5" name="badge-percent" />
					</span>
					<div>
						<Link
							className="font-semibold text-ink-900 hover:text-brand-600"
							href={routes.editCoupon(coupon.code)}
						>
							{coupon.name}
						</Link>
						<p className="mt-1 text-[13px] text-ink-400">{coupon.summary}</p>
					</div>
				</div>
			),
			sortValue: (coupon) => coupon.name,
		},
		{
			hideable: true,
			key: "code",
			label: "Code",
			render: (coupon) => (
				<span className="font-semibold text-ink-900">{coupon.code}</span>
			),
			sortValue: (coupon) => coupon.code,
		},
		{
			hideable: true,
			key: "discount",
			label: "Discount",
			render: (coupon) => coupon.discount,
			sortValue: (coupon) => coupon.discount,
		},
		{
			hideable: true,
			key: "validity",
			label: "Validity",
			render: (coupon) => coupon.validity,
			sortValue: (coupon) => coupon.validity,
		},
		{
			hideable: true,
			key: "used",
			label: "Used",
			render: (coupon) => coupon.used,
			sortValue: (coupon) => Number.parseInt(coupon.used.replace(/,/g, ""), 10),
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (coupon) => (
				<StatusBadge
					className={statusClass[coupon.status]}
					label={capitalize(coupon.status)}
				/>
			),
			sortValue: (coupon) => coupon.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This coupon will be permanently removed from marketing campaigns."
			editHref={(row) => routes.editCoupon(row.code)}
			filterOptions={[
				{ label: "All status", match: () => true, value: "all" },
				{
					label: "Active",
					match: (row) => row.status === "active",
					value: "active",
				},
				{
					label: "Scheduled",
					match: (row) => row.status === "scheduled",
					value: "scheduled",
				},
				{
					label: "Draft",
					match: (row) => row.status === "draft",
					value: "draft",
				},
				{
					label: "Expired",
					match: (row) => row.status === "expired",
					value: "expired",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search coupons"
			searchPlaceholder="Search coupon name or code"
			searchText={(coupon) => `${coupon.name} ${coupon.code} ${coupon.type}`}
			singularName="coupon"
		/>
	);
}

export function ShippingMethodListTable({
	methods,
	onDelete,
}: {
	methods: ShippingMethod[];
	onDelete?: DeleteHandler;
}) {
	const rows: ShippingMethodRow[] = methods;
	const columns: EntityColumn<ShippingMethodRow>[] = [
		{
			key: "method",
			label: "Method",
			render: (method) => (
				<div className="flex items-center gap-3">
					<span className="grid h-11 w-11 shrink-0 place-items-center rounded-base bg-brand-50 text-brand-600">
						<Icon className="h-5 w-5" name="truck" />
					</span>
					<div>
						<Link
							className="font-semibold text-ink-900 hover:text-brand-600"
							href={routes.editShippingMethod(method.name)}
						>
							{method.name}
						</Link>
						<p className="mt-1 text-[13px] text-ink-400">
							{method.description}
						</p>
					</div>
				</div>
			),
			sortValue: (method) => method.name,
		},
		{
			hideable: true,
			key: "carrier",
			label: "Carrier",
			render: (method) => method.carrier || "Not set",
			sortValue: (method) => method.carrier,
		},
		{
			hideable: true,
			key: "price",
			label: "Price",
			render: (method) => (
				<span className="font-semibold text-ink-900">
					{method.price === 0 ? "Free" : `$${method.price.toFixed(2)}`}
				</span>
			),
			sortValue: (method) => method.price,
		},
		{
			hideable: true,
			key: "delivery",
			label: "Delivery Estimate",
			render: (method) => method.deliveryEstimate,
			sortValue: (method) => method.deliveryEstimate,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (method) => (
				<StatusBadge
					className={statusClass[method.status]}
					label={capitalize(method.status)}
				/>
			),
			sortValue: (method) => method.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This shipping method will no longer be offered at checkout."
			editHref={(row) => routes.editShippingMethod(row.name)}
			filterOptions={[
				{ label: "All status", match: () => true, value: "all" },
				{
					label: "Active",
					match: (row) => row.status === "active",
					value: "active",
				},
				{
					label: "Inactive",
					match: (row) => row.status === "inactive",
					value: "inactive",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search shipping methods"
			searchPlaceholder="Search name or carrier"
			searchText={(method) => `${method.name} ${method.carrier}`}
			singularName="shipping method"
		/>
	);
}

export function AdvertisementListTable({
	advertisements,
	onDelete,
}: {
	advertisements: Advertisement[];
	onDelete?: DeleteHandler;
}) {
	const rows: AdvertisementRow[] = advertisements;
	const columns: EntityColumn<AdvertisementRow>[] = [
		{
			key: "advertisement",
			label: "Banner",
			render: (ad) => (
				<div className="flex items-center gap-3">
					<Image
						alt={ad.title}
						className="h-12 w-20 rounded-base bg-surface-body object-cover"
						height={48}
						src={ad.imageUrl}
						width={80}
					/>
					<div>
						<Link
							className="font-semibold text-ink-900 hover:text-brand-600"
							href={routes.editAdvertisement(ad.title)}
						>
							{ad.title}
						</Link>
						<p className="mt-1 text-[13px] text-ink-400">
							{ad.linkUrl || "No link"}
						</p>
					</div>
				</div>
			),
			sortValue: (ad) => ad.title,
		},
		{
			hideable: true,
			key: "sort-order",
			label: "Sort Order",
			render: (ad) => ad.sortOrder,
			sortValue: (ad) => ad.sortOrder,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (ad) => (
				<StatusBadge className={statusClass[ad.status]} label={capitalize(ad.status)} />
			),
			sortValue: (ad) => ad.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This banner will stop showing on the storefront."
			editHref={(row) => routes.editAdvertisement(row.title)}
			filterOptions={[
				{ label: "All status", match: () => true, value: "all" },
				{
					label: "Active",
					match: (row) => row.status === "active",
					value: "active",
				},
				{
					label: "Inactive",
					match: (row) => row.status === "inactive",
					value: "inactive",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search advertisements"
			searchPlaceholder="Search title"
			searchText={(ad) => ad.title}
			singularName="advertisement"
		/>
	);
}

export function ProductReviewListTable({
	onDelete,
	reviews,
}: {
	onDelete?: DeleteHandler;
	reviews: ProductReviewWithOptionalId[];
}) {
	const rows: ReviewRow[] = reviews.map((review) => ({
		...review,
		id: review.id ?? `${review.product}-${review.customer}`,
	}));
	const columns: EntityColumn<ReviewRow>[] = [
		{
			key: "product",
			label: "Product",
			render: (review) => (
				<p className="font-semibold text-ink-900">{review.product}</p>
			),
			sortValue: (review) => review.product,
		},
		{
			hideable: true,
			key: "customer",
			label: "Customer",
			render: (review) => review.customer,
			sortValue: (review) => review.customer,
		},
		{
			hideable: true,
			key: "rating",
			label: "Rating",
			render: (review) => (
				<span className="text-warning-500">{review.rating}/5</span>
			),
			sortValue: (review) => review.rating,
		},
		{
			hideable: true,
			key: "review",
			label: "Review",
			render: (review) => <span className="text-ink-500">{review.review}</span>,
			sortValue: (review) => review.review,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (review) => (
				<StatusBadge
					className={statusClass[review.status]}
					label={capitalize(review.status)}
				/>
			),
			sortValue: (review) => review.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This review will be removed from moderation."
			editHref={routes.productReviews}
			filterOptions={[
				{ label: "All reviews", match: () => true, value: "all" },
				{
					label: "Pending",
					match: (row) => row.status === "pending",
					value: "pending",
				},
				{
					label: "Approved",
					match: (row) => row.status === "approved",
					value: "approved",
				},
				{
					label: "Draft",
					match: (row) => row.status === "draft",
					value: "draft",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search reviews"
			searchPlaceholder="Search product or customer"
			searchText={(review) =>
				`${review.product} ${review.customer} ${review.review}`
			}
			singularName="review"
		/>
	);
}

export function SupportTicketListTable({
	onDelete,
	tickets,
}: {
	onDelete?: DeleteHandler;
	tickets: SupportTicketWithOptionalId[];
}) {
	const rows: TicketRow[] = tickets.map((ticket) => ({
		...ticket,
		id: ticket.id ?? ticket.title,
	}));
	const columns: EntityColumn<TicketRow>[] = [
		{
			key: "ticket",
			label: "Ticket",
			render: (ticket) => (
				<p className="font-semibold text-ink-900">{ticket.title}</p>
			),
			sortValue: (ticket) => ticket.title,
		},
		{
			hideable: true,
			key: "customer",
			label: "Customer",
			render: (ticket) => ticket.customer,
			sortValue: (ticket) => ticket.customer,
		},
		{
			hideable: true,
			key: "contact",
			label: "Contact",
			render: (ticket) =>
				ticket.email || ticket.phone ? (
					<div className="text-[13px]">
						{ticket.email ? <p className="text-ink-700">{ticket.email}</p> : null}
						{ticket.phone ? <p className="text-ink-400">{ticket.phone}</p> : null}
					</div>
				) : (
					<span className="text-ink-300">—</span>
				),
			sortValue: (ticket) => ticket.email ?? "",
		},
		{
			hideable: true,
			key: "message",
			label: "Message",
			render: (ticket) =>
				ticket.message ? (
					<p className="max-w-[280px] truncate text-ink-700" title={ticket.message}>
						{ticket.message}
					</p>
				) : (
					<span className="text-ink-300">—</span>
				),
			sortValue: (ticket) => ticket.message ?? "",
		},
		{
			hideable: true,
			key: "priority",
			label: "Priority",
			render: (ticket) => (
				<span
					className={
						ticket.priority === "High"
							? "text-danger-500"
							: ticket.priority === "Medium"
								? "text-warning-600"
								: "text-ink-500"
					}
				>
					{ticket.priority}
				</span>
			),
			sortValue: (ticket) => ticket.priority,
		},
		{
			hideable: true,
			key: "assignee",
			label: "Assigned To",
			render: (ticket) => ticket.assignee,
			sortValue: (ticket) => ticket.assignee,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (ticket) => (
				<StatusBadge
					className={statusClass[ticket.status]}
					label={capitalize(ticket.status)}
				/>
			),
			sortValue: (ticket) => ticket.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This support ticket will be removed from the queue."
			editHref={routes.supportTickets}
			filterOptions={[
				{ label: "All status", match: () => true, value: "all" },
				{ label: "Open", match: (row) => row.status === "open", value: "open" },
				{
					label: "Pending",
					match: (row) => row.status === "pending",
					value: "pending",
				},
				{
					label: "Resolved",
					match: (row) => row.status === "resolved",
					value: "resolved",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search tickets"
			searchPlaceholder="Search tickets"
			searchText={(ticket) =>
				`${ticket.title} ${ticket.customer} ${ticket.assignee} ${ticket.email ?? ""} ${ticket.message ?? ""}`
			}
			singularName="ticket"
		/>
	);
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function initials(value: string) {
	return value
		.split(" ")
		.map((part) => part[0])
		.join("");
}
