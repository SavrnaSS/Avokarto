"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatCard } from "@/admin/components/layout/dashboard-widgets";
import { Icon } from "@/admin/components/layout/icon";
import { LiveDataStatus } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";
import { useRealtimeResource } from "@/admin/hooks/use-realtime-resource";
import { cn } from "@/admin/utils/cn";
import DataBoundary from "@/components/common/loading/DataBoundary";

/* ------------------------------------------------------------------------
 * Shared
 * --------------------------------------------------------------------- */

const usd = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });
const money = (value: number) => usd.format(value);
const shortDate = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
const when = (iso: string | null) => (iso ? shortDate.format(new Date(iso)) : "-");

type Settings = {
	advertisedProducts: number | null;
	holdDays: number;
	maxMarginPercent: number;
	minPayout: number;
	platformFeePercent: number;
	signupsOpen: boolean;
	subscriptionsRequired: boolean;
};

type PayoutDetails = {
	accountName?: string;
	accountNumber?: string;
	bankName?: string;
	ifsc?: string;
	method?: "bank" | "upi";
	upiId?: string;
};

type StoreRow = {
	accentColor: string;
	logoUrl: string;
	createdAt: string;
	customerEmail: string;
	customerName: string;
	earned: number;
	handle: string;
	id: string;
	listings: number;
	name: string;
	orders: number;
	payoutsBlocked: boolean;
	sales: number;
	status: "active" | "suspended" | "unpaid";
	suspendedReason: string;
	withdrawable: number;
};

async function adminSend<T>(method: string, url: string, body?: unknown): Promise<T> {
	const response = await fetch(url, {
		body: body === undefined ? undefined : JSON.stringify(body),
		cache: "no-store",
		credentials: "include",
		headers: body === undefined ? undefined : { "Content-Type": "application/json" },
		method,
	});
	const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: { message?: string } };
	if (!response.ok) throw new Error(payload.error?.message ?? "Request failed.");
	return payload.data as T;
}

const card = "rounded-card border border-surface-line bg-surface-card p-5 shadow-card";
const input =
	"h-10 w-full min-w-0 rounded-base border border-surface-line bg-surface-body px-3 text-[14px] text-ink-900 focus:border-brand-600";
const button =
	"inline-flex h-9 items-center justify-center gap-2 rounded-base px-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${button} bg-brand-600 text-white hover:bg-brand-700`;
const ghost = `${button} border border-surface-line text-ink-700 hover:bg-surface-muted`;
const dangerButton = `${button} border border-danger-100 bg-danger-50 text-danger-500 hover:bg-danger-100`;
const th = "whitespace-nowrap px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-ink-400";
const td = "px-4 py-3 align-middle text-[14px] text-ink-700";

function StoreStatus({ payoutsBlocked, status }: { payoutsBlocked?: boolean; status: string }) {
	return (
		<span className="inline-flex flex-wrap gap-1">
			<span
				className={cn(
					"rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
					status === "active" ? "bg-success-50 text-success-600" : status === "unpaid" ? "bg-warning-50 text-warning-600" : "bg-danger-50 text-danger-500",
				)}
				title={status === "unpaid" ? "Offline until the seller's Whop plan is active" : undefined}
			>
				{status === "active" ? "Active" : status === "unpaid" ? "No plan" : "Suspended"}
			</span>
			{payoutsBlocked ? (
				<span className="rounded-full bg-warning-50 px-2.5 py-0.5 text-[12px] font-semibold text-warning-600">Payouts held</span>
			) : null}
		</span>
	);
}

function storefrontUrl(handle: string) {
	return `/store/${handle}`;
}

/* ------------------------------------------------------------------------
 * Stores list + overview + settings
 * --------------------------------------------------------------------- */

type ResellersData = {
	overview: {
		activeStores: number;
		gmv30d: number;
		openPayouts: number;
		openPayoutsAmount: number;
		owed: number;
		suspendedStores: number;
		totalStores: number;
	};
	settings: Settings;
	stores: StoreRow[];
};

