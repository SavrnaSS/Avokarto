"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

type TabOption = {
  id: string;
  label: React.ReactNode;
};

type NavEffectTabsProps = {
  parentClassName?: string;
  options: TabOption[];
  active: string;
  setActive: (id: string) => void;
  groupClassName?: string;
  itemClassName?: string;
  highlightClassName?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
};

export default function NavEffectTabs({
  parentClassName = "",
  options,
  active,
  setActive,
  groupClassName = "rbt-product-nav-grp",
  itemClassName = "rbt-product-nav",
  highlightClassName = "rbt-bg-highlight",
  startAdornment,
  endAdornment,
}: NavEffectTabsProps) {
  const [highlightStyle, setHighlightStyle] = useState<
    React.CSSProperties | undefined
  >();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rafRef = useRef<number | null>(null);

  const updateHighlight = useCallback(() => {
    if (!containerRef.current) return;

    const currentEl = itemRefs.current[active];
    if (!currentEl) return;

    const itemRect = currentEl.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setHighlightStyle({
      width: itemRect.width,
      height: itemRect.height,
      left: 0,
      top: 0,
      transform: `translate(${itemRect.left - containerRect.left}px, ${
        itemRect.top - containerRect.top
      }px)`,
    });
  }, [active]);

  const scheduleHighlightUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateHighlight();
    });
  }, [updateHighlight]);

  useEffect(() => {
    scheduleHighlightUpdate();
  }, [scheduleHighlightUpdate]);

  useEffect(() => {
    const handleResize = () => {
      // Recalculate immediately and once again after layout settles.
      scheduleHighlightUpdate();
      window.setTimeout(scheduleHighlightUpdate, 120);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scheduleHighlightUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      scheduleHighlightUpdate();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [scheduleHighlightUpdate]);

  const handleClick =
    (id: string) => () => {
      setActive(id);
    };

  const allItemsOptions = options.filter((tab) => tab.id !== "view-all");
  const viewAllOption = options.find((tab) => tab.id === "view-all");

  return (
    <div
      ref={containerRef}
      className={`rbt-nav-effect-activation ${parentClassName}`.trim()}
    >
      {startAdornment}
      <ul className={groupClassName}>
        {allItemsOptions.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              ref={(el) => {
                if (el) {
                  itemRefs.current[tab.id] = el;
                }
              }}
              className={`${itemClassName}${active === tab.id ? " active" : ""}`}
              onClick={handleClick(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      {viewAllOption && (
        <ul className={groupClassName}>
          <li key={viewAllOption.id}>
            <button
              type="button"
              ref={(el) => {
                if (el) {
                  itemRefs.current[viewAllOption.id] = el;
                }
              }}
              className={`${itemClassName}${active === viewAllOption.id ? " active" : ""}`}
              onClick={handleClick(viewAllOption.id)}
            >
              {viewAllOption.label}
            </button>
          </li>
        </ul>
      )}
      {endAdornment}
      <span className={highlightClassName} style={highlightStyle} />
    </div>
  );
}
