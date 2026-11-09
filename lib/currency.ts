"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useCurrencyStore, type CurrencyCode } from "@/context/currencyStore";
import { formatCurrency } from "@/lib/price";

const CURRENCY_ISO: Record<CurrencyCode, string> = {
  usd: "USD",
  gbp: "GBP",
  eur: "EUR",
};

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: "usd", label: "$ USD" },
  { code: "gbp", label: "£ GBP" },
  { code: "eur", label: "€ EUR" },
];

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useCurrency() {
  const storeCurrency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  // Match the server's first paint, without depending on successful storage hydration.
  const hydrated = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const currency = hydrated ? storeCurrency : "usd";

  // Currency selection changes presentation, never the catalog's numeric prices.
  const formatPrice = useCallback(
    (amount: number | string | null | undefined) => formatCurrency(amount, CURRENCY_ISO[currency]),
    [currency],
  );

  return { currency, setCurrency, formatPrice, ready: hydrated };
}
