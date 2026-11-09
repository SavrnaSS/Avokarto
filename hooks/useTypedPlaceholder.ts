"use client";

import { type RefObject, useEffect } from "react";

/**
 * Types example values into an empty input's placeholder, one after another
 * ("e.g. Trendora", erase, "e.g. Cozy Cart" ...), so the field shows what a
 * good answer looks like. Writes the DOM attribute directly - no re-renders.
 * Reduced motion gets the first example, static.
 */
export function useTypedPlaceholder(
  inputRef: RefObject<HTMLInputElement | null>,
  examples: readonly string[],
  { active = true, prefix = "e.g. " }: { active?: boolean; prefix?: string } = {},
) {
  useEffect(() => {
    const input = inputRef.current;
    if (!input || !active || !examples.length) return;
    const original = input.placeholder;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      input.placeholder = `${prefix}${examples[0]}`;
      return () => { input.placeholder = original; };
    }

    let word = 0;
    let length = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const target = examples[word % examples.length];
      length += deleting ? -1 : 1;
      input.placeholder = `${prefix}${target.slice(0, length)}`;
      let delay = deleting ? 38 : 85;
      if (!deleting && length >= target.length) { deleting = true; delay = 1600; }
      else if (deleting && length <= 0) { deleting = false; word += 1; delay = 320; }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 400);
    return () => {
      window.clearTimeout(timer);
      input.placeholder = original;
    };
  }, [active, examples, inputRef, prefix]);
}
