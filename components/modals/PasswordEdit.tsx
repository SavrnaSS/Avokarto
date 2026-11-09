"use client";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import { useUiElement } from "@/context/uiStore";
import { getPasswordValidationError } from "@/lib/passwordValidation";

/**
 * Change password - the same compact card as sign-in / sign-up (styles:
 * .avk-auth* in _modals.scss), so on phones it's a bottom sheet you can
 * swipe away. Same rule as quick sign-up: 8+ characters plus a number,
 * symbol or capital.
 */
export default function PasswordEdit() {
  const { activeBsModal, close, isOpen } = useManagedModalPanel("passwordEditModal");
  const { showToaster } = useUiElement();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Re-triggers the shake on every rejected attempt.
  const [shakes, setShakes] = useState(0);
  const currentInput = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const longEnough = newPassword.length >= 8;
  const varied = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) || /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);
  const passwordError = getPasswordValidationError(newPassword, newPassword, { requireStrong: false });
  const sameAsCurrent = Boolean(newPassword) && newPassword === currentPassword;

  // Phones: swipe down to close, and stay above the keyboard.
  useBottomSheet(sheetRef, isOpen, close);

  useEffect(() => {
    if (!isOpen || activeBsModal[activeBsModal.length - 1] !== "passwordEditModal") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeBsModal, close, isOpen]);

  useEffect(() => {
    if (isOpen) currentInput.current?.focus({ preventScroll: true });
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || passwordError || !currentPassword) return;
    if (sameAsCurrent) {
      setError("Pick a password you haven't used here before.");
      setShakes((count) => count + 1);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/password", {
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      showToaster("Password updated");
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to change password.",
      );
      setShakes((count) => count + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const eye = (
    <button
      aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
      className="avk-auth-eye"
      onClick={() => setShowPasswords((previous) => !previous)}
      type="button"
    >
      <i className={`fa-regular ${showPasswords ? "fa-eye-slash" : "fa-eye"}`} />
    </button>
  );

  return (
    <div
      className="rbt-default-modal modal fade avk-auth-modal"
      id="passwordEditModal"
      tabIndex={-1}
      aria-labelledby="passwordEditModalLabel"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <div className="modal-dialog modal-dialog-centered avk-auth-dialog">
        <div className="modal-content avk-auth" ref={sheetRef}>
          <button type="button" className="avk-auth-close" aria-label="Close" onClick={close}>
            <i className="fa-solid fa-xmark" />
          </button>
          <span className="avk-auth-badge">✦ Account security</span>
          <h2 className="avk-auth-title" id="passwordEditModalLabel">Change your password</h2>
          <p className="avk-auth-lead">You&apos;ll stay signed in on this device.</p>

          <form
            className="avk-auth-form"
            data-dir="forward"
            data-shake={shakes ? (shakes % 2 ? "a" : "b") : undefined}
            noValidate
            onSubmit={handleSubmit}
          >
            <label className="visually-hidden" htmlFor="curent_password">Current password</label>
            <div className="avk-auth-password">
              <input
                aria-invalid={Boolean(error) || undefined}
                autoComplete="current-password"
                className="avk-auth-input"
                id="curent_password"
                onChange={(event) => { setCurrentPassword(event.target.value); setError(""); }}
                placeholder="Current password"
                ref={currentInput}
                required
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
              />
              {eye}
            </div>
            <label className="visually-hidden" htmlFor="new_password">New password</label>
            <div className="avk-auth-password">
              <input
                aria-describedby="new_password_rules"
                autoComplete="new-password"
                className="avk-auth-input"
                id="new_password"
                onChange={(event) => { setNewPassword(event.target.value); setError(""); }}
                placeholder="New password"
                required
                type={showPasswords ? "text" : "password"}
                value={newPassword}
              />
            </div>
            <ul className="avk-signup-rules" id="new_password_rules">
              <li data-ok={longEnough || undefined}>8+ characters</li>
              <li data-ok={varied || undefined}>A number, symbol or capital</li>
            </ul>
            <div className="avk-auth-row">
              {error ? <p className="avk-auth-error" role="alert">{error}</p> : <span />}
              <Link className="avk-auth-link avk-auth-forgot" href="/forgot-password" onClick={close}>
                Forgot it?
              </Link>
            </div>
            <button
              aria-busy={submitting || undefined}
              className="avk-auth-submit"
              disabled={submitting || Boolean(passwordError) || !currentPassword || !newPassword}
              type="submit"
            >
              {submitting ? <span aria-hidden="true" className="avk-auth-spinner" /> : null}
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
