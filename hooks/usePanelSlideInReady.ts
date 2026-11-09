"use client";

import { useLayoutEffect, useState } from "react";

/**
 * When a side panel is `dynamic()`-loaded, `delayedShowBsModal` can become true
 * before the panel DOM exists — the first paint then already has `side-menu-active`
 * and CSS transitions do not run. This hook defers "ready" until after two animation
 * frames from open so the browser can paint the closed state first.
 */
export function usePanelSlideInReady(isOpen: boolean): boolean {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;

    if (!isOpen) {
      queueMicrotask(() => {
        if (!cancelled) setReady(false);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (cancelled) return;
      setReady(false);
      raf1 = requestAnimationFrame(() => {
        if (cancelled) return;
        raf2 = requestAnimationFrame(() => {
          if (!cancelled) setReady(true);
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen]);

  return ready;
}
