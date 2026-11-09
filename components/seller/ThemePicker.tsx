"use client";

import { STORE_THEME_INFO, STORE_THEMES, type StoreTheme } from "@/lib/storeThemes";
import s from "./theme-list.module.css";

/**
 * The themes as a quiet control. Each shows a type specimen in the theme's own
 * font, page colour and accent; the live devices above carry the full look.
 * Hovering tries a theme there; clicking keeps it.
 */
export default function ThemePicker({ accent, onHover, onPick, theme }: {
	/** The chosen colour, shown on the chosen theme's specimen. */
	accent: string;
	onHover: (theme: StoreTheme | null) => void;
	onPick: (theme: StoreTheme) => void;
	theme: StoreTheme;
}) {
	return (
		<div aria-label="Theme" className={s.list} role="group">
			{STORE_THEMES.map((key) => {
				const info = STORE_THEME_INFO[key];
				const style = { "--accent": key === theme ? accent : info.accents[0], "--page": info.background } as React.CSSProperties;
				return (
					<button aria-pressed={theme === key} className={s.row} key={key} onClick={() => onPick(key)} onPointerEnter={(event) => { if (event.pointerType === "mouse") onHover(key); }} onPointerLeave={() => onHover(null)} type="button">
						<span className={s.label}>{info.label}</span>
						<span aria-hidden="true" className={s.specimen} data-theme={key} style={style}>Aa</span>
					</button>
				);
			})}
		</div>
	);
}