export function ResellersPanel() {
	const { data, error, hasData, lastEventAt, loading, refresh } = useRealtimeResource<ResellersData | null>({
		endpoint: "/api/admin/resellers",
		fallbackData: null,
		topics: ["resellers", "orders"],
	});
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "active" | "suspended" | "unpaid">("all");

	const stores = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return (data?.stores ?? []).filter(
			(store) =>
				(filter === "all" || store.status === filter) &&
				(!needle ||
					[store.name, store.handle, store.customerName, store.customerEmail].some((value) => value.toLowerCase().includes(needle))),
		);
	}, [data?.stores, filter, query]);

	return (
		<DataBoundary count={6} error={error} label="Loading reseller stores" layout="table" loading={loading} onRetry={refresh} ready={hasData && Boolean(data)}>
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			{data ? (
				<div className="space-y-6">
					<div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
						<StatCard accentBorder="border-brand-500" badge={`${data.overview.totalStores} total`} badgeClass="bg-brand-50 text-brand-600" icon="store" iconClass="bg-brand-50 text-brand-600" label="Active stores" value={data.overview.activeStores.toLocaleString("en-US")} />
						<StatCard accentBorder="border-success-500" badge="30 days" badgeClass="bg-success-50 text-success-600" icon="bar-chart-3" iconClass="bg-success-50 text-success-600" label="Reseller sales" value={money(data.overview.gmv30d)} />
						<StatCard accentBorder="border-warning-500" badge="Liability" badgeClass="bg-warning-50 text-warning-600" icon="dollar-sign" iconClass="bg-warning-50 text-warning-600" label="Owed to resellers" value={money(data.overview.owed)} />
						<Link className="block" href={routes.resellerPayouts}>
							<StatCard
								accentBorder="border-danger-500"
								badge={data.overview.openPayouts ? money(data.overview.openPayoutsAmount) : "All clear"}
								badgeClass="bg-danger-50 text-danger-500"
								icon="receipt"
								iconClass="bg-danger-50 text-danger-500"
								label="Payout requests"
								value={data.overview.openPayouts.toLocaleString("en-US")}
							/>
						</Link>
					</div>

					<ResellerSettingsCard onSaved={refresh} settings={data.settings} />

					<section className={card}>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<h2 className="text-[16px] font-semibold text-ink-900">Stores</h2>
							<div className="flex w-full flex-wrap gap-2 sm:w-auto">
								<input aria-label="Search stores" className={cn(input, "sm:w-64")} onChange={(event) => setQuery(event.target.value)} placeholder="Search store, link or owner" type="search" value={query} />
								<div className="flex rounded-base border border-surface-line p-0.5" role="group">
									{(["all", "active", "unpaid", "suspended"] as const).map((option) => (
										<button
											aria-pressed={filter === option}
											className={cn("h-8 rounded-[6px] px-3 text-[13px] font-semibold capitalize", filter === option ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-900")}
											key={option}
											onClick={() => setFilter(option)}
											type="button"
										>
											{option}
										</button>
									))}
								</div>
							</div>
						</div>
						{stores.length ? (
							<div className="dashboard-scrollbar overflow-x-auto rounded-base border border-surface-line">
								<table className="w-full min-w-[640px]">
									<thead className="border-b border-surface-line bg-surface-muted">
										<tr>
											<th className={th}>Store &amp; owner</th>
											<th className={cn(th, "text-right")}>Products</th>
											<th className={cn(th, "text-right")}>Orders</th>
											<th className={cn(th, "text-right")}>Sales</th>
											<th className={cn(th, "text-right")}>To withdraw</th>
											<th className={th}><span className="sr-only">Actions</span></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-surface-line">
										{stores.map((store) => (
											<tr className="hover:bg-surface-muted/50" key={store.id}>
												{/* w-full + max-w-0: this column takes the leftover width and its text truncates, so the table fits without sideways scrolling. */}
												<td className={cn(td, "w-full max-w-0")}>
													<div className="flex min-w-0 items-center gap-3">
														<span aria-hidden="true" className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-base text-[13px] font-bold text-white" style={{ background: store.accentColor }}>
															{store.logoUrl ? <Image alt="" className="object-cover" fill sizes="72px" src={store.logoUrl} /> : store.name.slice(0, 1).toUpperCase()}
														</span>
														<div className="min-w-0 flex-1">
															<div className="flex flex-wrap items-center gap-2">
																<Link className="whitespace-nowrap font-semibold text-ink-900 hover:text-brand-600" href={routes.resellerStore(store.id)}>{store.name}</Link>
																<StoreStatus payoutsBlocked={store.payoutsBlocked} status={store.status} />
															</div>
															<p className="m-0 mt-0.5 truncate text-[12px] leading-snug text-ink-400" title={`${store.customerName} · ${store.customerEmail}`}>
																{store.customerName} · {store.customerEmail}
															</p>
															<p className="m-0 truncate text-[12px] leading-snug text-ink-400">/store/{store.handle} · since {when(store.createdAt)}</p>
														</div>
													</div>
												</td>
												<td className={cn(td, "whitespace-nowrap px-3 text-right tabular-nums")}>{store.listings}</td>
												<td className={cn(td, "whitespace-nowrap px-3 text-right tabular-nums")}>{store.orders}</td>
												<td className={cn(td, "whitespace-nowrap px-3 text-right tabular-nums")}>
													{money(store.sales)}
													<p className="m-0 whitespace-nowrap text-[12px] text-ink-400">earned {money(store.earned)}</p>
												</td>
												<td className={cn(td, "whitespace-nowrap px-3 text-right font-semibold tabular-nums")}>{money(store.withdrawable)}</td>
												<td className={cn(td, "w-12 px-2 text-right")}>
													<Link aria-label={`Manage ${store.name}`} className={cn(ghost, "w-9 px-0")} href={routes.resellerStore(store.id)} title="Manage store">
														<Icon className="h-4 w-4" name="chevron-right" />
													</Link>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="py-10 text-center text-[14px] text-ink-400">
								{data.stores.length ? "No stores match your filters." : "No reseller stores yet. Customers can open one from /sell."}
							</p>
						)}
					</section>
				</div>
			) : null}
		</DataBoundary>
	);
}

function ResellerSettingsCard({ onSaved, settings }: { onSaved: () => Promise<void> | void; settings: Settings }) {
	const [open, setOpen] = useState(false);
	const [values, setValues] = useState(settings);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

	const field = (key: Exclude<keyof Settings, "advertisedProducts" | "signupsOpen" | "subscriptionsRequired">, label: string, help: string, suffix: string) => (
		<label className="block">
			<span className="text-[13px] font-semibold text-ink-700">{label}</span>
			<div className="mt-1.5 flex">
				<input
					className={cn(input, "rounded-r-none")}
					inputMode="decimal"
					min={0}
					onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
					type="number"
					value={values[key]}
				/>
				<span className="inline-flex items-center rounded-r-base border border-l-0 border-surface-line bg-surface-muted px-3 text-[13px] text-ink-500">{suffix}</span>
			</div>
			<p className="mt-1 text-[12px] text-ink-400">{help}</p>
		</label>
	);

	return (
		<section className={card}>
			<button aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((value) => !value)} type="button">
				<span>
					<span className="block text-[16px] font-semibold text-ink-900">Marketplace rules</span>
					<span className="block text-[13px] text-ink-400">
						Max margin {settings.maxMarginPercent}% · fee {settings.platformFeePercent}% · {settings.holdDays}-day hold · min payout {money(settings.minPayout)} · sign-ups {settings.signupsOpen ? "open" : "paused"} · subscriptions {settings.subscriptionsRequired ? "required" : "off"}
					</span>
				</span>
				<Icon className={cn("h-4 w-4 shrink-0 text-ink-400 transition-transform", open && "rotate-180")} name="chevron-down" />
			</button>
			{open ? (
				<form
					className="mt-5 space-y-4"
					onSubmit={async (event) => {
						event.preventDefault();
						setSaving(true);
						setMessage(null);
						try {
							await adminSend("PUT", "/api/admin/resellers/settings", values);
							setMessage({ error: false, text: "Saved. New rules apply immediately to prices and payouts." });
							await onSaved();
						} catch (caught) {
							setMessage({ error: true, text: (caught as Error).message });
						} finally {
							setSaving(false);
						}
					}}
				>
					<div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
						{field("maxMarginPercent", "Max reseller margin", "Caps every listing's margin, including existing ones.", "%")}
						{field("platformFeePercent", "Platform fee", "Share of each margin Avokarto keeps.", "%")}
						{field("holdDays", "Earnings hold", "Days after delivery before earnings unlock (return window).", "days")}
						{field("minPayout", "Minimum payout", "Smallest amount a reseller can withdraw.", "USD")}
					</div>
					<label className="block max-w-sm">
						<span className="text-[13px] font-semibold text-ink-700">Advertised product count</span>
						<div className="mt-1.5 flex">
							<input
								className={cn(input, "rounded-r-none")}
								inputMode="numeric"
								min={1}
								onChange={(event) => setValues((current) => ({ ...current, advertisedProducts: event.target.value === "" ? null : Number(event.target.value) }))}
								placeholder="Live count"
								step={1}
								type="number"
								value={values.advertisedProducts ?? ""}
							/>
							<span className="inline-flex items-center rounded-r-base border border-l-0 border-surface-line bg-surface-muted px-3 text-[13px] text-ink-500">products+</span>
						</div>
						<p className="mt-1 text-[12px] text-ink-400">Shown on the /sell homepage as &ldquo;500+ winning products&rdquo;. Leave blank to show the live published count.</p>
					</label>
					<label className="inline-flex cursor-pointer items-center gap-2">
						<input checked={values.signupsOpen} className="h-4 w-4 accent-brand-600" onChange={(event) => setValues((current) => ({ ...current, signupsOpen: event.target.checked }))} type="checkbox" />
						<span className="text-[14px] text-ink-700">Allow new stores to open</span>
					</label>
					<div className="rounded-base border border-surface-line bg-surface-muted px-3 py-2.5">
						<label className="inline-flex cursor-pointer items-center gap-2">
							<input checked={values.subscriptionsRequired} className="h-4 w-4 accent-brand-600" onChange={(event) => setValues((current) => ({ ...current, subscriptionsRequired: event.target.checked }))} type="checkbox" />
							<span className="text-[14px] font-semibold text-ink-700">Require a subscription (Whop)</span>
						</label>
						<p className="mt-1 text-[12px] text-ink-500">
							When on, a store is live only while its seller has a Starter, Pro or Scale plan (trial included); stores without one go offline straight away. Starter is capped at 25 products and can&apos;t connect a domain. Configure the WHOP_* settings and the webhook before switching on.
						</p>
					</div>
					{message ? (
						<p className={cn("rounded-base px-3 py-2 text-[13px]", message.error ? "bg-danger-50 text-danger-500" : "bg-success-50 text-success-600")} role={message.error ? "alert" : "status"}>{message.text}</p>
					) : null}
					<button className={primary} disabled={saving} type="submit">
						<Icon className="h-4 w-4" name={saving ? "loader" : "save"} /> Save rules
					</button>
				</form>
			) : null}
		</section>
	);
}

/* ------------------------------------------------------------------------
 * Store detail
 * --------------------------------------------------------------------- */

type StoreDetail = {
	customDomain: { domain: string; lastError: string; status: "active" | "failed" | "pending"; verifiedAt: string | null } | null;
	balances: { available: number; lifetime: number; paid: number; pending: number; requested: number; withdrawable: number };
	customer: { email: string; name: string; phone: string };
	listings: {
		basePrice: number;
		id: string;
		imageUrl: string;
		isActive: boolean;
		net: number;
		productName: string;
		productSlug: string;
		purchasable: boolean;
		salePrice: number;
	}[];
	orders: { createdAt: string; earning: number; earningStatus: string; orderNumber: string; orderStatus: string; sales: number }[];
	payouts: { amount: number; id: string; processedAt: string | null; reference: string; requestedAt: string; status: string }[];
	store: {
		about: string;
		accentColor: string;
		announcement: string;
		bannerUrl: string;
		createdAt: string;
		defaultMarginPercent: number;
		logoUrl: string;
		theme: string;
		handle: string;
		id: string;
		name: string;
		payoutDetails: PayoutDetails;
		payoutsBlocked: boolean;
		status: "active" | "suspended" | "unpaid";
		suspendedReason: string;
		tagline: string;
		whatsapp: string;
	};
};

export function ResellerStoreDetail({ storeId }: { storeId: string }) {
	const { data, error, hasData, lastEventAt, loading, refresh } = useRealtimeResource<StoreDetail | null>({
		endpoint: `/api/admin/resellers/${storeId}`,
		fallbackData: null,
		topics: ["resellers", "orders"],
	});
	const [reason, setReason] = useState("");
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	async function moderate(body: Record<string, unknown>) {
		setBusy(true);
		setActionError(null);
		try {
			await adminSend("PATCH", `/api/admin/resellers/${storeId}`, body);
			setReason("");
			await refresh();
		} catch (caught) {
			setActionError((caught as Error).message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<DataBoundary count={4} error={error} label="Loading store" layout="table" loading={loading} onRetry={refresh} ready={hasData && Boolean(data)}>
			<LiveDataStatus error={error} lastEventAt={lastEventAt} />
			{data ? (
				<div className="space-y-6">
					<section className={cn(card, "flex flex-wrap items-start justify-between gap-4")}>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="text-[20px] font-semibold text-ink-900">{data.store.name}</h2>
								<StoreStatus payoutsBlocked={data.store.payoutsBlocked} status={data.store.status} />
							</div>
							<p className="mt-1 text-[13px] text-ink-400">
								<a className="text-brand-600 hover:underline" href={storefrontUrl(data.store.handle)} rel="noopener" target="_blank">/store/{data.store.handle}</a>
								{" · "}opened {when(data.store.createdAt)} · default margin {data.store.defaultMarginPercent}%
							</p>
							{data.store.tagline ? <p className="mt-2 text-[14px] text-ink-600">{data.store.tagline}</p> : null}
							<p className="mt-3 text-[13px] text-ink-500">
								Owner: <strong className="text-ink-900">{data.customer.name}</strong> · {data.customer.email}
								{data.customer.phone ? ` · ${data.customer.phone}` : ""}
								{data.store.whatsapp ? ` · WhatsApp ${data.store.whatsapp}` : ""}
							</p>
							{data.customDomain ? (
								<div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
									<Icon className="h-4 w-4 text-ink-400" name="globe" />
									<a className="font-semibold text-brand-600 hover:underline" href={`https://${data.customDomain.domain}`} rel="noopener noreferrer" target="_blank">
										{data.customDomain.domain}
									</a>
									<span
										className={cn(
											"rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
											data.customDomain.status === "active"
												? "bg-success-50 text-success-600"
												: data.customDomain.status === "failed"
													? "bg-danger-50 text-danger-500"
													: "bg-warning-50 text-warning-600",
										)}
									>
										{data.customDomain.status === "active" ? "Live" : data.customDomain.status === "failed" ? "DNS broken" : "Awaiting DNS"}
									</span>
									<button
										className="text-[12px] font-semibold text-danger-500 hover:underline disabled:opacity-50"
										disabled={busy}
										onClick={() => {
											if (window.confirm(`Disconnect ${data.customDomain?.domain} from this store?`)) void moderate({ removeDomain: true });
										}}
										type="button"
									>
										Disconnect
									</button>
									{data.customDomain.lastError ? <span className="w-full text-[12px] text-ink-400">{data.customDomain.lastError}</span> : null}
								</div>
							) : null}
							{data.store.status === "suspended" && data.store.suspendedReason ? (
								<p className="mt-3 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">Suspended: {data.store.suspendedReason}</p>
							) : null}
						</div>
						<div className="w-full space-y-2 sm:w-80">
							{data.store.status !== "suspended" ? (
								<>
									<input aria-label="Suspension reason" className={input} maxLength={300} onChange={(event) => setReason(event.target.value)} placeholder="Reason for suspension (seller sees this)" value={reason} />
									<button className={cn(dangerButton, "w-full")} disabled={busy || reason.trim().length < 3} onClick={() => void moderate({ reason, status: "suspended" })} type="button">
										<Icon className="h-4 w-4" name="shield" /> Suspend store
									</button>
								</>
							) : (
								<button className={cn(primary, "w-full")} disabled={busy} onClick={() => void moderate({ status: "active" })} type="button">
									<Icon className="h-4 w-4" name="shield-check" /> Reactivate store
								</button>
							)}
							<button className={cn(ghost, "w-full")} disabled={busy} onClick={() => void moderate({ payoutsBlocked: !data.store.payoutsBlocked })} type="button">
								{data.store.payoutsBlocked ? "Release payout hold" : "Hold payouts"}
							</button>
							{actionError ? <p className="text-[13px] font-semibold text-danger-500" role="alert">{actionError}</p> : null}
						</div>
					</section>

					<section className={card}>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 className="text-[16px] font-semibold text-ink-900">Store branding</h3>
								<p className="text-[13px] text-ink-400">What shoppers see on the store website · theme: <span className="capitalize">{data.store.theme}</span></p>
							</div>
							<button
								className={dangerButton}
								disabled={busy || !(data.store.logoUrl || data.store.bannerUrl || data.store.about || data.store.announcement)}
								onClick={() => {
									if (window.confirm("Remove this store's logo, banner, about text and announcement? Use this for inappropriate content.")) {
										void moderate({ clearBranding: true });
									}
								}}
								type="button"
							>
								<Icon className="h-4 w-4" name="trash-2" /> Remove branding
							</button>
						</div>
						<div className="relative overflow-hidden rounded-base text-white" style={{ background: data.store.accentColor, minHeight: 150 }}>
							{data.store.bannerUrl ? <Image alt="Store banner" className="object-cover" fill sizes="900px" src={data.store.bannerUrl} /> : null}
							<div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10" />
							<div className="relative flex items-center gap-3 p-5">
								<span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-base border-2 border-white/80 bg-white/10 text-[18px] font-bold">
									{data.store.logoUrl ? <Image alt="Store logo" className="object-cover" fill sizes="112px" src={data.store.logoUrl} /> : data.store.name.slice(0, 1).toUpperCase()}
								</span>
								<div className="min-w-0">
									<p className="m-0 text-[20px] font-bold">{data.store.name}</p>
									{data.store.announcement ? <p className="m-0 text-[13px] text-white/85">Announcement: {data.store.announcement}</p> : null}
								</div>
							</div>
						</div>
						{data.store.about ? <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-ink-600">{data.store.about}</p> : null}
					</section>

					<div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
						<StatCard accentBorder="border-brand-500" badge="Ready" badgeClass="bg-brand-50 text-brand-600" icon="dollar-sign" iconClass="bg-brand-50 text-brand-600" label="Withdrawable" value={money(data.balances.withdrawable)} />
						<StatCard accentBorder="border-warning-500" badge="Pending" badgeClass="bg-warning-50 text-warning-600" icon="history" iconClass="bg-warning-50 text-warning-600" label="Not yet unlocked" value={money(data.balances.pending)} />
						<StatCard accentBorder="border-success-500" badge="Lifetime" badgeClass="bg-success-50 text-success-600" icon="bar-chart-3" iconClass="bg-success-50 text-success-600" label="Earned" value={money(data.balances.lifetime)} />
						<StatCard accentBorder="border-ink-300" badge="Paid" badgeClass="bg-surface-muted text-ink-500" icon="receipt" iconClass="bg-surface-muted text-ink-500" label="Paid out" value={money(data.balances.paid)} />
					</div>

					<div className="grid gap-6 2xl:grid-cols-2">
						<section className={card}>
							<h3 className="mb-4 text-[16px] font-semibold text-ink-900">Orders ({data.orders.length})</h3>
							{data.orders.length ? (
								<div className="dashboard-scrollbar overflow-x-auto">
									<table className="w-full min-w-[440px]">
										<thead><tr className="border-b border-surface-line"><th className={th}>Order</th><th className={th}>Status</th><th className={cn(th, "text-right")}>Sales</th><th className={cn(th, "text-right")}>Earning</th></tr></thead>
										<tbody className="divide-y divide-surface-line">
											{data.orders.map((order) => (
												<tr key={order.orderNumber}>
													<td className={td}>
														<Link className="font-semibold text-brand-600 hover:underline" href={routes.orderDetail(order.orderNumber)}>{order.orderNumber}</Link>
														<p className="text-[12px] text-ink-400">{when(order.createdAt)}</p>
													</td>
													<td className={cn(td, "capitalize")}>{order.orderStatus}</td>
													<td className={cn(td, "text-right tabular-nums")}>{money(order.sales)}</td>
													<td className={cn(td, "text-right tabular-nums")}>
														{money(order.earning)}
														<p className="text-[12px] capitalize text-ink-400">{order.earningStatus}</p>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<p className="text-[14px] text-ink-400">No orders through this store yet.</p>
							)}
						</section>

						<section className={card}>
							<h3 className="mb-1 text-[16px] font-semibold text-ink-900">Payouts</h3>
							<p className="mb-4 text-[13px] text-ink-400">
								{data.store.payoutDetails.method === "upi"
									? `UPI ${data.store.payoutDetails.upiId} · ${data.store.payoutDetails.accountName}`
									: data.store.payoutDetails.method === "bank"
										? `${data.store.payoutDetails.bankName} ${data.store.payoutDetails.accountNumber} · IFSC ${data.store.payoutDetails.ifsc} · ${data.store.payoutDetails.accountName}`
										: "No payout details yet."}
							</p>
							{data.payouts.length ? (
								<ul className="divide-y divide-surface-line">
									{data.payouts.map((payout) => (
										<li className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]" key={payout.id}>
											<span className="font-semibold text-ink-900">{money(payout.amount)}</span>
											<span className="text-[12px] text-ink-400">
												{when(payout.requestedAt)}{payout.reference ? ` · Ref ${payout.reference}` : ""}
											</span>
											<span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize", payout.status === "paid" ? "bg-success-50 text-success-600" : payout.status === "rejected" ? "bg-danger-50 text-danger-500" : "bg-warning-50 text-warning-600")}>
												{payout.status}
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-[14px] text-ink-400">No payout requests yet.</p>
							)}
							<Link className={cn(ghost, "mt-4")} href={routes.resellerPayouts}>Open payout queue</Link>
						</section>
					</div>

					<section className={card}>
						<h3 className="mb-4 text-[16px] font-semibold text-ink-900">Products ({data.listings.length})</h3>
						{data.listings.length ? (
							<div className="dashboard-scrollbar overflow-x-auto">
								<table className="w-full min-w-[640px]">
									<thead><tr className="border-b border-surface-line"><th className={th}>Product</th><th className={cn(th, "text-right")}>Avokarto price</th><th className={cn(th, "text-right")}>Store price</th><th className={cn(th, "text-right")}>Reseller earns</th><th className={th}>Visibility</th></tr></thead>
									<tbody className="divide-y divide-surface-line">
										{data.listings.map((listing) => (
											<tr key={listing.id}>
												<td className={td}>
													<div className="flex items-center gap-3">
														{/* eslint-disable-next-line @next/next/no-img-element -- catalog thumbnail */}
														<img alt="" className="h-10 w-10 rounded-base object-cover" src={listing.imageUrl} />
														<a className="font-medium text-ink-900 hover:text-brand-600" href={`${storefrontUrl(data.store.handle)}/${listing.productSlug}`} rel="noopener" target="_blank">{listing.productName}</a>
													</div>
												</td>
												<td className={cn(td, "text-right tabular-nums")}>{money(listing.basePrice)}</td>
												<td className={cn(td, "text-right font-semibold tabular-nums")}>{money(listing.salePrice)}</td>
												<td className={cn(td, "text-right tabular-nums text-success-600")}>{money(listing.net)}</td>
												<td className={td}>{listing.isActive ? (listing.purchasable ? "Live" : "Out of stock") : "Hidden"}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-[14px] text-ink-400">This store hasn&apos;t added products yet.</p>
						)}
					</section>
				</div>
			) : null}
		</DataBoundary>
	);
}

/* ------------------------------------------------------------------------
 * Payout queue
 * --------------------------------------------------------------------- */

type AdminPayout = {
	adminNote: string;
	amount: number;
	id: string;
	payoutDetails: PayoutDetails;
	processedAt: string | null;
	reference: string;
	requestedAt: string;
	status: "paid" | "rejected" | "requested";
	store: { handle: string; id: string; name: string };
};

export function ResellerPayoutsPanel() {
	const [status, setStatus] = useState<"" | "paid" | "rejected" | "requested">("requested");
	const { data, error, hasData, lastEventAt, loading, refresh } = useRealtimeResource<AdminPayout[]>({
		endpoint: `/api/admin/resellers/payouts${status ? `?status=${status}` : ""}`,
		fallbackData: [],
		topics: ["resellers"],
	});

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap gap-2" role="group">
				{([
					["requested", "To pay"],
					["paid", "Paid"],
					["rejected", "Declined"],
					["", "All"],
				] as const).map(([value, label]) => (
					<button
						aria-pressed={status === value}
						className={cn(button, status === value ? "bg-brand-600 text-white" : "border border-surface-line text-ink-600 hover:bg-surface-muted")}
						key={label}
						onClick={() => setStatus(value)}
						type="button"
					>
						{label}
					</button>
				))}
			</div>
			<DataBoundary count={4} error={error} label="Loading payouts" layout="table" loading={loading} onRetry={refresh} ready={hasData}>
				<LiveDataStatus error={error} lastEventAt={lastEventAt} />
				{data.length ? (
					<div className="grid gap-4 2xl:grid-cols-2">
						{data.map((payout) => <PayoutCard key={payout.id} onDone={refresh} payout={payout} />)}
					</div>
				) : (
					<div className={cn(card, "py-12 text-center text-[14px] text-ink-400")}>
						{status === "requested" ? "No payout requests waiting. 🎉" : "Nothing here yet."}
					</div>
				)}
			</DataBoundary>
		</div>
	);
}

function CopyValue({ label, value }: { label: string; value?: string }) {
	const [copied, setCopied] = useState(false);
	if (!value) return null;
	return (
		<div className="flex items-center justify-between gap-2 rounded-base bg-surface-muted px-3 py-2">
			<div className="min-w-0">
				<p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
				{/* Never truncated: this is what gets typed into a bank transfer. */}
				<p className="m-0 break-all font-mono text-[14px] text-ink-900">{value}</p>
			</div>
			<button
				aria-label={`Copy ${label}`}
				className="shrink-0 rounded-base px-2 py-1 text-[12px] font-semibold text-brand-600 hover:bg-brand-50"
				onClick={async () => {
					await navigator.clipboard?.writeText(value);
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1500);
				}}
				type="button"
			>
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}

function PayoutCard({ onDone, payout }: { onDone: () => Promise<void> | void; payout: AdminPayout }) {
	const [mode, setMode] = useState<"paid" | "rejected" | null>(null);
	const [reference, setReference] = useState("");
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const details = payout.payoutDetails;

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			await adminSend("POST", `/api/admin/resellers/payouts/${payout.id}`, mode === "paid" ? { action: "paid", note, reference } : { action: "rejected", note });
			await onDone();
		} catch (caught) {
			setError((caught as Error).message);
			setBusy(false);
		}
	}

	return (
		<article className={card}>
			<div className="mb-3 flex flex-wrap items-start justify-between gap-2">
				<div>
					<p className="text-[24px] font-semibold text-ink-900">{money(payout.amount)}</p>
					<p className="text-[13px] text-ink-400">
						<Link className="font-semibold text-brand-600 hover:underline" href={routes.resellerStore(payout.store.id)}>{payout.store.name}</Link>
						{" · requested "}{when(payout.requestedAt)}
					</p>
				</div>
				<span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-semibold", payout.status === "paid" ? "bg-success-50 text-success-600" : payout.status === "rejected" ? "bg-danger-50 text-danger-500" : "bg-warning-50 text-warning-600")}>
					{payout.status === "requested" ? "To pay" : payout.status === "paid" ? "Paid" : "Declined"}
				</span>
			</div>
			<div className="grid gap-2 md:grid-cols-2">
				<CopyValue label="Account name" value={details.accountName} />
				{details.method === "upi" ? (
					<CopyValue label="UPI ID" value={details.upiId} />
				) : (
					<>
						<CopyValue label="Account number" value={details.accountNumber} />
						<CopyValue label="IFSC" value={details.ifsc} />
						<CopyValue label="Bank" value={details.bankName} />
					</>
				)}
			</div>
			{payout.status !== "requested" ? (
				<p className="mt-3 text-[13px] text-ink-500">
					{payout.status === "paid" ? `Paid ${when(payout.processedAt)} · Ref ${payout.reference}` : `Declined ${when(payout.processedAt)}`}
					{payout.adminNote ? ` · ${payout.adminNote}` : ""}
				</p>
			) : mode ? (
				<form className="mt-4 space-y-3" onSubmit={submit}>
					{mode === "paid" ? (
						<input aria-label="Transfer reference" autoFocus className={input} onChange={(event) => setReference(event.target.value)} placeholder="Transfer reference (UTR / transaction ID)" required value={reference} />
					) : null}
					<input aria-label="Note to seller" className={input} onChange={(event) => setNote(event.target.value)} placeholder={mode === "paid" ? "Note (optional)" : "Why is this declined? The seller sees this."} required={mode === "rejected"} value={note} />
					{error ? <p className="text-[13px] font-semibold text-danger-500" role="alert">{error}</p> : null}
					<div className="flex flex-wrap gap-2">
						<button className={mode === "paid" ? primary : dangerButton} disabled={busy} type="submit">
							{mode === "paid" ? "Confirm paid" : "Decline payout"}
						</button>
						<button className={ghost} disabled={busy} onClick={() => setMode(null)} type="button">Cancel</button>
					</div>
				</form>
			) : (
				<div className="mt-4 flex flex-wrap gap-2">
					<button className={primary} onClick={() => setMode("paid")} type="button"><Icon className="h-4 w-4" name="check" /> Mark as paid</button>
					<button className={dangerButton} onClick={() => setMode("rejected")} type="button">Decline</button>
				</div>
			)}
		</article>
	);
}
