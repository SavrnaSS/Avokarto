"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { RevenueRanges } from "@/admin/components/charts/RevenueChart";

function ChartFallback({
	className,
	label,
}: {
	className: string;
	label: string;
}) {
	return (
		<div
			aria-label={label}
			className={`${className} animate-pulse rounded-base bg-surface-body`}
			role="img"
		/>
	);
}

export const RevenueChart = dynamic(
	() =>
		import("@/admin/components/charts/RevenueChart").then((mod) => mod.RevenueChart),
	{
		loading: () => (
			<ChartFallback
				className="mt-7 min-h-[312px]"
				label="Revenue report chart"
			/>
		),
		ssr: false,
	},
) as ComponentType<{ ranges: RevenueRanges }>;
