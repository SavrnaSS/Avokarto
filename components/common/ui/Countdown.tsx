"use client";
import { useCallback, useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const ANCHOR_STORAGE_KEY = "unimart_offer_countdown_anchor";
const MS_PER_HOUR = 60 * 60 * 1000;
const DEFAULT_LOOP_HOURS = 72; // 3-day "flash sale" cycle, the standard length evergreen offer timers use.

function splitDuration(ms: number): TimeLeft {
  return {
    days: Math.floor(ms / (1000 * 60 * 60 * 24)),
    hours: Math.floor((ms / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((ms / 1000 / 60) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

// A visitor's very first countdown mount seeds this anchor and every later
// mount (new page, new tab, return visit) reuses it, so their personal offer
// window keeps counting down smoothly across the site instead of jumping
// back to the full duration on every navigation. Falls back to an
// in-memory anchor (still loops correctly, just not persisted) if storage
// is unavailable - Safari private mode throws on setItem rather than
// silently no-op-ing.
let memoryAnchor: number | null = null;

function getOrCreateAnchor(): number {
  try {
    const stored = window.localStorage.getItem(ANCHOR_STORAGE_KEY);
    const parsed = stored ? Number(stored) : NaN;
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    const anchor = Date.now();
    window.localStorage.setItem(ANCHOR_STORAGE_KEY, String(anchor));
    return anchor;
  } catch {
    if (memoryAnchor === null) {
      memoryAnchor = Date.now();
    }
    return memoryAnchor;
  }
}

export default function Countdown({
  parentClass = "countdown",
  style = 1,
  targetDate,
  loopHours = DEFAULT_LOOP_HOURS,
}: {
  parentClass?: string;
  style?: number;
  targetDate?: string;
  loopHours?: number;
}) {
  // A caller-supplied targetDate is a real, one-time deadline (e.g. a
  // specific promo's end date) - honor it exactly, including showing
  // "Time's up!" once it genuinely passes. No targetDate means this is one
  // of the evergreen "offer ends in..." banners sprinkled around the
  // storefront, which should never go stale or dead-end on a hardcoded date
  // (the previous default did exactly that, and an invalid Date string
  // pushed it into "Time's up!" immediately on browsers - like Safari -
  // that don't lenient-parse malformed date text the way Chromium does).
  const explicitDeadline =
    targetDate !== undefined ? new Date(targetDate).getTime() : null;
  const hasValidExplicitDeadline =
    explicitDeadline !== null && Number.isFinite(explicitDeadline);
  const cycleMs = Math.max(1, loopHours) * MS_PER_HOUR;

  const calculateTimeLeft = useCallback((): TimeLeft | null => {
    if (targetDate !== undefined) {
      if (!hasValidExplicitDeadline) {
        return null;
      }
      const difference = explicitDeadline - Date.now();
      return difference > 0 ? splitDuration(difference) : null;
    }

    const anchor = getOrCreateAnchor();
    const elapsed = (Date.now() - anchor) % cycleMs;
    return splitDuration(cycleMs - elapsed);
  }, [targetDate, hasValidExplicitDeadline, explicitDeadline, cycleMs]);

  // "initial" = not yet mounted on client, so render null to avoid hydration issues
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | "initial">(
    "initial",
  );

  useEffect(() => {
    // Keep the hydration pass free of a synchronous countdown re-render.
    const initialFrame = requestAnimationFrame(() => {
      setTimeLeft(calculateTimeLeft());
    });
    // Start ticking once per second on the client
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      cancelAnimationFrame(initialFrame);
      clearInterval(timer);
    };
  }, [calculateTimeLeft]);

  if (timeLeft === "initial") {
    return null;
  }

  if (!timeLeft) {
    return <div>Time&apos;s up!</div>;
  }

  return (
    <>
      {style == 1 ? (
        <div className={parentClass}>
          <div className="countdown-container days">
            <span className="countdown-value"> {timeLeft.days}</span>
            <span className="countdown-heading">Days</span>
          </div>
          <div className="countdown-container hours">
            <span className="countdown-value">{timeLeft.hours}</span>
            <span className="countdown-heading">Hours</span>
          </div>
          <div className="countdown-container minutes">
            <span className="countdown-value">{timeLeft.minutes}</span>
            <span className="countdown-heading">Mins</span>
          </div>
          <div className="countdown-container seconds">
            <span className="countdown-value">{timeLeft.seconds}</span>
            <span className="countdown-heading">Secs</span>
          </div>
        </div>
      ) : (
        ""
      )}
      {style == 2 ? (
        <div className={parentClass}>
          <div className="countdown-container days">
            <span className="countdown-value days-bottom">{timeLeft.days}</span>
            <span className="countdown-heading days-top">Days</span>
          </div>
          <div className="countdown-container hours">
            <span className="countdown-value hours-bottom">
              {timeLeft.hours}
            </span>
            <span className="countdown-heading hours-top">Hrs</span>
          </div>
          <div className="countdown-container minutes">
            <span className="countdown-value minutes-bottom">
              {timeLeft.minutes}
            </span>
            <span className="countdown-heading minutes-top">Mins</span>
          </div>
          <div className="countdown-container seconds">
            <span className="countdown-value seconds-bottom">
              {timeLeft.seconds}
            </span>
            <span className="countdown-heading seconds-top">Secs</span>
          </div>
        </div>
      ) : (
        ""
      )}{" "}
    </>
  );
}
