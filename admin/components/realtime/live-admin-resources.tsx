"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
	AdvertisementListTable,
	CouponListTable,
	OrderListTable,
	ProductReviewListTable,
	ShippingMethodListTable,
	SupportTicketListTable,
} from "@/admin/components/admin/operation-list-pages";
import { RevenueChart } from "@/admin/components/dashboard/charts";
import {
	AttentionStrip,
	KpiGrid,
	PlatformCard,
	RecentOrdersList,
	TopProductsList,
} from "@/admin/components/dashboard/platform-overview";
import {
	AttributeListTable,
	BrandListTable,
	CategoryListTable,
	CustomerListTable,
	UserListTable,
} from "@/admin/components/catalog/list-pages";
import { ShowcaseStrip } from "@/admin/components/catalog/showcase-strip";
import { StatCard } from "@/admin/components/layout/dashboard-widgets";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { ProductListTable } from "@/admin/components/products/product-list-table";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { routes } from "@/admin/config/routes";
import type {
	Attribute,
	Brand,
	Category,
	Customer,
} from "@/admin/data/admin/catalog";
import type {
	Advertisement,
	Coupon,
	Order,
	ProductReview,
	ShippingMethod,
	SupportTicket,
} from "@/admin/data/admin/operations";
import type { Product as AdminProduct } from "@/admin/data/products/data";
import { useRealtimeResource } from "@/admin/hooks/use-realtime-resource";
import DataBoundary from "@/components/common/loading/DataBoundary";
import type {
	AdminDashboardData,
	AdminUser,
	AttributeWithId,
	ProductReviewWithId,
	SupportTicketWithId,
} from "@/lib/backend/admin-data";

type DeleteResource =
	| "advertisements"
	| "attributes"
	| "brands"
	| "categories"
	| "coupons"
	| "customers"
	| "orders"
	| "products"
	| "reviews"
	| "shipping-methods"
	| "support-tickets"
	| "users";

// Shape only - panels stay behind the loading state until live data arrives.
const fallbackDashboard: AdminDashboardData = {
	overview: {
		customers: 0, customersNew30: 0, earningsPending: 0, orders30: 0, ordersPending: 0, ordersPrev30: 0,
		outOfStock: 0, payoutsRequested: 0, payoutsRequestedCount: 0, plans: [], platformFees: 0, sales30: 0,
		salesPrev30: 0, stores: 0, storesActive: 0, storesNew7: 0, storesSuspended: 0, storesUnpaid: 0,
		subsActive: 0, subsPastDue: 0, subsTrialing: 0, ticketsOpen: 0,
	},
	categories: [],
	recentOrders: [],
	sales: { month: { categories: [], data: [] }, year: { categories: [], data: [] } },
	stats: [],
	topCategories: [],
	topProducts: [],
	transactions: [],
};

async function deleteAdminRows(resource: DeleteResource, ids: string[]) {
	const response = await fetch(`/api/admin/${resource}`, {
		body: JSON.stringify({ ids }),
		cache: "no-store",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		method: "DELETE",
	});
	const payload = (await response.json().catch(() => ({}))) as {
		error?: { message?: string };
	};

	if (!response.ok) {
		throw new Error(
			payload.error?.message ?? `Unable to delete ${resource}.`,
		);
	}
}

function dataKey<T>(rows: T[], getId: (row: T) => string) {
	return rows.map(getId).join("|") || "empty";
}

export function LiveDataStatus({
	error,
	lastEventAt,
}: {
	error: string | null;
	lastEventAt: Date | null;
}) {
	if (!error && !lastEventAt) {
		return null;
	}

	return (
		<p
			className={
				error
					? "mb-4 rounded-base border border-danger-500/30 bg-danger-50 px-4 py-2 text-[13px] text-danger-500"
					: "mb-4 inline-flex items-center gap-2 rounded-full bg-surface-card px-3 py-1 text-[12px] text-ink-400 shadow-card"
			}
			role="status"
		>
			{error ? (
				`Live backend: ${error}`
			) : (
				<>
					<span className="h-2 w-2 rounded-full bg-success-500" />
					Live · updated {lastEventAt?.toLocaleTimeString()}
				</>
			)}
		</p>
	);
}

