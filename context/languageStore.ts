"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "da" | "it";

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Same zustand + persist pattern as context/store.ts (the cart/wishlist
// store) - realtime everywhere it's read (every subscribed component
// re-renders the instant setLocale runs, no page reload) and survives
// reloads/new tabs via localStorage, matching how cart state already
// persists in this app.
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "avokarto-language" },
  ),
);
