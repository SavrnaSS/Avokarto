"use client";

import type { PasswordStrengthLabel } from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  label: PasswordStrengthLabel;
  hint: string;
  compact?: boolean;
}

export default function PasswordStrengthIndicator({
  label,
  hint,
  compact = false,
}: PasswordStrengthIndicatorProps) {
  const level = label === "Weak" ? 1 : label === "Medium" ? 2 : 3;
  const toneClass = `is-${label.toLowerCase()}`;

  return (
    <div className={`rbt-password-strength ${toneClass} ${compact ? "is-compact" : ""}`}>
      <div className="rbt-password-strength__bar">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`rbt-password-strength__segment ${
              segment <= level ? "is-active" : ""
            }`}
          />
        ))}
      </div>
      <p className="rbt-password-strength__hint">{hint}</p>
    </div>
  );
}
