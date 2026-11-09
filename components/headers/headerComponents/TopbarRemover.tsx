"use client";

import { useState } from "react";

export default function TopbarRemover() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <span
        className="rbt-topbar-dismiss-state"
        data-topbar-dismissed="true"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      className="rbt-round-btn btn-white-off bg-section-activation"
      onClick={() => setIsDismissed(true)}
      aria-label="Dismiss top campaign banner"
      title="Dismiss top campaign banner"
    >
      <i className="fa-solid fa-xmark" />
    </button>
  );
}