export function LiveProductsTable({
	initialProducts,
}: {
	initialProducts: AdminProduct[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		AdminProduct[]
	>({
		endpoint: "/api/admin/products",
		fallbackData: initialProducts,
		topics: ["products"],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<ProductListTable
				key={dataKey(data, (product) => product.sku)}
				onDeleteProducts={async (skus) => {
					await deleteAdminRows("products", skus);
					await refresh();
				}}
				products={data}
			/>
		</DataBoundary>
	);
}

export function LiveOrdersTable({ initialOrders }: { initialOrders: Order[] }) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<Order[]>({
		endpoint: "/api/admin/orders",
		fallbackData: initialOrders,
		topics: ["orders"],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<OrderListTable
				key={dataKey(data, (order) => order.id)}
				onDelete={async (ids) => {
					await deleteAdminRows("orders", ids);
					await refresh();
				}}
				orders={data}
			/>
		</DataBoundary>
	);
}

export function LiveCategoriesPanel({
	initialCategories,
}: {
	initialCategories: Category[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<Category[]>({
		endpoint: "/api/admin/categories",
		fallbackData: initialCategories,
		topics: ["categories", "products"],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<ShowcaseStrip items={data} type="category" />
			<CategoryListTable
				categories={data}
				key={dataKey(data, (category) => category.slug)}
				onDelete={async (ids) => {
					await deleteAdminRows("categories", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveBrandsPanel({ initialBrands }: { initialBrands: Brand[] }) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<Brand[]>({
		endpoint: "/api/admin/brands",
		fallbackData: initialBrands,
		topics: ["brands", "products"],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<ShowcaseStrip items={data} type="brand" />
			<BrandListTable
				brands={data}
				key={dataKey(data, (brand) => brand.slug)}
				onDelete={async (ids) => {
					await deleteAdminRows("brands", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveAttributesTable({
	initialAttributes,
}: {
	initialAttributes: Attribute[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		AttributeWithId[]
	>({
		endpoint: "/api/admin/attributes",
		fallbackData: initialAttributes.map((attribute) => ({
			...attribute,
			id: attribute.name.toLowerCase(),
		})),
		topics: ["attributes"],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<AttributeListTable
				attributes={data}
				key={dataKey(data, (attribute) => attribute.id)}
				onDelete={async (ids) => {
					await deleteAdminRows("attributes", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveCustomersPanel({
	initialCustomers,
}: {
	initialCustomers: Customer[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<Customer[]>({
		endpoint: "/api/admin/customers",
		fallbackData: initialCustomers,
		topics: ["customers", "orders"],
	});
	const activeCustomers = data.filter((customer) => customer.status === "active");
	const reviewCustomers = data.length - activeCustomers.length;
	const repeatRate = data.length
		? Math.round((data.filter((customer) => customer.orders > 1).length / data.length) * 100)
		: 0;

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<div className="mb-6 grid gap-4 md:grid-cols-3">
				<StatCard
					accentBorder="border-brand-500"
					badge="Live"
					badgeClass="bg-brand-50 text-brand-600"
					icon="users"
					iconClass="bg-brand-50 text-brand-600"
					label="Customers"
					value={data.length.toLocaleString("en-US")}
				/>
				<StatCard
					accentBorder="border-success-500"
					badge="Live"
					badgeClass="bg-success-50 text-success-600"
					icon="refresh-ccw"
					iconClass="bg-success-50 text-success-600"
					label="Repeat Rate"
					value={`${repeatRate}%`}
				/>
				<StatCard
					accentBorder="border-warning-500"
					badge="Review"
					badgeClass="bg-warning-50 text-warning-600"
					icon="circle-alert"
					iconClass="bg-warning-50 text-warning-600"
					label="At Risk"
					value={reviewCustomers.toLocaleString("en-US")}
				/>
			</div>
			<CustomerListTable
				customers={data}
				key={dataKey(data, (customer) => customer.email)}
				onDelete={async (ids) => {
					await deleteAdminRows("customers", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveUsersPanel({ initialUsers }: { initialUsers: AdminUser[] }) {
	// app_users has no realtime NOTIFY trigger (unlike every other admin
	// table), so this panel fetches on mount and after mutations only -
	// topics: [] short-circuits the SSE subscription in useRealtimeResource.
	const { data, error, refresh, loading, hasData } = useRealtimeResource<AdminUser[]>({
		endpoint: "/api/admin/users",
		fallbackData: initialUsers,
		topics: [],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={null} />
			<UserListTable
				key={dataKey(data, (user) => user.id)}
				onDelete={async (ids) => {
					await deleteAdminRows("users", ids);
					await refresh();
				}}
				users={data}
			/>
		</DataBoundary>
	);
}

export function LiveCouponsPanel({ initialCoupons }: { initialCoupons: Coupon[] }) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<Coupon[]>({
		endpoint: "/api/admin/coupons",
		fallbackData: initialCoupons,
		topics: ["coupons"],
	});
	const active = data.filter((coupon) => coupon.status === "active").length;
	const scheduled = data.filter((coupon) => coupon.status === "scheduled").length;
	const drafts = data.filter((coupon) => coupon.status === "draft").length;
	const redeemed = data.reduce((sum, coupon) => {
		const used = Number(coupon.used.split("/")[0]?.replace(/,/g, "").trim() ?? 0);
		return sum + (Number.isFinite(used) ? used : 0);
	}, 0);
	const stats = [
		{
			badge: "Live",
			badgeClass: "bg-success-50 text-success-600",
			icon: "badge-percent",
			iconClass: "bg-brand-50 text-brand-600",
			label: "Active coupons",
			value: String(active),
		},
		{
			badge: "Used",
			badgeClass: "bg-brand-50 text-brand-600",
			icon: "dollar-sign",
			iconClass: "bg-success-50 text-success-600",
			label: "Redemptions",
			value: redeemed.toLocaleString("en-US"),
		},
		{
			badge: "Soon",
			badgeClass: "bg-warning-50 text-warning-600",
			icon: "calendar",
			iconClass: "bg-warning-50 text-warning-600",
			label: "Scheduled",
			value: String(scheduled),
		},
		{
			badge: "Draft",
			badgeClass: "bg-surface-muted text-ink-600",
			icon: "gift",
			iconClass: "bg-danger-50 text-danger-500",
			label: "Pending campaigns",
			value: String(drafts),
		},
	];

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat) => (
					<article
						className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card"
						key={stat.label}
					>
						<div className="flex items-center justify-between gap-3">
							<span
								className={`grid h-11 w-11 place-items-center rounded-base ${stat.iconClass}`}
							>
								<Icon className="h-5 w-5" name={stat.icon} />
							</span>
							<StatusBadge className={stat.badgeClass} label={stat.badge} />
						</div>
						<p className="mt-4 text-[13px] text-ink-500">{stat.label}</p>
						<h2 className="mt-1 text-[24px] font-semibold text-ink-900">
							{stat.value}
						</h2>
					</article>
				))}
			</section>
			<CouponListTable
				coupons={data}
				key={dataKey(data, (coupon) => coupon.code)}
				onDelete={async (ids) => {
					await deleteAdminRows("coupons", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveShippingMethodsPanel({
	initialMethods,
}: {
	initialMethods: ShippingMethod[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		ShippingMethod[]
	>({
		endpoint: "/api/admin/shipping-methods",
		fallbackData: initialMethods,
		topics: ["shipping-methods"],
	});
	const active = data.filter((method) => method.status === "active").length;
	const prices = data.map((method) => method.price);
	const cheapest = prices.length ? Math.min(...prices) : 0;
	const priciest = prices.length ? Math.max(...prices) : 0;
	const stats = [
		{
			badge: "Live",
			badgeClass: "bg-success-50 text-success-600",
			icon: "truck",
			iconClass: "bg-brand-50 text-brand-600",
			label: "Active methods",
			value: String(active),
		},
		{
			badge: "Total",
			badgeClass: "bg-brand-50 text-brand-600",
			icon: "list",
			iconClass: "bg-brand-50 text-brand-600",
			label: "All methods",
			value: String(data.length),
		},
		{
			badge: "Range",
			badgeClass: "bg-warning-50 text-warning-600",
			icon: "dollar-sign",
			iconClass: "bg-success-50 text-success-600",
			label: "Price range",
			value: data.length
				? `$${cheapest.toFixed(2)} - $${priciest.toFixed(2)}`
				: "No data",
		},
	];

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<section className="mb-6 grid gap-4 md:grid-cols-3">
				{stats.map((stat) => (
					<article
						className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card"
						key={stat.label}
					>
						<div className="flex items-center justify-between gap-3">
							<span
								className={`grid h-11 w-11 place-items-center rounded-base ${stat.iconClass}`}
							>
								<Icon className="h-5 w-5" name={stat.icon} />
							</span>
							<StatusBadge className={stat.badgeClass} label={stat.badge} />
						</div>
						<p className="mt-4 text-[13px] text-ink-500">{stat.label}</p>
						<h2 className="mt-1 text-[24px] font-semibold text-ink-900">
							{stat.value}
						</h2>
					</article>
				))}
			</section>
			<ShippingMethodListTable
				key={dataKey(data, (method) => method.id)}
				methods={data}
				onDelete={async (ids) => {
					await deleteAdminRows("shipping-methods", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveAdvertisementsPanel({
	initialAdvertisements,
}: {
	initialAdvertisements: Advertisement[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		Advertisement[]
	>({
		endpoint: "/api/admin/advertisements",
		fallbackData: initialAdvertisements,
		topics: ["advertisements"],
	});
	const active = data.filter((ad) => ad.status === "active").length;
	const stats = [
		{
			badge: "Live",
			badgeClass: "bg-success-50 text-success-600",
			icon: "megaphone",
			iconClass: "bg-brand-50 text-brand-600",
			label: "Active banners",
			value: String(active),
		},
		{
			badge: "Total",
			badgeClass: "bg-brand-50 text-brand-600",
			icon: "list",
			iconClass: "bg-brand-50 text-brand-600",
			label: "All banners",
			value: String(data.length),
		},
	];

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<section className="mb-6 grid gap-4 md:grid-cols-2">
				{stats.map((stat) => (
					<article
						className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card"
						key={stat.label}
					>
						<div className="flex items-center justify-between gap-3">
							<span
								className={`grid h-11 w-11 place-items-center rounded-base ${stat.iconClass}`}
							>
								<Icon className="h-5 w-5" name={stat.icon} />
							</span>
							<StatusBadge className={stat.badgeClass} label={stat.badge} />
						</div>
						<p className="mt-4 text-[13px] text-ink-500">{stat.label}</p>
						<h2 className="mt-1 text-[24px] font-semibold text-ink-900">
							{stat.value}
						</h2>
					</article>
				))}
			</section>
			<AdvertisementListTable
				advertisements={data}
				key={dataKey(data, (ad) => ad.id)}
				onDelete={async (ids) => {
					await deleteAdminRows("advertisements", ids);
					await refresh();
				}}
			/>
		</DataBoundary>
	);
}

export function LiveProductReviewsPanel({
	initialReviews,
}: {
	initialReviews: ProductReview[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		ProductReviewWithId[]
	>({
		endpoint: "/api/admin/reviews",
		fallbackData: initialReviews.map((review) => ({
			...review,
			id: `${review.product}-${review.customer}`,
		})),
		topics: ["reviews"],
	});
	const averageRating = data.length
		? (data.reduce((sum, review) => sum + review.rating, 0) / data.length).toFixed(1)
		: "0.0";
	const stats = [
		["Average rating", `${averageRating}/5`, "text-warning-600"],
		[
			"Pending reviews",
			String(data.filter((review) => review.status === "pending").length),
			"text-ink-900",
		],
		[
			"Approved",
			String(data.filter((review) => review.status === "approved").length),
			"text-success-600",
		],
	] as const;

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<section className="mb-6 grid gap-4 md:grid-cols-3">
				{stats.map(([label, value, className]) => (
					<article
						className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card"
						key={label}
					>
						<p className="text-[13px] text-ink-500">{label}</p>
						<h2 className={`mt-1 text-[24px] font-semibold ${className}`}>
							{value}
						</h2>
					</article>
				))}
			</section>
			<ProductReviewListTable
				key={dataKey(data, (review) => review.id)}
				onDelete={async (ids) => {
					await deleteAdminRows("reviews", ids);
					await refresh();
				}}
				reviews={data}
			/>
		</DataBoundary>
	);
}

export function LiveSupportTicketsTable({
	initialTickets,
}: {
	initialTickets: SupportTicket[];
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		SupportTicketWithId[]
	>({
		endpoint: "/api/admin/support-tickets",
		fallbackData: initialTickets.map((ticket) => ({
			...ticket,
			id: ticket.title,
		})),
		topics: ["support-tickets"],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="table" count={6} label="Loading records">
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<SupportTicketListTable
				key={dataKey(data, (ticket) => ticket.id)}
				onDelete={async (ids) => {
					await deleteAdminRows("support-tickets", ids);
					await refresh();
				}}
				tickets={data}
			/>
		</DataBoundary>
	);
}

export function LiveDashboard() {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<AdminDashboardData>({
		endpoint: "/api/admin/dashboard",
		fallbackData: fallbackDashboard,
		topics: [
			"attributes",
			"brands",
			"categories",
			"coupons",
			"customers",
			"orders",
			"products",
			"reviews",
			"support-tickets",
		],
	});

	return (
		<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh} layout="dashboard" count={4} label="Loading dashboard">
			<DashboardHeader />
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			<AttentionStrip overview={data.overview} />
			<KpiGrid overview={data.overview} />
			<section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
				<RevenueReport sales={data.sales} />
				<PlatformCard overview={data.overview} />
			</section>
			<section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
				<div className="min-w-0 self-start">
					<RecentOrdersList orders={data.recentOrders} />
				</div>
				<div className="grid min-w-0 content-start gap-6">
					<TopProductsList products={data.topProducts} />
					<TopCategories categories={data.topCategories} />
				</div>
			</section>
		</DataBoundary>
	);
}

function DashboardHeader() {
	return (
		<div className="mb-6 flex flex-wrap items-center justify-center gap-[12px] text-center lg:justify-between lg:text-left">
			<div>
				<h1 className="text-[20px] font-semibold text-ink-900 lg:text-[24px]">
					Welcome back
				</h1>
				<p className="mt-1 text-[14px] text-ink-500">
					Your marketplace and seller stores, from live data.
				</p>
			</div>
			<div className="flex items-center gap-2">
				<a
					className="inline-flex h-11 items-center gap-2 rounded-base border border-surface-line px-[16px] text-[14px] font-semibold text-ink-700 transition-colors hover:bg-surface-muted"
					href="/marketplace"
					rel="noreferrer"
					target="_blank"
				>
					<Icon className="h-4 w-4" name="eye" />
					View marketplace
				</a>
				<Link
					className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-[16px] text-[14px] font-semibold text-white transition-colors hover:bg-brand-700"
					href={routes.addProduct}
				>
					<Icon className="h-4 w-4" name="plus" />
					Add Product
				</Link>
			</div>
		</div>
	);
}

function RevenueReport({ sales }: { sales: AdminDashboardData["sales"] }) {
	return (
		<article className="min-w-0 rounded-card border border-surface-line bg-surface-card p-[20px] shadow-card sm:p-6">
			<div className="flex flex-wrap items-center justify-between gap-[12px]">
				<div>
					<h2 className="m-0 text-[18px] font-semibold text-ink-900">Sales</h2>
					<p className="m-0 mt-1 text-[13px] text-ink-400">Order value - per month, or per week for the last 4 weeks.</p>
				</div>
				<div
					className="flex rounded-base border border-surface-line bg-surface-body p-1 text-[13px] font-semibold text-ink-500"
					data-revenue-toggle
				>
					<button
						className="rounded-base bg-surface-card px-[12px] py-1 text-brand-600 shadow-card"
						data-range="year"
						type="button"
					>
						Year
					</button>
					<button
						className="rounded-base px-[12px] py-1 hover:text-ink-900"
						data-range="month"
						type="button"
					>
						Month
					</button>
				</div>
			</div>
			<RevenueChart ranges={sales} />
		</article>
	);
}

function TopCategories({
	categories,
}: {
	categories: AdminDashboardData["topCategories"];
}) {
	return (
		<article className="min-w-0 rounded-card border border-surface-line bg-surface-card p-[20px] shadow-card sm:p-6">
			<div className="mb-[20px] flex flex-wrap items-center justify-between gap-[12px]">
				<div>
					<h2 className="m-0 text-[18px] font-semibold text-ink-900">
						Top categories
					</h2>
					<p className="m-0 mt-1 text-[13px] text-ink-400">
						Share of all sales so far.
					</p>
				</div>
				<Link
					className="text-[14px] font-semibold text-brand-600 hover:text-brand-700"
					href={routes.categories}
				>
					View all
				</Link>
			</div>
			<ul className="m-0 list-none space-y-5 p-0">
				{categories.map((category) => (
					<li className="m-0" key={category.label}>
						<div className="mb-1.5 flex items-center justify-between text-[14px]">
							<span className="flex items-center gap-2 font-medium text-ink-900">
								<span
									className={`h-2.5 w-2.5 rounded-full ${category.colorClass}`}
								/>
								{category.label}
							</span>
							<span className="text-ink-500">
								{category.value} {"\u00b7"} {category.percent}%
							</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
							<span
								className={`block h-full rounded-full ${category.colorClass}`}
								style={{ width: `${category.percent}%` }}
							/>
						</div>
					</li>
				))}
			</ul>
		</article>
	);
}

export function LivePageHeader(props: ComponentProps<typeof PageHeader>) {
	return <PageHeader {...props} />;
}
