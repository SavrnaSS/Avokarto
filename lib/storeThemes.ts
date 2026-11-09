/**
 * Reseller store themes - the single list shared by the API (validation),
 * the seller's Theme Studio and the storefront. The look itself lives in
 * components/stores/storefront.module.css under `[data-theme="<key>"]`.
 * Adding a theme: add it here, style it there, and extend the DB check
 * (latest: database/migrations/025_remove_modern_aurora_themes.sql).
 * Removing one: also move its stores to another theme in that migration.
 */
// The order is the order sellers see in Theme Studio (and arrow-key
// through): the standout looks lead, the quieter ones follow.
export const STORE_THEMES = [
	"editorial",
	"playful",
	"street",
	"minimal",
	"bold",
	"elegant",
	"noir",
	"organic",
] as const;

export type StoreTheme = (typeof STORE_THEMES)[number];

/** New stores, and any stored theme that no longer exists, use this one. */
export const DEFAULT_STORE_THEME: StoreTheme = "minimal";

export type StoreThemeInfo = {
	/** Colours that suit the theme, offered first in the colour picker. */
	accents: string[];
	/** The page background, for contrast checks against the store colour. */
	background: string;
	description: string;
	label: string;
	mood: "Classic" | "Dark" | "Expressive" | "Light";
};

export const STORE_THEME_INFO: Record<StoreTheme, StoreThemeInfo> = {
	bold: { accents: ["#E11D48", "#2563EB", "#EA580C"], background: "#f2f2f2", description: "Your colour up front, big type", label: "Bold", mood: "Expressive" },
	minimal: { accents: ["#111827", "#374151", "#0F766E"], background: "#ffffff", description: "Clean white, nothing extra", label: "Minimal", mood: "Light" },
	elegant: { accents: ["#8B5E34", "#6B4F3A", "#7C2D12"], background: "#faf6ef", description: "Warm cream, serif headings", label: "Elegant", mood: "Classic" },
	noir: { accents: ["#D4AF37", "#A78BFA", "#22D3EE"], background: "#0b0b0d", description: "Dark, glowing and luxurious", label: "Noir", mood: "Dark" },
	playful: { accents: ["#F43F5E", "#F59E0B", "#8B5CF6"], background: "#fff6ef", description: "Bubbly, bouncy, sticker-bright", label: "Playful", mood: "Expressive" },
	street: { accents: ["#FACC15", "#EF4444", "#22C55E"], background: "#f2efe6", description: "Raw borders, hard shadows", label: "Street", mood: "Expressive" },
	editorial: { accents: ["#111111", "#9F1239", "#1E3A8A"], background: "#fbfaf8", description: "Magazine serif, big imagery", label: "Editorial", mood: "Classic" },
	organic: { accents: ["#4D7C0F", "#A16207", "#9A3412"], background: "#f4f1ea", description: "Earthy paper, soft arches", label: "Organic", mood: "Classic" },
};

export function isStoreTheme(value: unknown): value is StoreTheme {
	return typeof value === "string" && (STORE_THEMES as readonly string[]).includes(value);
}
