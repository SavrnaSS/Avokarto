"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  PRODUCT_NAVIGATION_START_EVENT,
  setPendingProductNavigation,
} from "@/lib/productNavigation";
import styles from "./ProductNavigationEnhancer.module.css";

type NavigationPhase = "idle" | "loading" | "complete";

const PRODUCT_ROUTE_PATTERN =
  /^\/(?:product|product-single-[a-z0-9-]+)\/[^/?#]+\/?(?:[?#].*)?$/;
const NESTED_CONTROL_SELECTOR =
  'button, input, select, textarea, label, [role="button"], [data-product-card-control]';

function productHrefFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const nestedControl = target.closest(NESTED_CONTROL_SELECTOR);
  if (nestedControl) return null;

  const link = target.closest<HTMLAnchorElement>("a[href]");
  const card = target.closest<HTMLElement>("[data-product-href]");
  const rawHref = link?.getAttribute("href") ?? card?.dataset.productHref;

  if (!rawHref) return null;

  try {
    const url = new URL(rawHref, window.location.origin);
    if (url.origin !== window.location.origin) return null;

    const href = `${url.pathname}${url.search}${url.hash}`;
    return PRODUCT_ROUTE_PATTERN.test(href) ? href : null;
  } catch {
    return null;
  }
}

function productHrefFromNavigationEvent(event: Event) {
  const href = (event as CustomEvent<{ href?: unknown }>).detail?.href;
  if (typeof href !== "string") return null;

  return PRODUCT_ROUTE_PATTERN.test(href) ? href : null;
}

export default function ProductNavigationEnhancer() {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<NavigationPhase>("idle");
  const phaseRef = useRef<NavigationPhase>("idle");
  const previousPathnameRef = useRef(pathname);
  const prefetchedRef = useRef(new Set<string>());
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startNavigation = (href: string) => {
      if (new URL(href, window.location.origin).pathname === pathname) return;

      setPendingProductNavigation(href);
      phaseRef.current = "loading";
      setPhase("loading");

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        phaseRef.current = "idle";
        setPhase("idle");
      }, 12_000);
    };

    const prefetch = (event: Event) => {
      const href = productHrefFromTarget(event.target);
      if (!href) return;
      if (event.type === "pointerdown") setPendingProductNavigation(href);
      if (prefetchedRef.current.has(href)) return;

      prefetchedRef.current.add(href);
      try {
        router.prefetch(href);
        window.setTimeout(() => prefetchedRef.current.delete(href), 30_000);
      } catch {
        prefetchedRef.current.delete(href);
      }
    };

    const beginNavigation = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      const href = link ? productHrefFromTarget(link) : null;
      if (href) startNavigation(href);
    };

    const beginProgrammaticNavigation = (event: Event) => {
      const href = productHrefFromNavigationEvent(event);
      if (href) startNavigation(href);
    };

    document.addEventListener("pointerover", prefetch, { passive: true });
    document.addEventListener("pointerdown", prefetch, { passive: true });
    document.addEventListener("focusin", prefetch);
    document.addEventListener("click", beginNavigation);
    window.addEventListener(
      PRODUCT_NAVIGATION_START_EVENT,
      beginProgrammaticNavigation,
    );

    return () => {
      document.removeEventListener("pointerover", prefetch);
      document.removeEventListener("pointerdown", prefetch);
      document.removeEventListener("focusin", prefetch);
      document.removeEventListener("click", beginNavigation);
      window.removeEventListener(
        PRODUCT_NAVIGATION_START_EVENT,
        beginProgrammaticNavigation,
      );
    };
  }, [pathname, router]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;

    if (phaseRef.current !== "loading") return;

    phaseRef.current = "complete";
    setPhase("complete");
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      phaseRef.current = "idle";
      setPhase("idle");
    }, 180);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-ready="true"
      data-state={phase}
      data-testid="product-navigation-progress"
      className={`${styles.progress} ${
        phase === "loading"
          ? styles.loading
          : phase === "complete"
            ? styles.complete
            : ""
      }`}
    />
  );
}
