import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import { cn } from "@/admin/utils/cn";
import type { AdminDashboardData, DashboardOverview } from "@/lib/backend/admin-data";
import { PLANS, isPlanKey } from "@/lib/billing/plans";

/* The admin dashboard's platform view: what needs you, the headline
   numbers with their 30-day trend, and how the seller side is doing
   (stores, trials, subscriptions, payouts). Live data only - see
   getAdminDashboard() in lib/backend/admin-data.ts.
   Spacing 3-5 is written as exact px (p-[20px], gap-[12px]...), from when
   the storefront's Bootstrap utilities leaked into the admin. */

const usd = (value: number, cents = false) =>
	new Intl.NumberFormat("en-US", {
		currency: "USD",
		maximumFractionDigits: cents ? 2 : 0,
		minimumFractionDigits: cents ? 2 : 0,
		style: "currency",
	}).format(value);

const card = "min-w-0 rounded-card border border-surface-line bg-surface-card shadow-card";

/** Change vs the previous period as a pill; nothing to compare reads "New" / "-". */
function Trend({ current, previous }: { current: number; previous: number }) {
	if (!previous) {
		return (
			<span className="rounded-full bg-surface-muted px-2 py-0.5 text-[12px] font-semibold text-ink-500">
				{current ? "New" : "-"}
			</span>
		);
	}
	const change = Math.round(((current - previous) / previous) * 100);
	const up = change >= 0;
	return (
		<span
			className={cn(
				"rounded-full px-2 py-0.5 text-[12px] font-semibold",
				up ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500",
			)}
		>
			{up ? "▲" : "▼"} {Math.abs(change)}%
		</span>
	);
}

/** Things waiting on an admin, each a link straight to where it's handled. */
export function AttentionStrip({ overview }: { overview: DashboardOverview }) {
	const items = [
		{ count: overview.ordersPending, href: routes.orders, icon: "shopping-bag", label: "Orders to fulfil" },
		{
			count: overview.payoutsRequestedCount,
			detail: overview.payoutsRequestedCount ? usd(overview.payoutsRequested) : undefined,
			href: routes.resellerPayouts,
			icon: "dollar-sign",
			label: "Payout requests",
		},
		{ count: overview.ticketsOpen, href: routes.supportTickets, icon: "life-buoy", label: "Open tickets" },
		{ count: overview.outOfStock, href: routes.products, icon: "package", label: "Out of stock" },
		{ count: overview.subsPastDue, href: routes.resellers, icon: "credit-card", label: "Payments failing" },
	];
	const waiting = items.filter((item) => item.count > 0);

	return (
		<section aria-label="Needs attention" className={cn(card, "mb-6 flex flex-wrap items-center gap-2 p-[12px] sm:p-[16px]")}>
			<span className="mr-1 inline-flex items-center gap-2 px-1 text-[14px] font-semibold text-ink-900">
				<span
					className={cn(
						"grid h-8 w-8 place-items-center rounded-full",
						waiting.length ? "bg-warning-50 text-warning-600" : "bg-success-50 text-success-600",
					)}
				>
					<Icon className="h-4 w-4" name={waiting.length ? "circle-alert" : "check"} />
				</span>
				{waiting.length ? "Needs attention" : "All clear - nothing waiting on you"}
			</span>
			{waiting.map((item) => (
				<Link
					className="group inline-flex items-center gap-2 rounded-full border border-surface-line bg-surface-body px-[12px] py-1.5 text-[13px] font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
					href={item.href}
					key={item.label}
				>
					<Icon className="h-4 w-4 text-ink-400 group-hover:text-brand-600" name={item.icon} />
					{item.label}
					<span className="rounded-full bg-ink-900 px-2 py-0.5 text-[12px] font-semibold text-white dark:bg-brand-500">
						{item.count}
					</span>
					{item.detail ? <span className="text-ink-400">{item.detail}</span> : null}
				</Link>
			))}
		</section>
	);
}

