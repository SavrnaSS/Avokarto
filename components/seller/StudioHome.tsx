"use client";

import { Check, ChevronDown, ChevronRight, Clapperboard, Copy, ExternalLink, MessageCircle, PackagePlus, Palette, BarChart3, Share2, UserRound, Wallet, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { withShareRef } from "@/lib/storeTraffic";
import { readableOn } from "@/components/stores/storeTheme";
import { TrendingPicks, VideoPromo } from "./HomeGrowth";
import type { Overview } from "./SellerDashboard";
import { initialsOf } from "./StoreForm";
import { useCountUp } from "./useCountUp";
import { money, shareLink, whatsappShareUrl, type SellerStore } from "./sellerApi";
import styles from "./seller.module.css";
import h from "./studio-home.module.css";

type Go = (tab: "billing" | "catalog" | "insights" | "orders" | "overview" | "payouts" | "products" | "settings" | "videos", extra?: Record<string, string>) => void;

/**
 * Seller studio home. Quiet chrome, and the colour goes into the seller's own
 * data: the 14-day chart, product photos and the money. Until the first sale the
 * setup guide leads, because that is the next thing to do.
 * Designed with unslop by Damir Sokolovsky (@heydamir), CC BY 4.0.
 */
export default function StudioHome({ data, link, onTab, onToast }: { data: Overview; link: string; onTab: Go; onToast: (message: string) => void }) {
	const { balances, daily, last30Days, listings, settings, store } = data;
	const [metric, setMetric] = useState<"earned" | "orders">("earned");
	const [activeDay, setActiveDay] = useState<number | null>(null);
	const valueOf = (day: Overview["daily"][number]) => (metric === "earned" ? day.earned : day.orders);
	const formatMetric = (value: number) => (metric === "earned" ? money(value) : `${value} order${value === 1 ? "" : "s"}`);
	const peak = Math.max(...daily.map(valueOf), 0);
	const total14 = daily.reduce((sum, day) => sum + valueOf(day), 0);
	const selected = activeDay === null ? null : daily[activeDay];
	const withdrawable = useCountUp(balances.withdrawable, 700);
	const hasSale = balances.lifetime > 0 || last30Days.orders > 0;

	const copyLink = async () => {
		await navigator.clipboard?.writeText(link);
		onToast("Store link copied - paste it anywhere");
	};

	const steps = [
		{ action: () => onTab("settings"), button: "Add logo", done: Boolean(store.logoUrl || store.bannerUrl), label: "Brand your store", text: "Upload a logo or cover and pick a theme so your store looks like your own website." },
		{ action: () => onTab("catalog"), button: "Add products", done: listings.active >= 5, label: `Add at least 5 products (${Math.min(listings.active, 5)}/5)`, text: "Pick products from Avokarto's catalog and set your margin. We handle stock and shipping." },
		{ action: copyLink, button: "Copy store link", done: hasSale, label: "Share your store link", text: "Post your link on WhatsApp Status, Instagram or Facebook - that's where your first customers come from." },
		{ action: () => onTab("payouts"), button: "Add payout details", done: "method" in store.payoutDetails, label: "Set up payouts", text: "Add UPI or bank details so your earnings can be paid out." },
		{ action: () => onTab("orders"), button: "View orders", done: balances.lifetime > 0, label: "Get your first order", text: "Orders placed through your store show up instantly - you earn your margin on each one." },
	];
	const completed = steps.filter((step) => step.done).length;
	const firstOpen = steps.findIndex((step) => !step.done);
	const [openStep, setOpenStep] = useState<number | null>(null);
	const expanded = openStep ?? firstOpen;
	const [guideHidden, setGuideHidden] = useState(false);
	const showGuide = completed < steps.length && !guideHidden;

	const orders14 = daily.reduce((sum, day) => sum + day.orders, 0);
	const numbers = [
		{ label: "Sales", note: "Last 30 days", tab: "insights" as const, value: money(last30Days.sales) },
		{ label: "Orders", note: `${orders14} in the last 14 days`, tab: "orders" as const, value: String(last30Days.orders) },
		{ label: "Units sold", note: "Last 30 days", tab: "orders" as const, value: String(last30Days.units) },
		{ label: "Products live", note: listings.active >= 5 ? "Ready to sell" : `${5 - listings.active} more to reach 5`, tab: "products" as const, value: String(listings.active) },
	];
	const ring = 2 * Math.PI * 16;
	const latest = daily.length - 1;

	const guide = showGuide ? (
		<section aria-labelledby="home-guide" className={h.panel}>
			<div className={h.panelHead}>
				<div className={h.guideTitle}>
					<svg aria-hidden="true" className={h.ring} viewBox="0 0 40 40">
						<circle cx="20" cy="20" r="16" />
						<circle cx="20" cy="20" r="16" strokeDasharray={ring} strokeDashoffset={ring * (1 - completed / steps.length)} />
					</svg>
					<div>
						<h2 className={h.title} id="home-guide">{hasSale ? "Finish setting up" : "Get your first sale"}</h2>
						<p className={h.sub}>{completed} of {steps.length} done</p>
					</div>
				</div>
				<button aria-label="Hide setup guide" className={h.iconButton} onClick={() => setGuideHidden(true)} type="button"><X size={16} /></button>
			</div>
			<ol className={h.steps}>
				{steps.map((step, index) => {
					const open = index === expanded;
					return (
						<li data-done={step.done ? "" : undefined} data-open={open ? "" : undefined} key={step.label}>
							<span aria-hidden="true" className={h.stepDot}>{step.done ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
							<div className={h.stepMain}>
								<button aria-expanded={open} className={h.stepToggle} onClick={() => setOpenStep(open ? -1 : index)} type="button">
									<span>{step.label}</span>
									<ChevronDown aria-hidden="true" size={16} />
								</button>
								{open ? (
									<div className={h.stepBody}>
										<p>{step.text}</p>
										{!step.done ? <button className={`${styles.btn} ${styles.btnSm} ${h.action}`} onClick={() => void step.action()} type="button">{step.button}</button> : null}
									</div>
								) : null}
							</div>
						</li>
					);
				})}
			</ol>
		</section>
	) : null;

	const balance = (
		<section aria-labelledby="home-balance" className={h.panel}>
			<div className={h.panelHead}>
				<h2 className={h.title} id="home-balance">Balance</h2>
				<button className={h.textButton} onClick={() => onTab("payouts")} type="button">Details<ChevronRight aria-hidden="true" size={14} /></button>
			</div>
			<p className={h.sub}>Ready to withdraw</p>
			<p className={h.balance}>{money(withdrawable)}</p>
			<dl className={h.balanceList}>
				<div><dt>Pending</dt><dd>{money(balances.pending)}</dd></div>
				<div><dt>Lifetime</dt><dd>{money(balances.lifetime)}</dd></div>
				<div><dt>Paid out</dt><dd>{money(balances.paid)}</dd></div>
			</dl>
			<button className={`${styles.btn} ${styles.btnBlock}`} disabled={balances.withdrawable <= 0} onClick={() => onTab("payouts")} type="button"><Wallet size={16} /> Withdraw</button>
			<p className={h.fine}>Earnings unlock {settings.holdDays} days after delivery.</p>
		</section>
	);

	return (
		<div className={h.wrap}>
			<div className={h.home}>
				<div className={h.areaStore}><StoreHeader link={link} onToast={onToast} store={store} /></div>

				<div className={h.areaMain}>
				<section aria-label="Last 30 days" className={`${h.panel} ${h.numbers}`}>
					{numbers.map((item) => (
						<button className={h.number} key={item.label} onClick={() => onTab(item.tab)} type="button">
							<span className={h.numberLabel}>{item.label}<ChevronRight aria-hidden="true" size={14} /></span>
							<span className={h.numberValue}>{item.value}</span>
							<span className={h.numberNote}>{item.note}</span>
						</button>
					))}
				</section>

				<section aria-labelledby="home-chart" className={h.panel}>
					<div className={h.chartHead}>
						<div aria-live="polite">
							<h2 className={h.sub} id="home-chart">{selected ? new Date(`${selected.date}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) : `${metric === "earned" ? "Earnings" : "Orders"} · last 14 days`}</h2>
							<p className={h.chartTotal}>{formatMetric(selected ? valueOf(selected) : total14)}</p>
						</div>
						<div className={h.chartTools}>
							<span className={h.live}><span className={h.liveDot} />Live</span>
							<div aria-label="Chart metric" className={h.segment} role="group">
								<button aria-pressed={metric === "earned"} onClick={() => setMetric("earned")} type="button">Earnings</button>
								<button aria-pressed={metric === "orders"} onClick={() => setMetric("orders")} type="button">Orders</button>
							</div>
						</div>
					</div>
					<div className={h.chart} onMouseLeave={() => setActiveDay(null)}>
						<div aria-label={`Daily ${metric === "earned" ? "earnings" : "orders"} for the last 14 days`} className={h.bars} role="group">
							{daily.map((day, index) => {
								const value = valueOf(day);
								return (
									<button
										aria-label={`${day.date}: ${money(day.earned)} from ${day.orders} order(s)`}
										aria-pressed={activeDay === index}
										className={h.barCol}
										data-latest={index === latest ? "" : undefined}
										key={day.date}
										onBlur={() => setActiveDay(null)}
										onClick={() => setActiveDay(activeDay === index ? null : index)}
										onFocus={() => setActiveDay(index)}
										onMouseEnter={() => setActiveDay(index)}
										type="button"
									>
										<span className={h.bar} data-empty={value > 0 ? undefined : ""} style={{ "--fill": peak > 0 ? Math.max(0.03, value / peak) : 0.03 } as React.CSSProperties} />
										<span className={h.barLabel}>{Number(day.date.slice(8))}</span>
									</button>
								);
							})}
						</div>
						{peak === 0 ? (
							<div className={h.chartEmpty}>
								<p className={h.title}>No {metric === "earned" ? "earnings" : "orders"} yet</p>
								<p className={h.sub}>Share your store link. Your first sale shows up here the moment it happens.</p>
								<button className={`${styles.btn} ${styles.btnSm} ${h.action}`} onClick={() => void copyLink()} type="button"><Copy size={14} /> Copy store link</button>
							</div>
						) : null}
					</div>
				</section>
				</div>

				<div className={h.areaSide}>
					{hasSale ? <>{balance}{guide}</> : <>{guide}{balance}</>}
				</div>

				<TrendingPicks className={h.areaTrend} onSeeAll={() => onTab("catalog")} onToast={onToast} settings={settings} store={store} />

				<nav aria-label="Quick actions" className={`${h.panel} ${h.quick} ${h.areaQuick}`}>
					{QUICK.map((action) => (
						<button className={h.quickItem} key={action.title} onClick={() => onTab(action.tab, action.extra)} type="button">
							<action.icon aria-hidden="true" size={18} />
							<span><strong>{action.title}</strong><small>{action.text}</small></span>
							<ChevronRight aria-hidden="true" className={h.quickArrow} size={16} />
						</button>
					))}
				</nav>
				<VideoPromo className={h.areaVideo} onOpen={() => onTab("videos")} />
			</div>
		</div>
	);
}

const QUICK = [
	{ extra: undefined, icon: PackagePlus, tab: "catalog" as const, text: "Browse the catalog", title: "Add products" },
	{ extra: undefined, icon: Clapperboard, tab: "videos" as const, text: "Promo videos in seconds", title: "Create a video" },
	{ extra: { customize: "1" }, icon: Palette, tab: "settings" as const, text: "Live theme customizer", title: "Design store" },
	{ extra: undefined, icon: BarChart3, tab: "insights" as const, text: "Visits and sources", title: "Analytics" },
];

/** The store's name, status and address, with the ways to share it. */
function StoreHeader({ link, onToast, store }: { link: string; onToast: (message: string) => void; store: SellerStore }) {
	// Tagged so Analytics can credit WhatsApp, whose in-app browser hides the referrer.
	const shareText = `Shop my store "${store.name}" on Avokarto 🛍️ ${withShareRef(link, "whatsapp")}`;
	const live = store.status === "active";
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timer = window.setTimeout(() => setCopied(false), 1800);
		return () => window.clearTimeout(timer);
	}, [copied]);

	return (
		<section className={h.store}>
			<div className={h.storeId}>
				<span className={h.logo} style={{ background: store.accentColor, color: readableOn(store.accentColor) }}>
					{store.logoUrl ? <Image alt="" fill sizes="56px" src={store.logoUrl} style={{ objectFit: "cover" }} /> : initialsOf(store.name)}
				</span>
				<div className={h.storeText}>
					<h1 className={h.storeName}>{store.name}</h1>
					<p className={h.status} data-live={live ? "" : undefined}>
						<span className={h.liveDot} />{live ? "Live" : store.status === "unpaid" ? "Offline - no plan" : "Suspended"}
					</p>
				</div>
			</div>
			<div className={h.share}>
				<div className={h.link}>
					<a href={link} rel="noopener" target="_blank" title="Open your store">{link.replace(/^https?:\/\//, "")}</a>
					<button
						aria-label="Copy store link"
						className={h.copy}
						data-copied={copied ? "" : undefined}
						onClick={async () => {
							await navigator.clipboard?.writeText(link);
							setCopied(true);
							onToast("Store link copied");
						}}
						title="Copy link"
						type="button"
					>
						{copied ? <Check size={16} /> : <Copy size={16} />}
					</button>
				</div>
				<a className={h.whatsapp} href={whatsappShareUrl(shareText)} rel="noopener" target="_blank"><MessageCircle aria-hidden="true" size={16} /><span>WhatsApp</span></a>
				<button
					aria-label="Share store"
					className={h.iconButton}
					onClick={async () => {
						const result = await shareLink({ text: shareText, title: store.name, url: link });
						if (result === "copied") onToast("Store link copied");
					}}
					title="Share"
					type="button"
				>
					<Share2 size={16} />
				</button>
				<a aria-label="View store" className={h.iconButton} href={link} rel="noopener" target="_blank" title="View store"><ExternalLink size={16} /></a>
				<a aria-label="Public profile" className={h.iconButton} href={`/sellers/${store.handle}`} rel="noopener" target="_blank" title="Public profile"><UserRound size={16} /></a>
			</div>
		</section>
	);
}
