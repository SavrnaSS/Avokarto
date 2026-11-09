"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import { cn } from "@/admin/utils/cn";

type CategoryShowcaseItem = {
	image: string;
	name: string;
	slug: string;
};

type BrandShowcaseItem = {
	initials: string;
	name: string;
	slug: string;
	tileClass: string;
};

type ShowcaseStripProps =
	| {
			items: BrandShowcaseItem[];
			type: "brand";
	  }
	| {
			items: CategoryShowcaseItem[];
			type: "category";
	  };

export function ShowcaseStrip({ items, type }: ShowcaseStripProps) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [atStart, setAtStart] = useState(true);
	const [atEnd, setAtEnd] = useState(false);
	const isCategory = type === "category";
	const title = isCategory ? "Category" : "Brand";
	const prevLabel = isCategory ? "Previous categories" : "Previous brands";
	const nextLabel = isCategory ? "Next categories" : "Next brands";

	function updateArrows() {
		const scroller = scrollerRef.current;
		if (!scroller) {
			return;
		}

		setAtStart(scroller.scrollLeft <= 0);
		setAtEnd(
			scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2,
		);
	}

	function scrollByDirection(direction: "next" | "prev") {
		const scroller = scrollerRef.current;
		if (!scroller) {
			return;
		}

		const step = Math.max(scroller.clientWidth * 0.8, 200);
		scroller.scrollTo({
			behavior: "smooth",
			left: scroller.scrollLeft + (direction === "next" ? step : -step),
		});
	}

	return (
		<section className="mb-6 rounded-card border border-surface-line bg-surface-card p-5 shadow-card">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-[20px] font-medium text-ink-900">{title}</h2>
				<div className="flex items-center gap-1.5">
					<button
						aria-label={prevLabel}
						className="grid h-8 w-8 place-items-center rounded-full border border-surface-line text-ink-500 transition-colors hover:bg-surface-muted hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-500"
						disabled={atStart}
						onClick={() => scrollByDirection("prev")}
						type="button"
					>
						<Icon className="h-4 w-4" name="chevron-left" />
					</button>
					<button
						aria-label={nextLabel}
						className="grid h-8 w-8 place-items-center rounded-full border border-surface-line text-ink-500 transition-colors hover:bg-surface-muted hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-500"
						disabled={atEnd}
						onClick={() => scrollByDirection("next")}
						type="button"
					>
						<Icon className="h-4 w-4" name="chevron-right" />
					</button>
				</div>
			</div>
			<div
				className="no-scrollbar mt-5 flex flex-nowrap gap-3 overflow-x-auto pb-2"
				onScroll={updateArrows}
				ref={scrollerRef}
			>
				{isCategory
					? items.map((item) => (
							<Link
								className="group flex min-w-27.5 flex-col items-center rounded-base px-4 py-4 text-center transition-colors"
								href={routes.editCategory(item.slug)}
								key={item.name}
							>
								<Image
									alt={item.name}
									className="h-26 w-26 rounded-full object-cover transition-transform group-hover:scale-105"
									height={104}
									src={item.image}
									width={104}
								/>
								<span className="mt-3 line-clamp-1 text-[14px] font-semibold text-ink-900 group-hover:text-brand-600">
									{item.name}
								</span>
							</Link>
						))
					: items.map((item) => (
							<Link
								className="group flex min-w-27.5 flex-col items-center rounded-base px-4 py-4 text-center transition-colors"
								href={routes.editBrand(item.slug)}
								key={item.name}
							>
								<span
									className={cn(
										"grid h-20 w-20 place-items-center rounded-full text-[22px] font-semibold transition-transform group-hover:scale-105",
										item.tileClass,
									)}
								>
									{item.initials}
								</span>
								<span className="mt-3 line-clamp-1 text-[14px] font-semibold text-ink-900 group-hover:text-brand-600">
									{item.name}
								</span>
							</Link>
						))}
			</div>
		</section>
	);
}
