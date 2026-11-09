"use client";

import { useState, useEffect } from "react";

const DEFAULT_THRESHOLD = 200;

export function useSticky(threshold: number = DEFAULT_THRESHOLD) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      const next = window.scrollY > threshold;
      setIsSticky((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [threshold]);

  return isSticky;
}
