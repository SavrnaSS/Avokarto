"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import { FormEvent, useEffect, useRef, useState } from "react";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useCustomerSession } from "@/hooks/use-customer-session";

/**
 * Sign in - the same compact card as quick sign-up (components/modals/Signup.tsx,
 * styles in _modals.scss). Email and password stay on one step here so
 * password managers can fill both at once.
 */
export default function Signin() {
  const pathname = usePathname();
  const { activeBsModal, close, isOpen } = useManagedModalPanel("signinModal");
  const setCustomer = useCustomerSession((state) => state.setCustomer);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Re-triggers the shake on every failed attempt.
  const [shakes, setShakes] = useState(0);
  const emailInput = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sellerFlow = pathname === "/" || pathname.startsWith("/start") || pathname.startsWith("/seller");

  // Phones: swipe down to close, and stay above the keyboard.
  useBottomSheet(sheetRef, isOpen, close);

  useEffect(() => {
    if (!isOpen || activeBsModal[activeBsModal.length - 1] !== "signinModal") {
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
    if (isOpen) emailInput.current?.focus({ preventScroll: true });
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/login", {
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to sign in.");
      }

      // Admin credentials entered here: the admin session is set - go to the console.
      if (payload.admin) {
        window.location.assign(payload.redirect ?? "/admin");
        return;
      }

      setCustomer(payload.customer);
      setEmail("");
      setPassword("");
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in.",
      );
      setShakes((count) => count + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rbt-default-modal modal fade avk-auth-modal"
      id="signinModal"
      tabIndex={-1}
      aria-labelledby="signinModalLabel"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <div className="modal-dialog modal-dialog-centered avk-auth-dialog">
        <div className="modal-content avk-auth" ref={sheetRef}>
          <button type="button" className="avk-auth-close" aria-label="Close" onClick={close}>
            <i className="fa-solid fa-xmark" />
          </button>
          <span className="avk-auth-badge">✦ Welcome back</span>
          <h2 className="avk-auth-title" id="signinModalLabel">
            {sellerFlow ? "Sign in to your store" : "Sign in to Avokarto"}
          </h2>
          <p className="avk-auth-lead">
            {sellerFlow
              ? "Pick up where you left off - your products and earnings are waiting."
              : "Track orders and check out faster."}
          </p>

          <form
            className="avk-auth-form"
            data-dir="forward"
            data-shake={shakes ? (shakes % 2 ? "a" : "b") : undefined}
            noValidate
            onSubmit={handleSubmit}
          >
            <label className="visually-hidden" htmlFor="modal_signin_email">Email</label>
            <input
              aria-invalid={Boolean(error) || undefined}
              autoComplete="email"
              className="avk-auth-input"
              id="modal_signin_email"
              inputMode="email"
              onChange={(event) => { setEmail(event.target.value); setError(""); }}
              placeholder="Email address"
              ref={emailInput}
              required
              type="email"
              value={email}
            />
            <label className="visually-hidden" htmlFor="modal_signin_password">Password</label>
            <div className="avk-auth-password">
              <input
                aria-invalid={Boolean(error) || undefined}
                autoComplete="current-password"
                className="avk-auth-input"
                id="modal_signin_password"
                onChange={(event) => { setPassword(event.target.value); setError(""); }}
                placeholder="Password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="avk-auth-eye"
                onClick={() => setShowPassword((previous) => !previous)}
                type="button"
              >
                <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
            <div className="avk-auth-row">
              {error ? <p className="avk-auth-error" role="alert">{error}</p> : <span />}
              <Link className="avk-auth-link avk-auth-forgot" href="/forgot-password" onClick={close}>
                Forgot password?
              </Link>
            </div>
            <button aria-busy={submitting || undefined} className="avk-auth-submit" disabled={submitting || !email.trim() || !password} type="submit">
              {submitting ? <span aria-hidden="true" className="avk-auth-spinner" /> : null}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="avk-auth-switch">
            {sellerFlow ? "New to Avokarto?" : "Don't have an account?"}{" "}
            <ModalTriggerButton className="avk-auth-link" openModalName="signupModal">
              {sellerFlow ? "Start your free trial" : "Create an account"}
            </ModalTriggerButton>
          </p>
        </div>
      </div>
    </div>
  );
}