/** The four numbers to read first, each with its 30-day trend. */
export function KpiGrid({ overview }: { overview: DashboardOverview }) {
	const kpis = [
		{
			footer: <Trend current={overview.sales30} previous={overview.salesPrev30} />,
			hint: "vs previous 30 days",
			icon: "dollar-sign",
			label: "Sales · 30 days",
			value: usd(overview.sales30),
		},
		{
			footer: <Trend current={overview.orders30} previous={overview.ordersPrev30} />,
			hint: "vs previous 30 days",
			icon: "shopping-bag",
			label: "Orders · 30 days",
			value: overview.orders30.toLocaleString("en-US"),
		},
		{
			footer: (
				<span className="rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-semibold text-brand-600">
					+{overview.storesNew7}
				</span>
			),
			hint: "opened this week",
			icon: "store",
			label: "Seller stores",
			value: overview.stores.toLocaleString("en-US"),
		},
		{
			footer: (
				<span className="rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-semibold text-brand-600">
					+{overview.customersNew30}
				</span>
			),
			hint: "joined in 30 days",
			icon: "users",
			label: "Accounts",
			value: overview.customers.toLocaleString("en-US"),
		},
	];

	return (
		<section aria-label="Key numbers" className="mb-6 grid grid-cols-2 gap-[12px] md:gap-[16px] xl:grid-cols-4 xl:gap-6">
			{kpis.map((kpi) => (
				<article className={cn(card, "flex flex-col gap-[12px] p-[16px] sm:p-[20px]")} key={kpi.label}>
					<div className="flex items-start justify-between gap-[12px]">
						<span className="text-[13px] font-medium text-ink-500">{kpi.label}</span>
						<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
							<Icon className="h-4 w-4" name={kpi.icon} />
						</span>
					</div>
					<strong className="text-[24px] font-semibold leading-none tracking-tight text-ink-900 sm:text-[28px]">
						{kpi.value}
					</strong>
					<div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-400">
						{kpi.footer}
						<span>{kpi.hint}</span>
					</div>
				</article>
			))}
		</section>
	);
}

