type ClassValue = false | null | string | undefined;

export function cn(...classes: ClassValue[]) {
	return classes.filter(Boolean).join(" ");
}

function normalizeBaseURL(value: string | undefined): string {
	const base = value?.trim() || "/";

	return base.endsWith("/") ? base : `${base}/`;
}

export const baseURL = normalizeBaseURL(process.env.NEXT_PUBLIC_BASE_URL);
