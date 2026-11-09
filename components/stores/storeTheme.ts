import type { CSSProperties } from "react";

/** WCAG relative luminance of a #rrggbb colour (0 black - 1 white). */
function luminance(hex: string) {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex);
	if (!match) return 0;
	const value = parseInt(match[1], 16);
	const channel = (shift: number) => {
		const c = ((value >> shift) & 255) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

/** Black or white, whichever reads better on the store's accent colour (WCAG luminance). */
export function readableOn(hex: string) {
	if (!/^#?[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
	return luminance(hex) > 0.45 ? "#111111" : "#ffffff";
}

/** WCAG contrast ratio between two #rrggbb colours (1-21). */
export function contrastRatio(a: string, b: string) {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

export function storeThemeStyle(accentColor: string) {
	return { "--st-accent": accentColor, "--st-on-accent": readableOn(accentColor) } as CSSProperties;
}

export function initialsOf(name: string) {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("") || "S"
	);
}
