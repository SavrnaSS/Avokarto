import { money } from "./sellerApi";

export type Platform = "instagram" | "tiktok" | "youtube";
type CaptionProduct = { category: string; name: string; price: number };

function hashtag(text: string) {
	const words = text.replace(/[^a-z0-9 ]+/gi, " ").trim().split(/\s+/).filter(Boolean);
	return words.length ? `#${words.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join("")}` : "";
}

/** A caption written for each platform's conventions and length (Reels, made videos). */
export function captionFor(platform: Platform, product: CaptionProduct, storeName: string, url: string) {
	const { category, name, price } = product;
	const tags = [hashtag(category), hashtag(storeName)].filter(Boolean);
	if (platform === "instagram") {
		return `✨ ${name} ✨\nYours for ${money(price)} at ${storeName}.\n\n🛍️ Tap the link in our bio to shop\n${url}\n\n${[...tags, "#reels", "#shopnow", "#newin"].join(" ")}`;
	}
	if (platform === "tiktok") {
		return `${name} for only ${money(price)} 🔥 Link in bio to grab yours 🛒 ${[...tags, "#tiktokmademebuyit", "#fyp", "#shopping"].join(" ")}`;
	}
	return `${name} - ${money(price)} | ${storeName}\nShop it here 👉 ${url}\n${[...tags, "#shorts", "#shopping"].join(" ")}`;
}
