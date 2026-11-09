"use client";

import { useRef, useState } from "react";

type CopyKey = string | number;

interface UseCopyToClipboardOptions {
  timeout?: number;
  defaultTooltip?: string;
  copiedTooltip?: string;
}

export function useCopyToClipboard({
  timeout = 2000,
  defaultTooltip = "Copy",
  copiedTooltip = "Copied!",
}: UseCopyToClipboardOptions = {}) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const resetTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({});
  const [tooltipState, setTooltipState] = useState<Record<string, string>>({});

  const toKey = (key: CopyKey = "default") => String(key);

  const setCopiedForKey = (key: string, value: boolean) => {
    setCopiedState((prev) => ({ ...prev, [key]: value }));
  };

  const setTooltipForKey = (key: string, value: string) => {
    setTooltipState((prev) => ({ ...prev, [key]: value }));
  };

  const resetTooltip = (key: CopyKey = "default") => {
    setTooltipForKey(toKey(key), defaultTooltip);
  };

  const getTooltip = (key: CopyKey = "default") =>
    tooltipState[toKey(key)] ?? defaultTooltip;

  const isCopied = (key: CopyKey = "default") => copiedState[toKey(key)] ?? false;

  const scheduleReset = (key: string) => {
    if (resetTimers.current[key]) {
      clearTimeout(resetTimers.current[key]);
    }
    resetTimers.current[key] = setTimeout(() => {
      setCopiedForKey(key, false);
      setTooltipForKey(key, defaultTooltip);
    }, timeout);
  };

  const copyText = async (text: string, key: CopyKey = "default") => {
    if (!text) return false;
    const normalizedKey = toKey(key);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }
      setCopiedForKey(normalizedKey, true);
      setTooltipForKey(normalizedKey, copiedTooltip);
      scheduleReset(normalizedKey);
      return true;
    } catch {
      setCopiedForKey(normalizedKey, false);
      setTooltipForKey(normalizedKey, defaultTooltip);
      return false;
    }
  };

  const copyFromRef = async (key: CopyKey = "default") => {
    const normalizedKey = toKey(key);
    const input = inputRefs.current[normalizedKey];
    if (!input) return false;
    return copyText(input.value, normalizedKey);
  };

  const registerInputRef =
    (key: CopyKey = "default") =>
    (element: HTMLInputElement | null) => {
      inputRefs.current[toKey(key)] = element;
    };

  return {
    registerInputRef,
    copyFromRef,
    copyText,
    copy: copyText, // Backward compatibility for existing usage.
    getTooltip,
    resetTooltip,
    isCopied,
    copied: isCopied("default"), // Backward compatibility for existing usage.
  };
}

export default useCopyToClipboard;