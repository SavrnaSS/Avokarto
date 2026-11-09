import { Archivo_Black, DM_Sans, Fraunces, Inter, Lora, Playfair_Display, Poppins, Source_Sans_3, Space_Grotesk } from "next/font/google";
import type { CSSProperties } from "react";
import type { StoreFont } from "@/lib/storeFonts";

// Self-hosted by next/font (no requests to Google from shoppers' browsers).
// Not preloaded: each store page downloads only the pairing it uses.
// (next/font reads these options at build time, so each is written out in full.)
const inter = Inter({ display: "swap", preload: false, subsets: ["latin"] });
const poppins = Poppins({ display: "swap", preload: false, subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const dmSans = DM_Sans({ display: "swap", preload: false, subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ display: "swap", preload: false, subsets: ["latin"] });
const playfair = Playfair_Display({ display: "swap", preload: false, subsets: ["latin"] });
const fraunces = Fraunces({ display: "swap", preload: false, subsets: ["latin"] });
const lora = Lora({ display: "swap", preload: false, subsets: ["latin"] });
const sourceSans = Source_Sans_3({ display: "swap", preload: false, subsets: ["latin"] });
const archivoBlack = Archivo_Black({ display: "swap", preload: false, subsets: ["latin"], weight: "400" });

type Pairing = { body: { style: { fontFamily: string } }; heading: { style: { fontFamily: string } }; headingWeight?: number };

const PAIRINGS: Record<Exclude<StoreFont, "theme">, Pairing> = {
	modern: { body: inter, heading: inter },
	geometric: { body: inter, heading: poppins },
	friendly: { body: dmSans, heading: dmSans },
	tech: { body: inter, heading: spaceGrotesk },
	editorial: { body: inter, heading: playfair },
	boutique: { body: dmSans, heading: fraunces },
	classic: { body: sourceSans, heading: lora },
	// A single-weight display face: never let a theme fake it bolder.
	loud: { body: inter, headingWeight: 400, heading: archivoBlack },
};

/**
 * CSS variables that switch a store to a font pairing: headings via
 * --st-heading, everything else via --font-primary (which the storefront
 * uses for body text). Undefined for the theme's own fonts.
 */
export function storeFontStyle(font: StoreFont): CSSProperties | undefined {
	if (font === "theme") return undefined;
	const pairing = PAIRINGS[font];
	if (!pairing) return undefined;
	return {
		"--font-primary": pairing.body.style.fontFamily,
		"--st-heading": pairing.heading.style.fontFamily,
		...(pairing.headingWeight ? { "--st-heading-weight": String(pairing.headingWeight) } : null),
	} as CSSProperties;
}

/** Just the heading family (customizer samples). */
export function storeFontFamilies(font: StoreFont) {
	if (font === "theme") return null;
	const pairing = PAIRINGS[font];
	return { body: pairing.body.style.fontFamily, heading: pairing.heading.style.fontFamily };
}
