import type { SellerBadge } from "@/lib/backend/seller-profiles";

const compact = new Intl.NumberFormat("en", { maximumFractionDigits: 1, notation: "compact" });

/** 1234 → "1.2K". */
export function compactNumber(value: number) {
	return compact.format(value);
}

/** "Joined Mar 2025". */
export function joinedLabel(iso: string) {
	return `Joined ${new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export function initialsOf(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase())
		.join("") || "S";
}

/** Profile link on Avokarto. */
export const sellerPath = (handle: string) => `/sellers/${handle}`;

/** A product on the seller's own store (custom domain or /store/<handle>). */
export const sellerProductUrl = (storeUrl: string, slug: string) => `${storeUrl.replace(/\/+$/, "")}/${slug}`;

export const BADGE_INFO: Record<SellerBadge, { hint: string; label: string }> = {
	"highly-rated": { hint: "4.5★ or more across 20+ reviews", label: "Highly rated" },
	"new": { hint: "Opened in the last 30 days", label: "New seller" },
	"own-domain": { hint: "Runs the store on its own web address", label: "Own domain" },
	"partner": { hint: "Orders packed, shipped and protected by Avokarto", label: "Avokarto partner" },
	"top-seller": { hint: "25+ orders delivered", label: "Top seller" },
	"wide-catalog": { hint: "50+ products listed", label: "Wide catalog" },
};
