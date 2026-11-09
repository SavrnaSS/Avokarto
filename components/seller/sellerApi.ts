"use client";

import { formatCurrency } from "@/lib/price";
import type { StoreFont } from "@/lib/storeFonts";
import type { StoreTheme } from "@/lib/storeThemes";

/** An API failure, with the field the server blamed (if any). */
export class SellerApiError extends Error {
	constructor(
		message: string,
		readonly code?: string,
		readonly field?: string,
	) {
		super(message);
	}
}

export async function sellerRequest<T>(
	method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
	url: string,
	body?: unknown,
): Promise<T> {
	let response: Response;
	try {
		response = await fetch(url, {
			body: body === undefined ? undefined : JSON.stringify(body),
			cache: "no-store",
			credentials: "same-origin",
			headers: body === undefined ? undefined : { "Content-Type": "application/json" },
			method,
		});
	} catch {
		throw new SellerApiError("Couldn't reach Avokarto. Check your connection and try again.", "NETWORK");
	}
	const payload = (await response.json().catch(() => ({}))) as {
		data?: T;
		error?: { code?: string; details?: { field?: unknown }; message?: string };
	};
	if (!response.ok) {
		const field = payload.error?.details?.field;
		throw new SellerApiError(
			payload.error?.message ?? "Something went wrong. Please try again.",
			payload.error?.code,
			typeof field === "string" ? field : undefined,
		);
	}
	return payload.data as T;
}

export function money(value: number) {
	return formatCurrency(value, "USD");
}

export function storeUrl(handle: string, productSlug?: string) {
	const origin = typeof window === "undefined" ? "" : window.location.origin;
	return `${origin}/store/${handle}${productSlug ? `/${productSlug}` : ""}`;
}

export function whatsappShareUrl(text: string) {
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Native share sheet on phones; falls back to copying the link. */
export async function shareLink({ text, title, url }: { text: string; title: string; url: string }) {
	if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
		try {
			await navigator.share({ text, title, url });
			return "shared" as const;
		} catch (error) {
			if ((error as Error)?.name === "AbortError") return "cancelled" as const;
		}
	}
	await navigator.clipboard?.writeText(url);
	return "copied" as const;
}

export type SellerSettings = {
	advertisedProducts: number | null;
	holdDays: number;
	maxMarginPercent: number;
	minPayout: number;
	platformFeePercent: number;
	signupsOpen: boolean;
};

export type { StoreTheme };
export type StoreSocials = Partial<Record<"facebook" | "instagram" | "website" | "youtube", string>>;

export type SellerStore = {
	about: string;
	accentColor: string;
	announcement: string;
	bannerUrl: string;
	contactEmail: string;
	customCss: string;
	font: StoreFont;
	logoUrl: string;
	socials: StoreSocials;
	theme: StoreTheme;
	createdAt: string;
	defaultMarginPercent: number;
	handle: string;
	id: string;
	name: string;
	payoutDetails:
		| { method: "upi"; upiId: string; accountName: string }
		| { method: "bank"; accountName: string; accountNumber: string; ifsc: string; bankName: string }
		| Record<string, never>;
	payoutsBlocked: boolean;
	status: "active" | "suspended" | "unpaid";
	suspendedReason: string;
	tagline: string;
	whatsapp: string;
};
