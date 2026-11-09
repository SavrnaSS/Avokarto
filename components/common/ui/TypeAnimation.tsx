"use client";
import { useEffect, useRef, useState } from "react";
export default function TypeAnimation({
  strings = [
    "Search for something...",
    "Looking for something specific?",
    "Explore what you need...",
  ],
}: {
  strings?: string[];
}) {
  const [activeStingIndex, setActiveStingIndex] = useState(0);
  const typeidRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);

  const updateWidth = () => {
    if (!typeidRef.current) return;
    typeidRef.current.style.width = `${typeidRef.current.scrollWidth}px`;
  };

  useEffect(() => {
    updateWidth();

    const reapedTyping = setInterval(() => {
      if (typeidRef.current) typeidRef.current.style.width = "0px";
      setTimeout(() => {
        setActiveStingIndex((pre) => {
          if (pre === strings.length - 1) {
            return 0;
          } else {
            return pre + 1;
          }
        });
      }, 600);
    }, 2200);

    // Cleanup function to destroy the Typed instance
    return () => {
      clearInterval(reapedTyping);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [strings.length]);
  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateWidth();
    });
  }, [activeStingIndex]);
  return (
    <>
      <span ref={typeidRef} className="cd-words-wrapper type-animation">
        {strings.map((elm, i) => (
          <b
            key={i}
            className={`item-text pr-3 ${
              activeStingIndex === i ? "is-visible" : "is-hidden"
            } `}
          >
            {elm}
          </b>
        ))}
      </span>
    </>
  );
}
