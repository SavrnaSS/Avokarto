// Where a store visit came from. Shared by the storefront tracker (client)
// and the events API (server validates against the same list).

export const TRAFFIC_SOURCES = ["whatsapp", "instagram", "facebook", "youtube", "tiktok", "google", "direct", "other"] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

export const TRAFFIC_LABELS: Record<TrafficSource, string> = {
	direct: "Direct / link",
	facebook: "Facebook",
	google: "Google",
	instagram: "Instagram",
	other: "Other sites",
	tiktok: "TikTok",
	whatsapp: "WhatsApp",
	youtube: "YouTube",
};

const TAGS: Record<string, TrafficSource> = {
	fb: "facebook",
	facebook: "facebook",
	google: "google",
	ig: "instagram",
	insta: "instagram",
	instagram: "instagram",
	tiktok: "tiktok",
	tt: "tiktok",
	wa: "whatsapp",
	whatsapp: "whatsapp",
	youtube: "youtube",
	yt: "youtube",
};

const HOSTS: [RegExp, TrafficSource][] = [
	[/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
	[/(^|\.)(instagram\.com)$/, "instagram"],
	[/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
	[/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
	[/(^|\.)(tiktok\.com)$/, "tiktok"],
	[/(^|\.)google\.[a-z.]+$/, "google"],
];

/**
 * Classify a visit. An explicit tag (?ref=whatsapp, utm_source=ig) wins -
 * WhatsApp's in-app browser usually sends no referrer, so Avokarto's own
 * share links carry ?ref=whatsapp. Otherwise the referrer host decides; a
 * referrer from the store's own site doesn't count as a new source.
 */
export function classifySource(search: string, referrer: string, ownHost: string): TrafficSource {
	const params = new URLSearchParams(search);
	const tag = (params.get("ref") ?? params.get("utm_source") ?? "").trim().toLowerCase();
	if (tag) return TAGS[tag] ?? "other";

	if (!referrer) return "direct";
	let host = "";
	try {
		host = new URL(referrer).hostname.toLowerCase();
	} catch {
		return "direct";
	}
	if (!host || host === ownHost.toLowerCase()) return "direct";
	for (const [pattern, source] of HOSTS) if (pattern.test(host)) return source;
	return "other";
}

/** Append ?ref=<tag> so the store can attribute visits from a share. */
export function withShareRef(url: string, tag: "facebook" | "instagram" | "tiktok" | "whatsapp" | "youtube") {
	try {
		const parsed = new URL(url);
		parsed.searchParams.set("ref", tag);
		return parsed.toString();
	} catch {
		return url;
	}
}
