/**
 * Store font pairings - the single list shared by the API (validation), the
 * seller's customizer and the storefront. The font files themselves are
 * declared in components/stores/storeFontFaces.ts (next/font, self-hosted).
 * Adding one: add it here and there, and extend the DB check
 * (latest: database/migrations/030_store_fonts_custom_css.sql).
 */
export const STORE_FONTS = ["theme", "modern", "geometric", "friendly", "tech", "editorial", "boutique", "classic", "loud"] as const;

export type StoreFont = (typeof STORE_FONTS)[number];

export const DEFAULT_STORE_FONT: StoreFont = "theme";

export const STORE_FONT_INFO: Record<StoreFont, { body: string; description: string; heading: string; label: string }> = {
	theme: { body: "Theme", description: "Each theme's own typefaces", heading: "Theme", label: "Theme default" },
	modern: { body: "Inter", description: "Clean, neutral, easy to read", heading: "Inter", label: "Modern" },
	geometric: { body: "Inter", description: "Round, confident headings", heading: "Poppins", label: "Geometric" },
	friendly: { body: "DM Sans", description: "Soft and approachable", heading: "DM Sans", label: "Friendly" },
	tech: { body: "Inter", description: "Crisp, a little futuristic", heading: "Space Grotesk", label: "Tech" },
	editorial: { body: "Inter", description: "Magazine-style serif headlines", heading: "Playfair Display", label: "Editorial" },
	boutique: { body: "DM Sans", description: "Warm, characterful serif", heading: "Fraunces", label: "Boutique" },
	classic: { body: "Source Sans 3", description: "Timeless book serif", heading: "Lora", label: "Classic" },
	loud: { body: "Inter", description: "Heavy, poster-like headings", heading: "Archivo Black", label: "Loud" },
};

export function isStoreFont(value: unknown): value is StoreFont {
	return typeof value === "string" && (STORE_FONTS as readonly string[]).includes(value);
}
