import Link from "next/link";

type BreadcrumbItem = {
	href?: string;
	label: string;
};

type BreadcrumbProps = {
	items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
	return (
		<nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-ink-400">
			<ol className="flex flex-wrap items-center gap-1.5">
				{items.map((item, index) => {
					const current = index === items.length - 1;
					const key = item.href ?? item.label;

					return (
						<li className="flex items-center gap-1.5" key={key}>
							{index > 0 ? <span aria-hidden="true">/</span> : null}
							{item.href && !current ? (
								<Link
									className="font-medium text-ink-500 hover:text-brand-600"
									href={item.href}
								>
									{item.label}
								</Link>
							) : (
								<span
									aria-current={current ? "page" : undefined}
									className={current ? "font-semibold text-ink-700" : ""}
								>
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
