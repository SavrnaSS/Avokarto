"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { routes } from "@/admin/config/routes";
import { cn } from "@/admin/utils/cn";
import type { AdminAccount } from "@/lib/backend/admin-data";
import type { StoreSettingsPolicy } from "@/lib/backend/store-policy";
import { PAYMENT_METHODS, type PaymentMethodKey } from "@/lib/storePolicy";

/* Admin -> Settings -> Shipping / Payments / Permissions. Every control here
   changes what the storefront or the admin actually does - see
   lib/backend/store-policy.ts. */

const card = "rounded-card border border-surface-line bg-surface-card p-5 shadow-card sm:p-6";
const usd = (value: number) => new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);

type Notice = { text: string; tone: "error" | "ok" };

/** PATCH one settings section; returns the saved policy. */
function useSectionSave(section: "payments" | "permissions" | "shipping") {
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<Notice | null>(null);
	async function save(body: object) {
		setSaving(true);
		setNotice(null);
		try {
			const response = await fetch("/api/admin/store-policy", {
				body: JSON.stringify({ ...body, section }),
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				const fieldErrors = payload.error?.details?.fieldErrors as Record<string, string[]> | undefined;
				const formErrors = payload.error?.details?.formErrors as string[] | undefined;
				throw new Error((fieldErrors && Object.values(fieldErrors).flat()[0]) || formErrors?.[0] || payload.error?.message || "Couldn't save.");
			}
			setNotice({ text: "Saved - it's live now.", tone: "ok" });
			return payload.data as StoreSettingsPolicy;
		} catch (error) {
			setNotice({ text: error instanceof Error ? error.message : "Couldn't save.", tone: "error" });
			return null;
		} finally {
			setSaving(false);
		}
	}
	return { notice, save, saving };
}

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
	return (
		<>
			<input aria-label={label} checked={checked} className="peer sr-only" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
			<span
				aria-hidden="true"
				className={cn(
					"relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2",
					checked ? "bg-brand-600" : "bg-surface-muted ring-1 ring-surface-line",
				)}
			>
				<span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
			</span>
		</>
	);
}

