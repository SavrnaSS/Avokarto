import Link from "next/link";
import { Icon } from "./icon";

type StatCardProps = {
	accentBorder: string;
	badge: string;
	badgeClass: string;
	icon: string;
	iconClass: string;
	label: string;
	value: string;
};

export function StatCard({
	accentBorder,
	badge,
	badgeClass,
	icon,
	iconClass,
	label,
	value,
}: StatCardProps) {
	return (
		<article className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card">
			<div className="flex items-center justify-between gap-4">
				<div className={`border-l-2 ${accentBorder} pl-3`}>
					<p className="text-[15px] text-ink-400">{label}</p>
					<div className="mt-1 flex flex-wrap items-center gap-2">
						<strong className="text-[28px] font-semibold leading-none text-ink-700">
							{value}
						</strong>
						<span
							className={`rounded-base px-2 py-1 text-[12px] font-semibold ${badgeClass}`}
						>
							{badge}
						</span>
					</div>
				</div>
				<div
					className={`grid h-11 w-11 place-items-center rounded-base ${iconClass}`}
				>
					<Icon className="h-5 w-5" name={icon} />
				</div>
			</div>
		</article>
	);
}

type StatePanelProps = {
	action: string;
	description: string;
	href: string;
	icon: string;
	iconClass: string;
	title: string;
};

export function StatePanel({
	action,
	description,
	href,
	icon,
	iconClass,
	title,
}: StatePanelProps) {
	return (
		<section className="rounded-card border border-dashed border-surface-line bg-surface-card p-6 text-center">
			<div
				className={`mx-auto grid h-12 w-12 place-items-center rounded-base ${iconClass}`}
			>
				<Icon className="h-5 w-5" name={icon} />
			</div>
			<h2 className="mt-4 text-[18px] font-semibold text-ink-900">{title}</h2>
			<p className="mx-auto mt-2 max-w-md text-[14px] text-ink-500">
				{description}
			</p>
			<Link
				className="mt-4 inline-flex h-10 items-center justify-center rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
				href={href}
			>
				{action}
			</Link>
		</section>
	);
}
