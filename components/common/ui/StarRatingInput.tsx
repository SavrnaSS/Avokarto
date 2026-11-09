"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import styles from "./StarRatingInput.module.css";

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function StarRatingInput({
  value,
  onChange,
  size = 24,
  disabled = false,
  label = "Rating",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
  label?: string;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const [poppedStar, setPoppedStar] = useState<number | null>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const displayValue = hoverValue || value;

  // The bounce animation plays once per selection - clearing the class after
  // it finishes lets the same star re-trigger it on a later click.
  useEffect(() => {
    if (poppedStar === null) return;
    const timeout = setTimeout(() => setPoppedStar(null), 460);
    return () => clearTimeout(timeout);
  }, [poppedStar]);

  function selectStar(star: number) {
    if (disabled) return;
    onChange(star);
    setPoppedStar(star);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, star: number) {
    if (disabled) return;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(5, Math.max(1, (value || star) + 1));
      selectStar(next);
      buttonsRef.current[next - 1]?.focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.max(1, (value || star) - 1);
      selectStar(next);
      buttonsRef.current[next - 1]?.focus();
    }
  }

  return (
    <div
      className={styles.group}
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHoverValue(0)}
    >
      {STAR_VALUES.map((star) => {
        const filled = star <= displayValue;
        const classNames = [
          styles.star,
          filled ? styles.starFilled : "",
          poppedStar === star ? styles.starPop : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={star}
            ref={(node) => {
              buttonsRef.current[star - 1] = node;
            }}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className={classNames}
            style={
              {
                "--star-size": `${size}px`,
                transitionDelay:
                  hoverValue && star <= hoverValue
                    ? `${(hoverValue - star) * 20}ms`
                    : "0ms",
              } as CSSProperties
            }
            disabled={disabled}
            onMouseEnter={() => setHoverValue(star)}
            onFocus={() => setHoverValue(star)}
            onBlur={() => setHoverValue(0)}
            onClick={() => selectStar(star)}
            onKeyDown={(event) => handleKeyDown(event, star)}
          >
            <i className="fa-solid fa-star" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
