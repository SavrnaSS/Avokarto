"use client";

import { Check, ChevronDown, CircleDollarSign, ClipboardList, Clock3, Package, Search, ShoppingBag, Truck, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import { money } from "./sellerApi";
import styles from "./seller.module.css";

type SellerOrder = {
	availableAt: string | null;
	createdAt: string;
	customer: string;
	earning: number;
	earningStatus: "available" | "cancelled" | "pending";
	items: { name: string; quantity: number; salePrice: number }[];
	orderNumber: string;
	orderStatus: string;
	sales: number;
};
const EMPTY: SellerOrder[] = [];

const ORDER_STATUS: Record<string, { className: string; label: string }> = {
	cancelled: { className: styles.badgeRed, label: "Cancelled" },
	completed: { className: styles.badgeGreen, label: "Delivered" },
	delivering: { className: styles.badgeAmber, label: "On the way" },
	failed: { className: styles.badgeRed, label: "Failed" },
	pending: { className: styles.badge, label: "Placed" },
};
// How far along the delivery each status is (0 placed, 1 shipped, 2 delivered).
const STAGE: Record<string, number> = { completed: 2, delivering: 1, pending: 0 };
const STEPS = [
	{ icon: ClipboardList, label: "Placed" },
	{ icon: Truck, label: "On the way" },
	{ icon: Package, label: "Delivered" },
];
const FILTERS = [
	["all", "All"],
	["pending", "In progress"],
	["available", "Earned"],
	["cancelled", "Cancelled"],
] as const;
type Filter = (typeof FILTERS)[number][0];
const SORTS = [
	["newest", "Newest first"],
	["oldest", "Oldest first"],
	["earning", "Highest earning"],
] as const;
type Sort = (typeof SORTS)[number][0];
// Still moving: these get the full card with the delivery tracker.
const ACTIVE = new Set(["pending", "delivering"]);

const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

/** "Today", "Yesterday", "This week", then the month ("September 2026"). */
function groupLabel(iso: string, now = new Date()) {
	const date = new Date(iso);
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const day = 86_400_000;
	if (date.getTime() >= startOfToday) return "Today";
	if (date.getTime() >= startOfToday - day) return "Yesterday";
	if (date.getTime() >= startOfToday - 6 * day) return "This week";
	return monthLabel.format(date);
}

/** Orders placed through the store, with what each one earns. */
export default function SellerOrders() {
	const orders = useLiveResource<SellerOrder[]>({
		endpoint: "/api/seller/orders",
		initialData: EMPTY,
		topics: ["resellers", "orders"],
	});
	const [filter, setFilter] = useState<Filter>("all");
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<Sort>("newest");

	const counts = useMemo(() => {
		const result: Record<Filter, number> = { all: orders.data.length, available: 0, cancelled: 0, pending: 0 };
		for (const order of orders.data) result[order.earningStatus] += 1;
		return result;
	}, [orders.data]);

	const totals = useMemo(() => {
		let sales = 0;
		let earned = 0;
		let pending = 0;
		for (const order of orders.data) {
			if (order.earningStatus === "cancelled") continue;
			sales += order.sales;
			if (order.earningStatus === "available") earned += order.earning;
			else pending += order.earning;
		}
		return { earned, pending, sales };
	}, [orders.data]);

	const visible = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const matching = orders.data.filter((order) => {
			if (filter !== "all" && order.earningStatus !== filter) return false;
			if (!needle) return true;
			return (
				order.orderNumber.toLowerCase().includes(needle) ||
				order.customer.toLowerCase().includes(needle) ||
				order.items.some((item) => item.name.toLowerCase().includes(needle))
			);
		});
		const time = (order: SellerOrder) => Date.parse(order.createdAt);
		return matching.sort((a, b) => (sort === "oldest" ? time(a) - time(b) : sort === "earning" ? b.earning - a.earning : time(b) - time(a)));
	}, [filter, orders.data, query, sort]);

	// Orders still moving get their own section with the full tracker; finished
	// ones are history, in date sections (one flat list when sorted by earning).
	const active = useMemo(() => visible.filter((order) => ACTIVE.has(order.orderStatus)), [visible]);
	const groups = useMemo(() => {
		const history = visible.filter((order) => !ACTIVE.has(order.orderStatus));
		if (sort === "earning") return history.length ? [{ label: "History", orders: history }] : [];
		const list: { label: string; orders: SellerOrder[] }[] = [];
		for (const order of history) {
			const label = groupLabel(order.createdAt);
			const last = list.at(-1);
			if (last?.label === label) last.orders.push(order);
			else list.push({ label, orders: [order] });
		}
		return list;
	}, [sort, visible]);

	if (orders.loading && !orders.hasData) return <div className={styles.skeleton} style={{ height: 280 }} />;

	const stats = [
		{ icon: ShoppingBag, label: "Orders", tone: "blue", value: String(counts.all - counts.cancelled) },
		{ icon: CircleDollarSign, label: "Sales", tone: "violet", value: money(totals.sales) },
		{ icon: Wallet, label: "Earned", tone: "green", value: money(totals.earned) },
		{ icon: Clock3, label: "Pending", tone: "amber", value: money(totals.pending) },
	];

	return (
		<section className={styles.ordPage}>
			<div aria-label="Order summary" className={styles.ordStats} role="group">
				{stats.map((stat) => (
					<div className={styles.ordStat} data-tone={stat.tone} key={stat.label}>
						<span className={styles.ordStatText}>
							<small>{stat.label}</small>
							<strong>{stat.value}</strong>
						</span>
					</div>
				))}
			</div>

			<div className={styles.ordToolbar}>
				<div aria-label="Filter orders" className={styles.chips} role="group">
					{FILTERS.map(([key, label]) => (
						<button aria-pressed={filter === key} className={styles.chip} key={key} onClick={() => setFilter(key)} type="button">
							{label}
							<span className={styles.ordChipCount}>{counts[key]}</span>
						</button>
					))}
				</div>
				<div className={styles.ordTools}>
				<label className={styles.ordSort}>
					<span className="visually-hidden">Sort orders</span>
					<select onChange={(event) => setSort(event.target.value as Sort)} value={sort}>
						{SORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
					</select>
					<ChevronDown aria-hidden="true" size={15} />
				</label>
				<label className={`${styles.searchBar} ${styles.ordSearch}`}>
					<Search aria-hidden="true" />
					<span className="visually-hidden">Search orders</span>
					<input
						className={styles.input}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Order #, customer or product"
						type="search"
						value={query}
					/>
				</label>
				</div>
			</div>
			<p className={`${styles.hint} ${styles.ordLive}`}><span aria-hidden="true" />Updates live as Avokarto ships and delivers.</p>

			{orders.error ? <p className={styles.alert} role="alert">{orders.error}</p> : null}

			{!visible.length ? (
				<div className={`${styles.card} ${styles.empty}`}>
					<span className={styles.emptyIcon}><ClipboardList /></span>
					<p className={styles.cardTitle}>{query ? "No matching orders" : orders.data.length ? "No orders here" : "No orders yet"}</p>
					<p className={styles.muted}>
						{query
							? "Try an order number, a customer's name or a product."
							: "Share your store link - orders placed through it appear here instantly."}
					</p>
					{query || filter !== "all" ? (
						<button
							className={`${styles.ghost} ${styles.btnSm}`}
							onClick={() => {
								setQuery("");
								setFilter("all");
							}}
							type="button"
						>
							Clear filters
						</button>
					) : null}
				</div>
			) : (
				<div className={styles.ordGroups}>
					{active.length ? (
						<section aria-label="In progress" className={styles.ordGroup}>
							<h3 className={styles.ordGroupHead}>
								In progress
								<span>{active.length} {active.length === 1 ? "order" : "orders"} · {money(active.reduce((sum, order) => sum + order.earning, 0))} pending</span>
							</h3>
							<div className={styles.ordGrid}>
								{active.map((order) => <OrderCard key={order.orderNumber} order={order} />)}
							</div>
						</section>
					) : null}
					{groups.map((group) => {
						const earned = group.orders.reduce((sum, order) => sum + (order.earningStatus === "available" ? order.earning : 0), 0);
						return (
							<section aria-label={group.label} className={styles.ordGroup} key={group.label}>
								<h3 className={styles.ordGroupHead}>
									{group.label}
									<span>{group.orders.length} {group.orders.length === 1 ? "order" : "orders"} · {money(earned)} earned</span>
								</h3>
								<ul className={styles.ordRows}>
									{group.orders.map((order) => <OrderRow key={order.orderNumber} order={order} />)}
								</ul>
							</section>
						);
					})}
				</div>
			)}
		</section>
	);
}

