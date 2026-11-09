"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CurrencyCode = "usd" | "gbp" | "eur";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === "usd" || value === "gbp" || value === "eur";
}

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

// Storage can be blocked or full; the active selection must still work in memory.
const storage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try { return window.localStorage.getItem(name); } catch { return null; }
  },
  setItem: (name: string, value: string) => {
    try { window.localStorage.setItem(name, value); } catch { /* Keep the in-memory selection. */ }
  },
  removeItem: (name: string) => {
    try { window.localStorage.removeItem(name); } catch { /* Storage is unavailable. */ }
  },
}));

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "usd",
      setCurrency: (currency) => {
        if (isCurrencyCode(currency)) set({ currency });
      },
    }),
    {
      name: "avokarto-currency",
      storage,
      partialize: (state) => ({ currency: state.currency }),
      merge: (persisted, current) => {
        const value = persisted && typeof persisted === "object" && "currency" in persisted
          ? persisted.currency : undefined;
        return { ...current, currency: isCurrencyCode(value) ? value : "usd" };
      },
    },
  ),
);