/** The seller side: store health, trial -> paid funnel, plans, money owed. */
export function PlatformCard({ overview }: { overview: DashboardOverview }) {
	const subscribers = overview.subsTrialing + overview.subsActive + overview.subsPastDue;
	const planName = (plan: string) => (isPlanKey(plan) ? PLANS[plan].name : plan);
	const maxPlan = Math.max(1, ...overview.plans.map((plan) => plan.count));

	return (
		<article className={cn(card, "flex flex-col gap-[20px] p-[20px] sm:p-6")}>
			<div className="flex items-center justify-between gap-[12px]">
				<div>
					<h2 className="m-0 text-[18px] font-semibold text-ink-900">Sellers</h2>
					<p className="m-0 mt-0.5 text-[13px] text-ink-400">Stores, plans and what they&apos;re owed.</p>
				</div>
				<Link className="whitespace-nowrap text-[13px] font-semibold text-brand-600 hover:text-brand-700" href={routes.resellers}>
					All stores
				</Link>
			</div>

			<dl className="m-0 grid grid-cols-3 gap-2 text-center">
				{[
					{ label: "Live", tone: "text-success-600", value: overview.storesActive },
					{ label: "Unpaid", tone: "text-warning-600", value: overview.storesUnpaid },
					{ label: "Suspended", tone: "text-danger-500", value: overview.storesSuspended },
				].map((item) => (
					<div className="rounded-base bg-surface-body px-2 py-[12px]" key={item.label}>
						<dd className={cn("m-0 text-[22px] font-semibold leading-none", item.tone)}>{item.value}</dd>
						<dt className="mt-1.5 text-[12px] text-ink-400">{item.label}</dt>
					</div>
				))}
			</dl>

			<div>
				<div className="mb-2 flex items-center justify-between text-[13px]">
					<span className="font-medium text-ink-700">Subscriptions</span>
					<span className="text-ink-400">
						{overview.subsTrialing} on trial · {overview.subsActive} paying
					</span>
				</div>
				{subscribers ? (
					<ul className="m-0 list-none space-y-2.5 p-0">
						{overview.plans.map((plan) => (
							<li className="m-0" key={plan.plan}>
								<div className="mb-1 flex justify-between text-[13px]">
									<span className="text-ink-700">{planName(plan.plan)}</span>
									<span className="font-semibold text-ink-900">{plan.count}</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-surface-muted">
									<span
										className="block h-full rounded-full bg-brand-500"
										style={{ width: `${(plan.count / maxPlan) * 100}%` }}
									/>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="m-0 rounded-base bg-surface-body px-[12px] py-[12px] text-[13px] text-ink-400">
						No subscriptions yet - they appear here once sellers start a plan.
					</p>
				)}
			</div>

			<dl className="m-0 grid grid-cols-2 gap-[12px] border-t border-surface-line pt-[16px]">
				<div>
					<dt className="text-[12px] text-ink-400">Platform fees earned</dt>
					<dd className="m-0 mt-1 text-[18px] font-semibold text-ink-900">{usd(overview.platformFees, true)}</dd>
				</div>
				<div>
					<dt className="text-[12px] text-ink-400">Seller earnings pending</dt>
					<dd className="m-0 mt-1 text-[18px] font-semibold text-ink-900">{usd(overview.earningsPending, true)}</dd>
				</div>
			</dl>
		</article>
	);
}

const statusTone: Record<string, string> = {
	Cancelled: "bg-danger-50 text-danger-500",
	Completed: "bg-success-50 text-success-600",
	Delivering: "bg-brand-50 text-brand-600",
	Failed: "bg-danger-50 text-danger-500",
	Pending: "bg-warning-50 text-warning-600",
};

/** Latest orders as compact rows - readable at any width, no sideways scroll. */
export function RecentOrdersList({ orders }: { orders: AdminDashboardData["recentOrders"] }) {
	return (
		<article className={cn(card, "p-[20px] sm:p-6")}>
			<div className="mb-[12px] flex items-center justify-between gap-[12px]">
				<h2 className="m-0 text-[18px] font-semibold text-ink-900">Recent orders</h2>
				<Link className="text-[13px] font-semibold text-brand-600 hover:text-brand-700" href={routes.orders}>
					View all
				</Link>
			</div>
			{orders.length ? (
				<ul className="m-0 list-none divide-y divide-surface-line p-0">
					{orders.map((order) => (
						<li className="m-0" key={order.id}>
							<Link
								className="-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[16px] gap-y-1 rounded-base px-2 py-[12px] transition-colors hover:bg-surface-body sm:grid-cols-[minmax(0,1fr)_110px_96px_100px]"
								href={`${routes.orders}/${encodeURIComponent(order.id.replace(/^#/, ""))}`}
							>
								<span className="min-w-0">
									<span className="block truncate text-[14px] font-medium text-ink-900">{order.name}</span>
									<span className="block truncate text-[12px] text-ink-400">{order.id}</span>
								</span>
								<span className="hidden text-[13px] text-ink-500 sm:block">{order.date}</span>
								<span className="text-right text-[14px] font-semibold text-ink-900 sm:text-left">{order.price}</span>
								<span className="col-span-2 flex gap-1.5 sm:col-span-1">
									<span className={cn("rounded-full px-2 py-0.5 text-[12px] font-semibold", statusTone[order.status] ?? "bg-surface-muted text-ink-600")}>
										{order.status}
									</span>
									<span className="rounded-full bg-surface-muted px-2 py-0.5 text-[12px] font-medium text-ink-500 sm:hidden">
										{order.date}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<p className="m-0 py-8 text-center text-[14px] text-ink-400">No orders yet.</p>
			)}
		</article>
	);
}

/** Best sellers by units sold, as a ranked list. */
export function TopProductsList({ products }: { products: AdminDashboardData["topProducts"] }) {
	return (
		<article className={cn(card, "p-[20px] sm:p-6")}>
			<div className="mb-[12px] flex items-center justify-between gap-[12px]">
				<h2 className="m-0 text-[18px] font-semibold text-ink-900">Best sellers</h2>
				<Link className="text-[13px] font-semibold text-brand-600 hover:text-brand-700" href={routes.products}>
					Products
				</Link>
			</div>
			{products.length ? (
				<ol className="m-0 list-none space-y-1 p-0">
					{products.map((product, index) => (
						<li className="m-0 flex items-center gap-[12px] rounded-base px-1 py-2" key={`${product.name}-${index}`}>
							<span className="w-4 text-center text-[13px] font-semibold text-ink-400">{index + 1}</span>
							<span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-base bg-surface-muted">
								{product.image ? (
									<Image alt="" className="object-cover" fill sizes="44px" src={product.image} />
								) : null}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[14px] font-medium text-ink-900">{product.name}</span>
								<span className="block text-[12px] text-ink-400">
									{product.orders} sold · {product.stock} in stock
								</span>
							</span>
							<span className="text-right">
								<span className="block text-[14px] font-semibold text-ink-900">{product.amount}</span>
								<span className="block text-[12px] text-ink-400">{product.price}</span>
							</span>
						</li>
					))}
				</ol>
			) : (
				<p className="m-0 py-8 text-center text-[14px] text-ink-400">No sales yet.</p>
			)}
		</article>
	);
}