/** A finished order (delivered, cancelled, failed) as one compact, expandable row. */
function OrderRow({ order }: { order: SellerOrder }) {
	const status = ORDER_STATUS[order.orderStatus] ?? { className: styles.badge, label: order.orderStatus };
	const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
	const first = order.items[0];
	const reversed = order.earningStatus === "cancelled";
	return (
		<li className={styles.ordRow} data-earning={order.earningStatus}>
			<details>
				<summary>
					<span className={styles.ordRowMain}>
						<span className={styles.ordRowTop}>
							<strong>{order.orderNumber}</strong>
							<span className={status.className}>{status.label}</span>
						</span>
						<span className={styles.ordRowSub}>
							{shortDate.format(new Date(order.createdAt))}
							{order.customer ? ` · ${order.customer}` : ""}
							{first ? ` · ${first.quantity}× ${first.name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}` : ""}
						</span>
					</span>
					<span className={styles.ordRowMoney}>
						<strong data-reversed={reversed && order.earning > 0 ? "" : undefined}>{reversed && order.earning === 0 ? "-" : money(order.earning)}</strong>
						<small>{reversed ? (order.earning === 0 ? "No earnings" : "Reversed") : "Earned"}</small>
					</span>
					<ChevronDown aria-hidden="true" className={styles.ordRowChevron} size={16} />
				</summary>
				<div className={styles.ordRowBody}>
					<ul className={styles.ordItems}>
						{order.items.map((item, index) => (
							<li key={`${item.name}-${index}`}>
								<span className={styles.ordQty}>{item.quantity}×</span>
								<span className={styles.ordItemName} title={item.name}>{item.name}</span>
								<span className={styles.ordItemPrice}>{money(item.salePrice * item.quantity)}</span>
							</li>
						))}
					</ul>
					<p className={styles.hint}>
						Order value {money(order.sales)} · {units} {units === 1 ? "item" : "items"} · placed {date.format(new Date(order.createdAt))}
					</p>
				</div>
			</details>
		</li>
	);
}

