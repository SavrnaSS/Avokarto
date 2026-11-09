"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import { FormEvent, useEffect, useRef, useState } from "react";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { getPasswordStrength } from "@/lib/passwordValidation";
import { TRIAL_DAYS } from "@/lib/billing/plans";
import { useCustomerSession } from "@/hooks/use-customer-session";
import SetupWait from "@/components/seller/SetupWait";
import { readDraftName } from "@/components/seller/storeDraft";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Quick sign-up, one field at a time: email, then password (the name comes
 * from the email and can be changed later). A compact card - seller pages
 * pitch the free trial, everywhere else it's a plain account.
 */
export default function Signup() {
  const pathname = usePathname();
  const { activeBsModal, close, isOpen } = useManagedModalPanel("signupModal");
  const setCustomer = useCustomerSession((state) => state.setCustomer);
  const [step, setStep] = useState<"email" | "password">("email");
  // Which way the step changed (slide direction), and a counter that
  // re-triggers the shake each time an email is rejected.
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [shakes, setShakes] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const pendingSubmission = useRef(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [draftStoreName, setDraftStoreName] = useState("");
  const showSetupWait = pathname === "/start" && submitting;
  const sellerFlow = pathname === "/" || pathname.startsWith("/start") || pathname.startsWith("/seller");
  // Opened from the store builder: the store is designed, this saves it.
  const [builtStoreName] = useState(() => (pathname === "/start" ? readDraftName() : ""));
  const savingStore = pathname === "/start";
  const emailOk = EMAIL.test(email.trim());
  const longEnough = password.length >= 8;
  const varied = /[A-Z]/.test(password) && /[a-z]/.test(password) || /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const passwordOk = getPasswordStrength(password).label !== "Weak";

  // Phones: swipe down to close, and stay above the keyboard.
  useBottomSheet(sheetRef, isOpen, close);

  useEffect(() => {
    if (!isOpen || activeBsModal[activeBsModal.length - 1] !== "signupModal") {
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

  // Each step puts the cursor straight in its field.
  useEffect(() => {
    if (!isOpen) return;
    (step === "email" ? emailInput : passwordInput).current?.focus({ preventScroll: true });
  }, [isOpen, step]);

  function continueToPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailOk) {
      setError("Enter a valid email address.");
      setShakes((count) => count + 1);
      return;
    }
    setError("");
    setDirection("forward");
    setStep("password");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pendingSubmission.current || !passwordOk) {
      return;
    }

    pendingSubmission.current = true;
    if (pathname === "/start") setDraftStoreName(readDraftName());
    setSubmitting(true);
    setError("");
    setAccountExists(false);

    try {
      const response = await fetch("/api/account/signup", {
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAccountExists(payload.error?.code === "ACCOUNT_EXISTS");
        throw new Error(payload.error?.message ?? "Unable to create account.");
      }

      setCustomer(payload.customer);
      setEmail("");
      setPassword("");
      setDirection("forward");
      setStep("email");
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account.",
      );
    } finally {
      pendingSubmission.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rbt-default-modal modal fade avk-auth-modal"
      id="signupModal"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      aria-labelledby="signupModalLabel"
      aria-hidden={!isOpen}
    >
      <div className="modal-dialog modal-dialog-centered avk-auth-dialog">
        <div className="modal-content avk-auth" ref={sheetRef}>
          <button type="button" className="avk-auth-close" aria-label="Close" onClick={close}>
            <i className="fa-solid fa-xmark" />
          </button>
          {showSetupWait ? (
            <>
              <span className="visually-hidden" id="signupModalLabel">
                Creating your account
              </span>
              <SetupWait kind="account" storeName={draftStoreName} />
            </>
          ) : (
            <>
              <span className="avk-auth-badge">
                {sellerFlow ? `✦ ${TRIAL_DAYS}-day free trial` : "✦ Free account"}
              </span>
              <div
                aria-label={`Step ${step === "email" ? 1 : 2} of 2`}
                aria-valuemax={2}
                aria-valuemin={1}
                aria-valuenow={step === "email" ? 1 : 2}
                className="avk-auth-steps"
                data-step={step}
                role="progressbar"
              >
                <span />
                <span />
              </div>
              <h2 className="avk-auth-title" id="signupModalLabel">
                {savingStore ? "Save your store" : sellerFlow ? "Start making money today" : "Create your account"}
              </h2>
              <p className="avk-auth-lead">
                {savingStore
                  ? <>Create your free account to keep {builtStoreName ? <strong>{builtStoreName}</strong> : "your store"} - then pick your plan and open it.</>
                  : sellerFlow
                    ? "Your store is a minute away. Your first sale could be today."
                    : "Faster checkout and order tracking, in one account."}
              </p>

              {step === "email" ? (
                <form
                  className="avk-auth-form"
                  data-dir={direction}
                  data-shake={shakes ? (shakes % 2 ? "a" : "b") : undefined}
                  key="email"
                  noValidate
                  onSubmit={continueToPassword}
                >
                  <label className="visually-hidden" htmlFor="modal_register_email">Email</label>
                  <input
                    aria-invalid={Boolean(error) || undefined}
                    autoComplete="email"
                    className="avk-auth-input"
                    id="modal_register_email"
                    inputMode="email"
                    onChange={(event) => { setEmail(event.target.value); setError(""); }}
                    placeholder="Email address"
                    ref={emailInput}
                    required
                    type="email"
                    value={email}
                  />
                  {error ? <p className="avk-auth-error" role="alert">{error}</p> : null}
                  <button className="avk-auth-submit" disabled={!email.trim()} type="submit">
                    Continue
                  </button>
                </form>
              ) : (
                <form className="avk-auth-form" data-dir={direction} key="password" noValidate onSubmit={handleSubmit}>
                  {/* The email from step one, with a way back to change it. */}
                  <div className="avk-auth-chip">
                    <span>{email.trim()}</span>
                    <button onClick={() => { setDirection("back"); setStep("email"); setError(""); setAccountExists(false); }} type="button">
                      Change
                    </button>
                  </div>
                  <label className="visually-hidden" htmlFor="modal_register_password">Password</label>
                  <div className="avk-auth-password">
                    <input
                      aria-describedby="modal_register_password_rules"
                      autoComplete="new-password"
                      className="avk-auth-input"
                      id="modal_register_password"
                      onChange={(event) => { setPassword(event.target.value); setError(""); }}
                      placeholder="Create a password"
                      ref={passwordInput}
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
                  <ul className="avk-signup-rules" id="modal_register_password_rules">
                    <li data-ok={longEnough || undefined}>8+ characters</li>
                    <li data-ok={varied || undefined}>A number, symbol or capital</li>
                  </ul>
                  {error ? (
                    <p className="avk-auth-error" role="alert">
                      {error}{" "}
                      {accountExists ? (
                        <ModalTriggerButton className="avk-auth-link" openModalName="signinModal">Sign in instead</ModalTriggerButton>
                      ) : null}
                    </p>
                  ) : null}
                  <button aria-busy={submitting || undefined} className="avk-auth-submit" disabled={submitting || !passwordOk} type="submit">
                    {submitting ? <span aria-hidden="true" className="avk-auth-spinner" /> : null}
                    {submitting ? "Creating your account…" : savingStore ? "Save my store" : sellerFlow ? "Start free trial" : "Create account"}
                  </button>
                </form>
              )}

              <p className="avk-auth-switch">
                Already have an account?{" "}
                <ModalTriggerButton className="avk-auth-link" openModalName="signinModal">Sign in</ModalTriggerButton>
              </p>
              <p className="avk-signup-terms">
                By continuing you agree to our <Link href="/terms-policy">Terms</Link> and{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
