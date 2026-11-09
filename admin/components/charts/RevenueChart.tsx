"use client";

import { useEffect, useRef } from "react";
import {
	axis,
	bindResponsiveChart,
	bindThemeRepaint,
	CHART_FONT,
	type ChartLike,
	chartPalette,
	colorAlpha,
	labelColor,
	tooltipBase,
	valueAxis,
} from "@/admin/components/charts/chart-utils";

type RangeKey = "year" | "month";
export type RevenueRanges = Record<RangeKey, { categories: readonly string[]; data: number[] }>;

const dollars = (value: number) =>
	new Intl.NumberFormat("en-US", { currency: "USD", maximumFractionDigits: 0, style: "currency" }).format(value);

/** Order value per month (Year) or per week (Month), from the dashboard API. */
export function RevenueChart({ ranges }: { ranges: RevenueRanges }) {
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let disposed = false;
		let chart: ChartLike | null = null;
		let current = ranges.year;
		let cleanupResize: (() => void) | undefined;
		let cleanupTheme: (() => void) | undefined;
		const buttonCleanups: Array<() => void> = [];

		async function init() {
			const [
				echarts,
				{ BarChart },
				{
					GridComponent,
					TooltipComponent,
					MarkLineComponent,
				},
				{ CanvasRenderer },
			] = await Promise.all([
				import("echarts/core"),
				import("echarts/charts"),
				import("echarts/components"),
				import("echarts/renderers"),
			]);

			echarts.use([
				BarChart,
				GridComponent,
				TooltipComponent,
				MarkLineComponent,
				CanvasRenderer,
			]);

			const element = chartRef.current;
			if (!element || disposed) return;

			const grad = (start: string, end: string) =>
				new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{ color: start, offset: 0 },
					{ color: end, offset: 1 },
				]);

			chart = echarts.init(element, null, { renderer: "canvas" }) as ChartLike;

			const paint = () => {
				const palette = chartPalette();

				chart?.setOption(
					{
						grid: {
							bottom: 26,
							containLabel: false,
							left: 44,
							right: 0,
							top: 24,
						},
						textStyle: { fontFamily: CHART_FONT },
						// Bars, not a smoothed line: sparse sales stay honest (no curve
						// invented between empty months).
						series: [
							{
								barMaxWidth: 34,
								data: current.data,
								emphasis: { itemStyle: { color: palette.brand } },
								itemStyle: {
									borderRadius: [8, 8, 2, 2],
									color: grad(palette.brand, colorAlpha(palette.brand, 0.55)),
								},
								markLine: {
									data: [{ type: "average" }],
									label: {
										color: labelColor(),
										fontSize: 11,
										formatter: (params: { value: number }) => `Avg ${dollars(params.value)}`,
										position: "insideEndTop",
									},
									lineStyle: {
										color: document.documentElement.classList.contains("dark") ? "#64748b" : "#cbd5e1",
										type: "dashed",
										width: 1,
									},
									silent: true,
									symbol: "none",
								},
								name: "Sales",
								type: "bar",
							},
						],
						tooltip: {
							...tooltipBase("axis"),
							axisPointer: { type: "shadow" },
							valueFormatter: (value: number) => dollars(value),
						},
						xAxis: axis(current.categories),
						yAxis: valueAxis({
							axisLabel: {
								formatter: (value: number | string) => dollars(Number(value)),
							},
						}),
					},
					{ notMerge: true },
				);
			};

			paint();
			cleanupResize = bindResponsiveChart(chart, element);
			cleanupTheme = bindThemeRepaint(paint);

			const revenueToggle = document.querySelector("[data-revenue-toggle]");
			const buttons = Array.from(
				revenueToggle?.querySelectorAll<HTMLButtonElement>("[data-range]") ??
					[],
			);

			buttons.forEach((button) => {
				const onClick = () => {
					const range = button.dataset.range as RangeKey | undefined;
					if (!range || !ranges[range]) return;

					current = ranges[range];
					buttons.forEach((item) => {
						const active = item === button;
						item.classList.toggle("bg-surface-card", active);
						item.classList.toggle("text-brand-600", active);
						item.classList.toggle("shadow-card", active);
					});
					paint();
				};

				button.addEventListener("click", onClick);
				buttonCleanups.push(() => button.removeEventListener("click", onClick));
			});
		}

		init();

		return () => {
			disposed = true;
			buttonCleanups.forEach((cleanup) => {
				cleanup();
			});
			cleanupResize?.();
			cleanupTheme?.();
			chart?.dispose();
		};
	}, [ranges]);

	return (
		<div
			aria-label="Revenue report chart"
			className="mt-7 min-h-[312px] w-full min-w-0 overflow-hidden"
			id="revenueChart"
			role="img"
			ref={chartRef}
		/>
	);
}