function OrderCard({ order }: { order: SellerOrder }) {
	const status = ORDER_STATUS[order.orderStatus] ?? { className: styles.badge, label: order.orderStatus };
	const stopped = order.orderStatus === "cancelled" || order.orderStatus === "failed";
	const stage = STAGE[order.orderStatus] ?? 0;
	const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<article className={styles.ordCard} data-earning={order.earningStatus}>
			<header className={styles.ordHead}>
				<div style={{ minWidth: 0 }}>
					<p className={styles.ordNumber}>{order.orderNumber}</p>
					<p className={styles.hint}>
						{date.format(new Date(order.createdAt))}
						{order.customer ? ` · ${order.customer}` : ""}
					</p>
				</div>
				<span className={status.className}>{status.label}</span>
			</header>

			{stopped ? (
				<p className={styles.ordStopped}>
					<X aria-hidden="true" size={14} /> {order.orderStatus === "failed" ? "Delivery failed" : "Order cancelled"} - no earnings from this one.
				</p>
			) : (
				<ol aria-label={`Delivery progress: ${status.label}`} className={styles.ordTrack}>
					{STEPS.map((step, index) => (
						<li data-state={index < stage || stage === 2 ? "done" : index === stage ? "current" : "todo"} key={step.label}>
							<span aria-hidden="true">{index < stage || stage === 2 ? <Check size={10} strokeWidth={3} /> : null}</span>
							<small>{step.label}</small>
						</li>
					))}
				</ol>
			)}

			<ul className={styles.ordItems}>
				{order.items.map((item, index) => (
					<li key={`${item.name}-${index}`}>
						<span className={styles.ordQty}>{item.quantity}×</span>
						<span className={styles.ordItemName} title={item.name}>{item.name}</span>
						<span className={styles.ordItemPrice}>{money(item.salePrice * item.quantity)}</span>
					</li>
				))}
			</ul>

			<footer className={styles.ordFoot}>
				<div>
					<small>Order value · {units} {units === 1 ? "item" : "items"}</small>
					<strong>{money(order.sales)}</strong>
				</div>
				<div className={styles.ordEarning}>
					<small><i aria-hidden="true" />
						{order.earningStatus === "cancelled" && order.earning === 0
							? "No earnings"
							: order.earningStatus === "cancelled"
							? "Margin reversed"
							: order.earningStatus === "available"
								? "You earned"
								: order.availableAt
									? `Unlocks ${shortDate.format(new Date(order.availableAt))}`
									: "Pending"}
					</small>
					<strong>{money(order.earning)}</strong>
				</div>
			</footer>
		</article>
	);
}
