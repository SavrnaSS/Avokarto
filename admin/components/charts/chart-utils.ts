/** Canvas text can't use CSS fallbacks, so name the whole stack (Cabin isn't always loaded). */
export const CHART_FONT = "Cabin, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

export const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

export type ChartLike = {
	dispose: () => void;
	getDom: () => HTMLElement;
	resize: (options?: { width?: number; height?: number }) => void;
	setOption: (
		option: Record<string, unknown>,
		options?: { notMerge?: boolean },
	) => void;
};

export function isDarkMode() {
	return document.documentElement.classList.contains("dark");
}

export function labelColor() {
	return isDarkMode() ? "#94a3b8" : "#8a8a8a";
}

export function splitColor() {
	return isDarkMode() ? "rgba(148,163,184,0.14)" : "rgba(136,136,136,0.16)";
}

export function cardBg() {
	return isDarkMode() ? "#181d29" : "#ffffff";
}

export function themeColor(name: string, fallback: string) {
	const value = getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();

	return value || fallback;
}

function hexToRgb(color: string) {
	const normalized = color.trim().replace("#", "");
	const hex =
		normalized.length === 3
			? normalized
					.split("")
					.map((part) => `${part}${part}`)
					.join("")
			: normalized;

	if (hex.length !== 6) return null;

	const value = Number.parseInt(hex, 16);
	if (Number.isNaN(value)) return null;

	return {
		b: value & 255,
		g: (value >> 8) & 255,
		r: (value >> 16) & 255,
	};
}

export function colorAlpha(color: string, alpha: number) {
	const rgb = hexToRgb(color);
	if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

	const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
	if (rgbMatch) {
		const [, r, g, b] = rgbMatch;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	return color;
}

export function chartPalette() {
	return {
		accent: themeColor("--color-accent-500", "#ff4c1a"),
		brand: themeColor("--color-brand-600", "#174d0a"),
		brandDark: themeColor("--color-brand-700", "#0d3906"),
		brandMedium: themeColor("--color-brand-500", "#3e8326"),
		brandSoft: themeColor("--color-brand-400", "#65a84e"),
		warning: themeColor("--color-warning-500", "#f5b24f"),
	};
}

export function tooltipBase(trigger: "axis" | "item") {
	return {
		backgroundColor: isDarkMode() ? "#0f131c" : "#ffffff",
		borderColor: isDarkMode() ? "#2f374a" : "#e6e6e6",
		borderWidth: 1,
		extraCssText: "border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.12);",
		padding: [8, 12],
		textStyle: {
			color: isDarkMode() ? "#cbd5e1" : "#333333",
			fontFamily: CHART_FONT,
			fontSize: 13,
		},
		trigger,
	};
}

export function axis(categories: readonly string[]) {
	return {
		axisLabel: { color: labelColor(), fontFamily: CHART_FONT },
		axisLine: { show: false },
		axisTick: { show: false },
		boundaryGap: false,
		data: categories,
		type: "category",
	};
}

export function valueAxis(extra: Record<string, unknown> = {}) {
	const axisLabel =
		typeof extra.axisLabel === "object" && extra.axisLabel !== null
			? extra.axisLabel
			: {};

	return {
		...extra,
		axisLabel: {
			color: labelColor(),
			fontFamily: CHART_FONT,
			...axisLabel,
		},
		axisLine: { show: false },
		axisTick: { show: false },
		splitLine: { lineStyle: { color: splitColor(), type: "dashed" } },
		type: "value",
	};
}

export function bindResponsiveChart(chart: ChartLike, container: HTMLElement) {
	const resize = () => {
		if (container.clientWidth) {
			chart.resize({
				height: container.clientHeight,
				width: container.clientWidth,
			});
		}
	};

	let resizeObserver: ResizeObserver | undefined;
	if (typeof ResizeObserver !== "undefined") {
		resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);
	}

	window.addEventListener("resize", resize);
	window.addEventListener("load", resize);
	const timeouts = [50, 200, 500].map((delay) =>
		window.setTimeout(resize, delay),
	);

	return () => {
		timeouts.forEach((timeout) => {
			window.clearTimeout(timeout);
		});
		resizeObserver?.disconnect();
		window.removeEventListener("resize", resize);
		window.removeEventListener("load", resize);
	};
}

export function bindThemeRepaint(repaint: () => void) {
	const onThemeChange = () => repaint();
	window.addEventListener("themechange", onThemeChange);

	const observer = new MutationObserver(() => repaint());
	observer.observe(document.documentElement, {
		attributeFilter: ["class"],
		attributes: true,
	});

	return () => {
		window.removeEventListener("themechange", onThemeChange);
		observer.disconnect();
	};
}
