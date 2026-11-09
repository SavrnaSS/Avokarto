"use client";

import { type RefObject, useEffect } from "react";

const PHONE = "(max-width: 575px)";

/**
 * Phone behaviour for a popup shown as a bottom sheet (the sign-in and
 * sign-up cards, styles in _modals.scss):
 * - swipe it down to close - it follows the finger, snaps back if the swipe
 *   was short and slow, and only starts once the sheet is scrolled to the top
 *   so it never fights scrolling the content;
 * - it rides above the on-screen keyboard (iOS leaves fixed elements under
 *   it) via `--avk-kb` on the dialog.
 * Does nothing on wider screens.
 */
export function useBottomSheet(sheetRef: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    const sheet = sheetRef.current;
    const dialog = sheet?.parentElement;
    if (!open || !sheet || !dialog) return;
    const phone = window.matchMedia(PHONE);
    sheet.style.transform = "";

    const viewport = window.visualViewport;
    const syncKeyboard = () => {
      const inset = phone.matches && viewport ? window.innerHeight - viewport.height - viewport.offsetTop : 0;
      dialog.style.setProperty("--avk-kb", `${Math.max(0, Math.round(inset))}px`);
    };
    syncKeyboard();
    viewport?.addEventListener("resize", syncKeyboard);
    viewport?.addEventListener("scroll", syncKeyboard);

    let tracking = false;
    let dragging = false;
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;

    const onStart = (event: TouchEvent) => {
      if (!phone.matches || event.touches.length !== 1 || sheet.scrollTop > 0) return;
      if ((event.target as HTMLElement).closest("input, textarea, select")) return;
      tracking = true;
      dragging = false;
      startY = lastY = event.touches[0].clientY;
      lastTime = event.timeStamp;
      velocity = 0;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const y = event.touches[0].clientY;
      const distance = y - startY;
      if (!dragging) {
        // Moving up means scrolling the content - leave it alone.
        if (distance < -4) { tracking = false; return; }
        if (distance < 6) return;
        dragging = true;
        sheet.dataset.dragging = "";
      }
      event.preventDefault();
      velocity = (y - lastY) / Math.max(1, event.timeStamp - lastTime);
      lastY = y;
      lastTime = event.timeStamp;
      // Free downwards, a stiff rubber band upwards.
      const offset = distance >= 0 ? distance : -Math.sqrt(-distance) * 2;
      sheet.style.transform = `translateY(${offset}px)`;
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      delete sheet.dataset.dragging;
      const distance = lastY - startY;
      if (distance > Math.min(140, sheet.offsetHeight * 0.3) || (distance > 24 && velocity > 0.55)) {
        sheet.style.transform = `translateY(${sheet.offsetHeight + 24}px)`;
        onClose();
      } else {
        sheet.style.transform = "";
      }
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      viewport?.removeEventListener("resize", syncKeyboard);
      viewport?.removeEventListener("scroll", syncKeyboard);
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
      delete sheet.dataset.dragging;
    };
  }, [onClose, open, sheetRef]);
}
