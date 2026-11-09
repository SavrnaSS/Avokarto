"use client";

import { isStoreTheme, type StoreTheme } from "@/lib/storeThemes";

// What a visitor tried on the homepage (name, theme) survives sign-up and
// carries into /start. Browser storage only: a convenience, never required.
const NAME_KEY = "avk-store-draft";
const THEME_KEY = "avk-store-draft-theme";

function read(key: string) {
	try {
		return window.localStorage.getItem(key) ?? "";
	} catch {
		return "";
	}
}

function write(key: string, value: string) {
	try {
		if (value) window.localStorage.setItem(key, value);
		else window.localStorage.removeItem(key);
	} catch {
		// Storage blocked: the draft just isn't carried over.
	}
}

// The sample names the old idea chips offered - left in a draft, they'd
// prefill every new store with someone else's example.
const RETIRED_SAMPLES = new Set(["the daily edit", "good finds", "studio sunday"]);

export function readDraftName() {
	const name = read(NAME_KEY);
	return RETIRED_SAMPLES.has(name.trim().toLowerCase()) ? "" : name;
}
export function readDraftTheme(): StoreTheme | "" {
	const value = read(THEME_KEY);
	return isStoreTheme(value) ? value : "";
}

export function saveDraft(name: string, theme: StoreTheme) {
	write(NAME_KEY, name.trim());
	write(THEME_KEY, theme);
}

export function clearDraft() {
	write(NAME_KEY, "");
	write(THEME_KEY, "");
}
