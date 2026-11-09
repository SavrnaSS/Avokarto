import type { ReactNode } from "react";

type PageHeaderProps = {
	actions?: ReactNode;
	description?: string;
	eyebrow: string;
	title: string;
};

export function PageHeader({
	actions,
	description,
	eyebrow,
	title,
}: PageHeaderProps) {
	return (
		<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
			<div>
				<p className="mb-1 text-[13px] font-semibold uppercase text-brand-600">
					{eyebrow}
				</p>
				<h1 className="text-[24px] font-semibold text-ink-900">{title}</h1>
				{description ? (
					<p className="mt-1 max-w-2xl text-[14px] text-ink-500">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex flex-wrap items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
