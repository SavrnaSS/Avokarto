"use client";

import { useEffect, useRef, useState } from "react";

const CART_RESERVATION_SECONDS = 10 * 60;

function formatReservationTime(seconds: number) {
  const clampedSeconds = Math.max(0, seconds);
  const minutes = Math.floor(clampedSeconds / 60);
  const remainingSeconds = clampedSeconds % 60;

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

export function useCartReservationTimer(isActive: boolean, resetKey: string) {
  const [remainingSecondsState, setRemainingSecondsState] = useState(
    CART_RESERVATION_SECONDS,
  );
  const expiresAtRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    expiresAtRef.current = Date.now() + CART_RESERVATION_SECONDS * 1000;
    const updateRemainingSeconds = () => {
      setRemainingSecondsState(
        Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000)),
      );
    };

    const initialTickId = window.setTimeout(updateRemainingSeconds, 0);
    const intervalId = window.setInterval(() => {
      updateRemainingSeconds();
    }, 1000);

    return () => {
      window.clearTimeout(initialTickId);
      window.clearInterval(intervalId);
    };
  }, [isActive, resetKey]);

  const remainingSeconds = isActive ? remainingSecondsState : 0;

  return {
    remainingSeconds,
    label: formatReservationTime(remainingSeconds),
    isExpired: remainingSeconds <= 0,
  };
}
