"use client";

import { ArrowDownRight, ArrowUpRight, BarChart3, Facebook, Globe, Instagram, MessageCircle, Music2, Search, Share2, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import { TRAFFIC_LABELS, type TrafficSource } from "@/lib/storeTraffic";
import ProductImage from "./ProductImage";
import { money } from "./sellerApi";
import styles from "./seller.module.css";

type Insights = {
	changes: { conversion: number | null; orders: number | null; sales: number | null; visitors: number | null };
	daily: { day: string; orders: number; visitors: number }[];
	days: number;
	liveVisitors: number;
	products: { addToCart: number; conversion: number; imageUrl: string; name: string; orders: number; slug: string; views: number }[];
	sources: { addToCart: number; source: TrafficSource; visitors: number }[];
	totals: {
		addToCart: number;
		addToCartRate: number;
		conversion: number;
		earned: number;
		orders: number;
		productViews: number;
		sales: number;
		storeViews: number;
		visitors: number;
	};
};

const SOURCE_ICONS: Record<TrafficSource, typeof Globe> = {
	direct: Share2,
	facebook: Facebook,
	google: Search,
	instagram: Instagram,
	other: Globe,
	tiktok: Music2,
	whatsapp: MessageCircle,
	youtube: Youtube,
};
const SOURCE_COLORS: Record<TrafficSource, string> = {
	direct: "#64748b",
	facebook: "#1877f2",
	google: "#ea4335",
	instagram: "#d6249f",
	other: "#94a3b8",
	tiktok: "#111111",
	whatsapp: "#1fa855",
	youtube: "#ff0000",
};
const PERIODS = [7, 30, 90] as const;
const shortDay = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC", weekday: "short" });
const compact = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, notation: "compact" });
const dayDate = (day: string) => new Date(`${day}T00:00:00Z`);

/** Signed change vs the previous period; green when up is good, red when down. */
function Change({ days, value }: { days: number; value: number | null }) {
	if (value === null) return <span className={styles.anDelta}>No earlier data</span>;
	const up = value >= 0;
	return (
		<span className={styles.anDelta} data-dir={value === 0 ? "flat" : up ? "up" : "down"}>
			{value === 0 ? null : up ? <ArrowUpRight aria-hidden="true" size={13} /> : <ArrowDownRight aria-hidden="true" size={13} />}
			{up && value > 0 ? "+" : value < 0 ? "−" : ""}{Math.abs(value)}%
			<small>vs previous {days}d</small>
		</span>
	);
}

/** A small trend line for a stat tile. Decorative: the tile states the value. */
function Sparkline({ values }: { values: number[] }) {
	if (values.length < 2) return null;
	const max = Math.max(...values, 1);
	const width = 100;
	const height = 28;
	const step = width / (values.length - 1);
	const points = values.map((value, index) => `${(index * step).toFixed(2)},${(height - 2 - (value / max) * (height - 4)).toFixed(2)}`);
	return (
		<svg aria-hidden="true" className={styles.anSpark} preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
			<polygon points={`0,${height} ${points.join(" ")} ${width},${height}`} />
			<polyline points={points.join(" ")} />
		</svg>
	);
}

