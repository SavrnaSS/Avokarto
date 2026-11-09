"use client";

import Link from "next/link";
import {
	Field,
	FormCard,
	SelectField,
} from "@/admin/components/forms/admin-form-primitives";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import type { AdminStoreSettings } from "@/lib/backend/admin-data";

export function TaxPage() {
	const rows = [
		[
			"Bangladesh",
			"Standard",
			"15%",
			"Active",
			"bg-success-50 text-success-600",
		],
		[
			"United States",
			"State tax",
			"8.25%",
			"Active",
			"bg-success-50 text-success-600",
		],
		[
			"Digital Goods",
			"Reduced",
			"5%",
			"Draft",
			"bg-surface-muted text-ink-600",
		],
	];

	return (
		<>
			<PageHeader
				actions={
					<button
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						type="button"
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Tax Rate
					</button>
				}
				description="Configure tax classes, rates, and taxable regions."
				eyebrow="Finance"
				title="Tax"
			/>
			<section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
				<FormCard title="Tax Rates">
					<div className="dashboard-scrollbar overflow-x-auto">
						<table className="w-full min-w-[700px] text-left text-[14px]">
							<thead className="border-b border-surface-line text-[13px] uppercase text-ink-400">
								<tr>
									<th className="pb-3 pr-4 font-semibold">Region</th>
									<th className="pb-3 pr-4 font-semibold">Class</th>
									<th className="pb-3 pr-4 font-semibold">Rate</th>
									<th className="pb-3 font-semibold">Status</th>
								</tr>
							</thead>
							<tbody>
								{rows.map(([region, taxClass, rate, status, className]) => (
									<tr className="border-b border-surface-line" key={region}>
										<td className="py-4 pr-4 font-semibold text-ink-900">
											{region}
										</td>
										<td className="py-4 pr-4 text-ink-700">{taxClass}</td>
										<td className="py-4 pr-4 text-ink-700">{rate}</td>
										<td className="py-4">
											<StatusBadge className={className} label={status} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</FormCard>
				<aside className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card">
					<h2 className="mb-4 text-[17px] font-semibold text-ink-900">
						Tax Settings
					</h2>
					<SelectField
						label="Price Display"
						name="price_display"
						options={["Prices include tax", "Prices exclude tax"]}
					/>
					<label className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-ink-700">
						<input
							className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
							defaultChecked
							type="checkbox"
						/>
						Calculate tax on shipping
					</label>
				</aside>
			</section>
		</>
	);
}

export function StoreProfilePage({ settings }: { settings: AdminStoreSettings }) {
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/store-settings",
		method: "PATCH",
		redirectTo: routes.settings,
	});

	return (
		<>
			<PageHeader
				description="Configure store identity and contact details."
				eyebrow="Configuration"
				title="Settings"
			/>
			<form
				className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card"
				onSubmit={(event) => void onSubmit(event)}
			>
				<div className="border-b border-surface-line pb-5">
					<h2 className="text-[20px] font-medium text-ink-900">
						Store Profile
					</h2>
					<p className="mt-1 text-[14px] text-ink-500">
						These details power the storefront&apos;s /contact page - phone,
						email, and chat links only appear there once set here.
					</p>
				</div>
				<div className="mt-6 grid gap-5 md:grid-cols-2">
					<Field
						defaultValue={settings.storeName}
						label="Store name"
						name="store_name"
						placeholder="Your store name"
					/>
					<Field
						defaultValue={settings.supportEmail}
						label="Support email"
						name="support_email"
						placeholder="support@yourstore.com"
						type="email"
					/>
					<Field
						defaultValue={settings.supportPhone}
						label="Support phone"
						name="support_phone"
						placeholder="+1 555 000 0000"
						type="tel"
					/>
					<Field
						defaultValue={settings.chatLink}
						help="Any external chat link (WhatsApp, Telegram, Messenger, etc). Leave blank to hide."
						label="Chat link"
						name="chat_link"
						placeholder="https://wa.me/15550000000"
					/>
					<Field
						className="md:col-span-2"
						defaultValue={settings.address}
						help="Shown on /contact along with a map. Leave blank to hide."
						label="Store address"
						name="address"
						placeholder="1260 Broadway, San Francisco, CA 94109"
					/>
				</div>
				{error ? (
					<p className="mt-4 text-[13px] text-danger-600" role="alert">
						{error}
					</p>
				) : null}
				<FormFooter cancelHref={routes.settings} submitting={submitting} />
			</form>
		</>
	);
}

function FormFooter({
	cancelHref,
	submitting = false,
}: {
	cancelHref: string;
	submitting?: boolean;
}) {
	return (
		<div className="mt-6 flex flex-wrap justify-end gap-2">
			<Link
				className="inline-flex h-11 items-center rounded-base border border-surface-line px-4 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
				href={cancelHref}
			>
				Cancel
			</Link>
			<button
				className="h-11 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={submitting}
				type="submit"
			>
				{submitting ? "Saving..." : "Save Changes"}
			</button>
		</div>
	);
}