function SaveBar({ dirty, notice, saving }: { dirty: boolean; notice: Notice | null; saving: boolean }) {
	return (
		<div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-surface-line pt-4">
			{notice ? (
				<p
					className={cn("mr-auto rounded-base px-3 py-2 text-[13px]", notice.tone === "ok" ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500")}
					role={notice.tone === "ok" ? "status" : "alert"}
				>
					{notice.text}
				</p>
			) : null}
			<button
				className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={saving || !dirty}
				type="submit"
			>
				<Icon className="h-4 w-4" name="save" />
				{saving ? "Saving..." : "Save"}
			</button>
		</div>
	);
}

function SideCard({ children, icon, link, linkLabel, title }: { children: ReactNode; icon: string; link: string; linkLabel: string; title: string }) {
	return (
		<aside className={cn(card, "self-start")}>
			<span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
				<Icon className="h-5 w-5" name={icon} />
			</span>
			<h2 className="mt-3 text-[17px] font-semibold text-ink-900">{title}</h2>
			<div className="mt-3 text-[14px]">{children}</div>
			<Link className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-600 hover:text-brand-700" href={link}>
				{linkLabel} <Icon className="h-4 w-4" name="arrow-right" />
			</Link>
		</aside>
	);
}

function Row({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-3 border-b border-surface-line py-2 last:border-b-0">
			<span className="text-ink-500">{label}</span>
			<span className="text-right font-semibold text-ink-900">{value}</span>
		</div>
	);
}

/* ---------------- Shipping ---------------- */

export type ShippingMethodSummary = { deliveryEstimate: string; id: string; name: string; price: number; status: "active" | "inactive" };

export function ShippingSettings({ initial, methods }: { initial: StoreSettingsPolicy; methods: ShippingMethodSummary[] }) {
	const [saved, setSaved] = useState(initial.freeShipping);
	const [enabled, setEnabled] = useState(initial.freeShipping.enabled);
	const [threshold, setThreshold] = useState(String(initial.freeShipping.thresholdUsd));
	const { notice, save, saving } = useSectionSave("shipping");
	const dirty = enabled !== saved.enabled || Number(threshold) !== saved.thresholdUsd;
	const active = methods.filter((method) => method.status === "active");

	async function submit(event: FormEvent) {
		event.preventDefault();
		const next = await save({ enabled, thresholdUsd: threshold });
		if (next) {
			setSaved(next.freeShipping);
			setThreshold(String(next.freeShipping.thresholdUsd));
		}
	}

	return (
		<>
			<PageHeader description="The free-shipping rule shoppers see everywhere, and the delivery methods checkout offers." eyebrow="Settings" title="Shipping" />
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
				<form className={card} onSubmit={(event) => void submit(event)}>
					<label className="flex cursor-pointer items-center gap-4">
						<span className="min-w-0 flex-1">
							<span className="block text-[18px] font-semibold text-ink-900">Free shipping</span>
							<span className="mt-1 block text-[14px] text-ink-500">
								Orders that reach the minimum (in USD, after discounts, before shipping) ship free with any delivery method.
							</span>
						</span>
						<Switch checked={enabled} label="Offer free shipping" onChange={setEnabled} />
					</label>
					<label className={cn("mt-5 block max-w-xs", !enabled && "opacity-50")}>
						<span className="text-[14px] font-medium text-ink-700">Minimum order</span>
						<span className="mt-1.5 flex items-center rounded-base border border-surface-line bg-surface-body focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
							<span className="pl-3 text-ink-400">$</span>
							<input
								className="h-11 w-full bg-transparent px-2 text-[15px] text-ink-900 outline-none"
								disabled={!enabled}
								inputMode="decimal"
								min={0}
								onChange={(event) => setThreshold(event.target.value)}
								step="0.01"
								type="number"
								value={threshold}
							/>
							<span className="pr-3 text-[13px] text-ink-400">USD</span>
						</span>
					</label>
					<p className="mt-4 rounded-base bg-surface-body px-3 py-2.5 text-[13px] text-ink-500">
						{enabled
							? `Shoppers see "Free shipping on orders of ${usd(Number(threshold) || 0).replace(/\.00$/, "")} or more" - in the header, cart, product pages and checkout.`
							: "Shoppers always pay the delivery method's price, and free-shipping messages are hidden."}
					</p>
					<SaveBar dirty={dirty} notice={notice} saving={saving} />
				</form>
				<SideCard icon="truck" link={routes.shippingMethods} linkLabel="Manage delivery methods" title="Delivery methods">
					{active.length ? (
						active.map((method) => (
							<Row key={method.id} label={method.name} value={<>{usd(method.price)} <span className="font-normal text-ink-400">· {method.deliveryEstimate}</span></>} />
						))
					) : (
						<p className="text-danger-500">No active delivery method - checkout can&apos;t take orders until one is switched on.</p>
					)}
					{methods.length > active.length ? <p className="mt-2 text-[13px] text-ink-400">{methods.length - active.length} switched off.</p> : null}
				</SideCard>
			</div>
		</>
	);
}

/* ---------------- Payments ---------------- */

export type PayoutRules = { holdDays: number; minPayout: number; platformFeePercent: number };

export function PaymentSettings({ initial, payouts }: { initial: StoreSettingsPolicy; payouts: PayoutRules }) {
	const [saved, setSaved] = useState(initial.paymentMethods);
	const [methods, setMethods] = useState<PaymentMethodKey[]>(initial.paymentMethods);
	const { notice, save, saving } = useSectionSave("payments");
	const dirty = methods.length !== saved.length || methods.some((key) => !saved.includes(key));

	async function submit(event: FormEvent) {
		event.preventDefault();
		const next = await save({ paymentMethods: methods });
		if (next) {
			setSaved(next.paymentMethods);
			setMethods(next.paymentMethods);
		}
	}

	return (
		<>
			<PageHeader description="Which payment options shoppers can pick at checkout, and how sellers get paid." eyebrow="Settings" title="Payments" />
			<p className="mb-6 flex items-start gap-3 rounded-card border border-surface-line bg-surface-card px-4 py-3 text-[14px] text-ink-500 shadow-card">
				<Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" name="circle-alert" />
				<span>
					Online payment capture isn&apos;t connected yet: an order records the method the shopper picked and starts as <strong className="text-ink-700">Unpaid</strong>. Mark it paid on the order once the money arrives.
				</span>
			</p>
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
				<form className={card} onSubmit={(event) => void submit(event)}>
					<h2 className="text-[18px] font-semibold text-ink-900">Payment methods at checkout</h2>
					<p className="mt-1 text-[14px] text-ink-500">Switched-off methods disappear from every checkout, and the server refuses them.</p>
					<ul className="mt-3 divide-y divide-surface-line">
						{PAYMENT_METHODS.map((method) => {
							const on = methods.includes(method.key);
							return (
								<li key={method.key}>
									<label className="flex cursor-pointer items-center gap-4 py-4">
										<span className="min-w-0 flex-1">
											<span className="block text-[14px] font-semibold text-ink-900">{method.label}</span>
											<span className="mt-0.5 block text-[13px] text-ink-500">{method.note}</span>
										</span>
										<Switch
											checked={on}
											label={method.label}
											onChange={(value) => setMethods((current) => (value ? [...current, method.key] : current.filter((key) => key !== method.key)))}
										/>
									</label>
								</li>
							);
						})}
					</ul>
					{methods.length === 0 ? <p className="text-[13px] text-danger-500">Keep at least one method on.</p> : null}
					<SaveBar dirty={dirty && methods.length > 0} notice={notice} saving={saving} />
				</form>
				<SideCard icon="dollar-sign" link={routes.resellers} linkLabel="Edit payout rules" title="Seller payouts">
					<Row label="Avokarto's fee" value={`${payouts.platformFeePercent}% of margin`} />
					<Row label="Earnings held for" value={`${payouts.holdDays} days`} />
					<Row label="Minimum payout" value={usd(payouts.minPayout)} />
					<p className="mt-3 text-[13px] text-ink-400">Sellers request payouts to their bank; you approve them in Resellers → Payouts.</p>
				</SideCard>
			</div>
		</>
	);
}

/* ---------------- Permissions ---------------- */

export type SellerAccess = { signupsOpen: boolean; subscriptionsRequired: boolean };

export function PermissionSettings({ accounts, initial, sellerAccess }: { accounts: AdminAccount[]; initial: StoreSettingsPolicy; sellerAccess: SellerAccess }) {
	const [saved, setSaved] = useState(initial.adminSessionDays);
	const [days, setDays] = useState(String(initial.adminSessionDays));
	const { notice, save, saving } = useSectionSave("permissions");
	const dirty = Number(days) !== saved;

	async function submit(event: FormEvent) {
		event.preventDefault();
		const next = await save({ adminSessionDays: days });
		if (next) {
			setSaved(next.adminSessionDays);
			setDays(String(next.adminSessionDays));
		}
	}

	return (
		<>
			<PageHeader description="Who can reach the admin, how long a sign-in lasts, and who can open a seller store." eyebrow="Settings" title="Permissions" />
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
				<div className="grid min-w-0 content-start gap-6">
					<form className={card} onSubmit={(event) => void submit(event)}>
						<h2 className="text-[18px] font-semibold text-ink-900">Admin sign-in</h2>
						<p className="mt-1 text-[14px] text-ink-500">How long an admin stays signed in before signing in again. Applies from each admin&apos;s next sign-in.</p>
						<label className="mt-4 block max-w-xs">
							<span className="text-[14px] font-medium text-ink-700">Session length</span>
							<span className="mt-1.5 flex items-center rounded-base border border-surface-line bg-surface-body focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
								<input
									className="h-11 w-full bg-transparent px-3 text-[15px] text-ink-900 outline-none"
									max={30}
									min={1}
									onChange={(event) => setDays(event.target.value)}
									step={1}
									type="number"
									value={days}
								/>
								<span className="pr-3 text-[13px] text-ink-400">days</span>
							</span>
							<span className="mt-1.5 block text-[12px] text-ink-400">1 to 30. Shorter is safer on shared computers.</span>
						</label>
						<SaveBar dirty={dirty} notice={notice} saving={saving} />
					</form>
					<section className={card}>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h2 className="text-[18px] font-semibold text-ink-900">Admin accounts</h2>
							<Link className="text-[14px] font-semibold text-brand-600 hover:text-brand-700" href={routes.users}>
								Manage users
							</Link>
						</div>
						<p className="mt-1 text-[14px] text-ink-500">Only active accounts with the Admin role can sign in to this console.</p>
						<ul className="mt-3 divide-y divide-surface-line">
							{accounts.map((account) => (
								<li className="flex items-center gap-3 py-3" key={account.email}>
									<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-semibold uppercase text-brand-600">
										{(account.name || account.email).slice(0, 1)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[14px] font-medium text-ink-900">{account.name || account.email}</span>
										<span className="block truncate text-[12px] text-ink-400">{account.email}</span>
									</span>
									<span className="rounded-full bg-surface-muted px-2 py-0.5 text-[12px] font-medium capitalize text-ink-600">{account.role}</span>
									<span
										className={cn(
											"rounded-full px-2 py-0.5 text-[12px] font-semibold",
											account.canSignIn ? "bg-success-50 text-success-600" : "bg-surface-muted text-ink-500",
										)}
									>
										{account.canSignIn ? "Can sign in" : "No access"}
									</span>
								</li>
							))}
						</ul>
					</section>
				</div>
				<SideCard icon="store" link={routes.resellers} linkLabel="Change seller rules" title="Seller access">
					<Row label="New stores" value={sellerAccess.signupsOpen ? "Open" : "Paused"} />
					<Row label="Subscription required" value={sellerAccess.subscriptionsRequired ? "Yes" : "No"} />
					<p className="mt-3 text-[13px] text-ink-400">Sellers sign in with their own accounts and only ever see their own store.</p>
				</SideCard>
			</div>
		</>
	);
}