/** Traffic, funnel and product performance for the seller's store. */
export default function SellerInsights({ storeLink }: { storeLink: string }) {
	const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
	const [active, setActive] = useState<number | null>(null);
	const [copied, setCopied] = useState(false);
	const insights = useLiveResource<Insights | null>({
		dataKey: String(days),
		endpoint: `/api/seller/insights?days=${days}`,
		initialData: null,
		// New orders refresh it live; visits refresh on the timer below.
		topics: ["orders"],
	});
	const { refresh } = insights;

	useEffect(() => {
		const timer = window.setInterval(() => {
			if (document.visibilityState === "visible") void refresh();
		}, 30_000);
		return () => window.clearInterval(timer);
	}, [refresh]);

	const data = insights.data;

	// Filters: one row above everything they scope.
	const header = (
		<div className={styles.anHead}>
			<div>
				<h2 className={styles.cardTitle}>Insights</h2>
				<p className={styles.muted}>Who visits your store, where they come from, and what they buy.</p>
			</div>
			<div className={styles.anHeadTools}>
				{data ? (
					<span className={styles.liveDot} title="Visitors active in the last 5 minutes">
						{data.liveVisitors} browsing now
					</span>
				) : null}
				<div aria-label="Period" className={styles.anPeriods} role="group">
					{PERIODS.map((period) => (
						<button aria-pressed={days === period} key={period} onClick={() => { setDays(period); setActive(null); }} type="button">
							{period === 7 ? "7 days" : period === 30 ? "30 days" : "90 days"}
						</button>
					))}
				</div>
			</div>
		</div>
	);

	if (!data) {
		return (
			<section className={styles.anPage}>
				{header}
				{insights.error ? <p className={styles.alert} role="alert">{insights.error}</p> : <div className={styles.skeleton} style={{ height: 360 }} />}
			</section>
		);
	}

	const { totals } = data;
	const peakVisitors = Math.max(...data.daily.map((day) => day.visitors), 1);
	const peakOrders = Math.max(...data.daily.map((day) => day.orders), 1);
	const funnel = [
		{ label: "Visitors", value: totals.visitors },
		// A count of views, not people: one visitor can view several products.
		{ label: "Product views", value: totals.productViews },
		{ label: "Added to cart", value: totals.addToCart },
		{ label: "Ordered", value: totals.orders },
	];
	const funnelTop = Math.max(...funnel.map((step) => step.value), 1);
	// Where most shoppers are lost: the step with the lowest pass-through.
	const drops = funnel.slice(1).map((step, index) => ({ from: funnel[index], rate: funnel[index].value ? step.value / funnel[index].value : 1, to: step }));
	const worst = drops.filter((drop) => drop.from.value > 0).sort((a, b) => a.rate - b.rate)[0];
	const sourceTotal = data.sources.reduce((sum, source) => sum + source.visitors, 0) || 1;
	const bestSource = [...data.sources].filter((source) => source.visitors >= 5).sort((a, b) => b.addToCart / b.visitors - a.addToCart / a.visitors)[0];
	const empty = totals.visitors === 0 && totals.orders === 0;
	// Label every few days so 30/90-day charts stay readable on phones.
	const labelEvery = data.days <= 7 ? 1 : data.days <= 30 ? 5 : 15;
	const focused = active !== null ? data.daily[active] : null;
	const peakProductViews = Math.max(...data.products.map((product) => product.views), 1);

	const kpis = [
		{ change: data.changes.visitors, label: "Visitors", spark: data.daily.map((day) => day.visitors), value: compact.format(totals.visitors) },
		{ change: data.changes.orders, label: "Orders", spark: data.daily.map((day) => day.orders), value: compact.format(totals.orders) },
		{ change: data.changes.conversion, label: "Conversion rate", spark: null, value: `${totals.conversion}%` },
		{ change: data.changes.sales, label: "Sales", note: `You earned ${money(totals.earned)}`, spark: null, value: money(totals.sales) },
	];

	const dayColumns = (metric: "orders" | "visitors", peak: number, height: number) =>
		data.daily.map((day, index) => (
			<div
				aria-label={`${longDay.format(dayDate(day.day))}: ${day.visitors} visitors, ${day.orders} orders`}
				className={styles.anCol}
				data-active={active === index || undefined}
				key={day.day}
				onBlur={() => setActive(null)}
				onFocus={() => setActive(index)}
				onPointerEnter={() => setActive(index)}
				role="listitem"
				tabIndex={metric === "visitors" ? 0 : -1}
			>
				<span
					className={styles.anBar}
					data-empty={!day[metric] || undefined}
					data-metric={metric}
					style={{ height: day[metric] ? `${Math.max(4, (day[metric] / peak) * height)}px` : "2px" }}
				/>
			</div>
		));

	return (
		<section className={styles.anPage}>
			{header}

			{empty ? (
				<div className={`${styles.card} ${styles.empty}`}>
					<span className={styles.emptyIcon}><BarChart3 /></span>
					<p className={styles.cardTitle}>No visits in the last {data.days} days</p>
					<p className={styles.muted}>Share your store link on WhatsApp or Instagram - visits, carts and orders will show up here within seconds.</p>
					<button
						className={styles.btn}
						onClick={async () => {
							await navigator.clipboard?.writeText(storeLink);
							setCopied(true);
							window.setTimeout(() => setCopied(false), 1800);
						}}
						type="button"
					>
						{copied ? "Link copied" : "Copy store link"}
					</button>
				</div>
			) : null}

			<div className={styles.anKpis}>
				{kpis.map((kpi, index) => (
					<div className={styles.anKpi} data-hero={index === 3 || undefined} key={kpi.label}>
						<p className={styles.anKpiLabel}>{kpi.label}</p>
						<p className={styles.anKpiValue}>{kpi.value}</p>
						<Change days={data.days} value={kpi.change} />
						{kpi.spark ? <Sparkline values={kpi.spark} /> : kpi.note ? <p className={styles.anKpiNote}>{kpi.note}</p> : null}
					</div>
				))}
			</div>

			<section className={`${styles.card} ${styles.anChartCard}`}>
				<div className={styles.cardHead}>
					<h3 className={styles.cardTitle}>Visitors &amp; orders by day</h3>
					{/* Hover/focus readout: the day under the pointer, or the period totals. */}
					<p aria-live="polite" className={styles.anReadout}>
						{focused ? (
							<>
								<span>{longDay.format(dayDate(focused.day))}</span>
								<strong>{focused.visitors}</strong> visitors · <strong>{focused.orders}</strong> {focused.orders === 1 ? "order" : "orders"}
							</>
						) : (
							<>
								<span>Last {data.days} days</span>
								<strong>{totals.visitors.toLocaleString("en-US")}</strong> visitors · <strong>{totals.orders}</strong> orders
							</>
						)}
					</p>
				</div>
				<div className={styles.anChart} onPointerLeave={() => setActive(null)}>
					<p className={styles.anChartLabel}>Visitors <span>peak {peakVisitors}</span></p>
					<div aria-label={`Daily visitors, last ${data.days} days`} className={styles.anCols} data-size="lg" role="list">
						{dayColumns("visitors", peakVisitors, 132)}
					</div>
					<p className={styles.anChartLabel}>Orders <span>peak {peakOrders}</span></p>
					<div aria-hidden="true" className={styles.anCols} data-size="sm">
						{dayColumns("orders", peakOrders, 44)}
					</div>
					<div aria-hidden="true" className={styles.anAxis}>
						{data.daily.map((day, index) => (
							<span key={day.day}>{index % labelEvery === 0 || index === data.daily.length - 1 ? shortDay.format(dayDate(day.day)) : ""}</span>
						))}
					</div>
				</div>
				<details className={styles.anTable}>
					<summary>View as table</summary>
					<div className={styles.anTableScroll}>
						<table>
							<thead><tr><th scope="col">Day</th><th scope="col">Visitors</th><th scope="col">Orders</th></tr></thead>
							<tbody>
								{[...data.daily].reverse().map((day) => (
									<tr key={day.day}><th scope="row">{longDay.format(dayDate(day.day))}</th><td>{day.visitors}</td><td>{day.orders}</td></tr>
								))}
							</tbody>
						</table>
					</div>
				</details>
			</section>

			<div className={styles.anGrid}>
				<section className={styles.card}>
					<div className={styles.cardHead}><h3 className={styles.cardTitle}>Shopping funnel</h3></div>
					<ol className={styles.anFunnel}>
						{funnel.map((step, index) => {
							const previous = index ? funnel[index - 1].value : null;
							const isWorst = worst && worst.to.label === step.label;
							return (
								<li data-worst={isWorst || undefined} key={step.label}>
									{previous !== null ? (
										<span className={styles.anFunnelRate}>{!previous ? "-" : step.label === "Product views" ? `${(step.value / previous).toFixed(1)} views per visitor` : `${Math.round((step.value / previous) * 100)}% continue`}</span>
									) : null}
									<div className={styles.anFunnelRow}>
										<span>{step.label}</span>
										<strong>{step.value.toLocaleString("en-US")}</strong>
									</div>
									<span aria-hidden="true" className={styles.anFunnelBar}><span style={{ width: `${Math.max(step.value ? 2 : 0, (step.value / funnelTop) * 100)}%` }} /></span>
								</li>
							);
						})}
					</ol>
					{worst && worst.rate < 1 ? (
						<p className={styles.anInsight}>
							<strong>Biggest drop:</strong> {worst.from.label.toLowerCase()} → {worst.to.label.toLowerCase()} ({Math.round((1 - worst.rate) * 100)}% leave).{" "}
							{worst.to.label === "Added to cart"
								? "Sharper photos and a clear price on product pages help here."
								: worst.to.label === "Ordered"
									? "Free-shipping offers and a WhatsApp chat button help shoppers finish."
									: "Feature your best products at the top of your store."}
						</p>
					) : null}
				</section>

				<section className={styles.card}>
					<div className={styles.cardHead}><h3 className={styles.cardTitle}>Where visitors come from</h3></div>
					{data.sources.length ? (
						<>
							<div aria-hidden="true" className={styles.anShare}>
								{data.sources.map((source) => (
									<span key={source.source} style={{ background: SOURCE_COLORS[source.source], flexGrow: source.visitors }} title={`${TRAFFIC_LABELS[source.source]}: ${source.visitors}`} />
								))}
							</div>
							<ul className={styles.anSources}>
								{data.sources.map((source) => {
									const Icon = SOURCE_ICONS[source.source];
									const share = Math.round((source.visitors / sourceTotal) * 100);
									return (
										<li key={source.source}>
											<span aria-hidden="true" className={styles.sourceIcon} style={{ background: SOURCE_COLORS[source.source] }}><Icon size={14} /></span>
											<span className={styles.anSourceName}>
												<strong>{TRAFFIC_LABELS[source.source]}</strong>
												<small>{source.addToCart} {source.addToCart === 1 ? "cart" : "carts"} · {source.visitors ? Math.round((source.addToCart / source.visitors) * 100) : 0}% add to cart</small>
											</span>
											<span className={styles.anSourceValue}>
												<strong>{source.visitors.toLocaleString("en-US")}</strong>
												<small>{share}%</small>
											</span>
										</li>
									);
								})}
							</ul>
							{bestSource && data.sources.length > 1 ? (
								<p className={styles.anInsight}>
									<strong>{TRAFFIC_LABELS[bestSource.source]}</strong> visitors add to cart most often - share there more.
								</p>
							) : null}
						</>
					) : (
						<p className={styles.muted}>No visits yet.</p>
					)}
					<p className={styles.hint} style={{ marginTop: 12 }}>Links you share from this dashboard are tagged, so WhatsApp visits are counted even when WhatsApp hides the referrer.</p>
				</section>
			</div>

			<section className={styles.card}>
				<div className={styles.cardHead}>
					<h3 className={styles.cardTitle}>Top products</h3>
					{data.products.length ? <span className={styles.hint}>By views, last {data.days} days</span> : null}
				</div>
				{data.products.length ? (
					<div className={styles.anProducts} role="table" aria-label="Top products">
						<div className={styles.anProductsHead} role="row">
							<span role="columnheader">Product</span>
							<span role="columnheader">Views</span>
							<span role="columnheader">Carts</span>
							<span role="columnheader">Orders</span>
							<span role="columnheader">Conv.</span>
						</div>
						{data.products.map((product, index) => (
							<div className={styles.anProduct} key={product.slug} role="row">
								<span className={styles.anProductName} role="cell">
									<span className={styles.anRank}>{index + 1}</span>
									<span className={styles.listingThumb} style={{ height: 40, width: 40 }}>
										{product.imageUrl ? <ProductImage alt="" sizes="40px" src={product.imageUrl} /> : null}
									</span>
									<strong title={product.name}>{product.name}</strong>
								</span>
								<span className={styles.anViews} data-label="Views" role="cell">
									<b>{product.views.toLocaleString("en-US")}</b>
									<i aria-hidden="true"><i style={{ width: `${(product.views / peakProductViews) * 100}%` }} /></i>
								</span>
								<span data-label="Carts" role="cell">{product.addToCart}</span>
								<span data-label="Orders" role="cell">{product.orders}</span>
								<span data-label="Conv." data-good={product.conversion >= totals.conversion && product.orders > 0 ? "" : undefined} role="cell">{product.conversion}%</span>
							</div>
						))}
					</div>
				) : (
					<p className={styles.muted}>Product views and sales will appear here.</p>
				)}
			</section>
		</section>
	);
}
