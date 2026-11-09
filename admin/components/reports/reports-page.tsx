import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { AppSelect } from "@/admin/components/ui/app-select";
import { routes } from "@/admin/config/routes";

const stats = [
	["Net sales", "$128.4k", "+12.8% from last month", "text-success-600"],
	["Orders", "3,284", "+7.2% from last month", "text-success-600"],
	["Returns", "84", "2.5% return rate", "text-warning-600"],
	["New customers", "642", "+18.4% from last month", "text-success-600"],
] as const;

const reports = [
	["bar-chart-3", "Sales Report", "Revenue, discounts, taxes, and refunds."],
	["shopping-bag", "Order Report", "Order volume by status and channel."],
	["users", "Customer Report", "Acquisition, repeat purchase, and segments."],
] as const;

export function ReportsPage() {
	return (
		<>
			<PageHeader
				actions={
					<button
						className="inline-flex h-11 items-center gap-2 rounded-base border border-surface-line px-4 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
						type="button"
					>
						<Icon className="h-4 w-4" name="download" />
						Export
					</button>
				}
				description="Review sales, orders, inventory, and customer performance summaries."
				eyebrow="Analytics"
				title="Reports"
			/>
			<section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{stats.map(([label, value, trend, trendClass]) => (
					<article
						className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card"
						key={label}
					>
						<p className="text-[13px] text-ink-500">{label}</p>
						<h2 className="mt-1 text-[24px] font-semibold text-ink-900">
							{value}
						</h2>
						<p className={`mt-2 text-[13px] ${trendClass}`}>{trend}</p>
					</article>
				))}
			</section>
			<section className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-[17px] font-semibold text-ink-900">
						Report Library
					</h2>
					<AppSelect
						className="w-[180px]"
						defaultValue="Last 30 days"
						options={["Last 30 days", "Last quarter", "This year"]}
					/>
				</div>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{reports.map(([icon, title, description]) => (
						<Link
							aria-label={`Open ${title.toLowerCase()}`}
							className="rounded-card border border-surface-line p-5 transition-colors hover:bg-surface-body"
							href={routes.reports}
							key={title}
						>
							<Icon className="h-5 w-5 text-brand-600" name={icon} />
							<h3 className="mt-3 text-[15px] font-semibold text-ink-900">
								{title}
							</h3>
							<p className="mt-1 text-[13px] text-ink-500">{description}</p>
						</Link>
					))}
				</div>
			</section>
		</>
	);
}
