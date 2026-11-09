"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiElement } from "@/context/uiStore";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { getPasswordValidationError } from "@/lib/passwordValidation";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POSTs to the reset API; resolves with the payload or throws its message. */
async function resetRequest<T>(path: "request" | "confirm", body: unknown): Promise<T> {
  const response = await fetch(`/api/account/password-reset/${path}`, {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => {
    throw new Error("Couldn't reach Avokarto. Check your connection and try again.");
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message ?? "Something went wrong. Please try again.");
  return payload as T;
}

/**
 * Forgot password in the same compact card as the sign-in / sign-up modals
 * (styles: .avk-auth* in _modals.scss): email, then the emailed code + new
 * password (lib/backend/password-reset.ts), then done and signed in - one
 * step at a time, sliding in the direction you move.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const { showToaster } = useUiElement();
  const setCustomer = useCustomerSession((state) => state.setCustomer);
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakes, setShakes] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);

  // Same two rules as quick sign-up and password change.
  const rules = [
    { label: "8+ characters", ok: newPassword.length >= 8 },
    { label: "A number, symbol or capital", ok: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) || /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const passwordError = getPasswordValidationError(newPassword, newPassword, { requireStrong: false });
  const passwordOk = newPassword.length > 0 && !passwordError;

  useEffect(() => {
    if (step === "request") emailInput.current?.focus({ preventScroll: true });
    if (step === "reset") codeInput.current?.focus({ preventScroll: true });
  }, [step]);

  const fail = (message: string) => {
    setError(message);
    setShakes((count) => count + 1);
  };

  const handleSendCode = async () => {
    if (!EMAIL.test(email.trim())) {
      fail("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetRequest("request", { email: email.trim() });
      showToaster(step === "reset" ? "New code sent" : "Code sent");
      setDirection("forward");
      setStep("reset");
      setCode("");
    } catch (requestError) {
      fail(requestError instanceof Error ? requestError.message : "Couldn't send a code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (code.trim().length < 6) {
      fail("Enter the 6-digit code.");
      return;
    }
    if (passwordError) {
      fail(passwordError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { customer } = await resetRequest<{ customer: { email: string; name: string; sub: string } }>("confirm", {
        code: code.trim(),
        email: email.trim(),
        newPassword,
      });
      // The reset signs you in - the header and dashboard update straight away.
      setCustomer(customer);
      showToaster("Password reset - you're signed in");
      setDirection("forward");
      setStep("done");
      setTimeout(() => router.push("/account-info"), 1600);
    } catch (resetError) {
      fail(resetError instanceof Error ? resetError.message : "Couldn't reset your password.");
    } finally {
      setLoading(false);
    }
  };

  const shake = shakes ? (shakes % 2 ? "a" : "b") : undefined;

  return (
    <div className="avk-auth-page">
      <div className="avk-auth">
        {step === "reset" ? (
          <button
            aria-label="Back to email"
            className="avk-auth-close avk-auth-back"
            onClick={() => { setDirection("back"); setStep("request"); setError(""); }}
            type="button"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
        ) : null}

        <span className="avk-auth-badge">✦ Account recovery</span>
        {step !== "done" ? (
          <div
            aria-label={`Step ${step === "request" ? 1 : 2} of 2`}
            aria-valuemax={2}
            aria-valuemin={1}
            aria-valuenow={step === "request" ? 1 : 2}
            className="avk-auth-steps"
            data-step={step === "request" ? "email" : "password"}
            role="progressbar"
          >
            <span />
            <span />
          </div>
        ) : null}

        {step === "request" ? (
          <>
            <h1 className="avk-auth-title">Forgot your password?</h1>
            <p className="avk-auth-lead">No problem. Enter your email and we&apos;ll send you a code to reset it.</p>
            <form
              className="avk-auth-form"
              data-dir={direction}
              data-shake={shake}
              key="request"
              noValidate
              onSubmit={(event) => { event.preventDefault(); void handleSendCode(); }}
            >
              <label className="visually-hidden" htmlFor="forgot_page_email">Email</label>
              <input
                aria-invalid={Boolean(error) || undefined}
                autoComplete="email"
                className="avk-auth-input"
                id="forgot_page_email"
                inputMode="email"
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                placeholder="Email address"
                ref={emailInput}
                type="email"
                value={email}
              />
              {error ? <p className="avk-auth-error" role="alert">{error}</p> : null}
              <button aria-busy={loading || undefined} className="avk-auth-submit" disabled={loading || !email.trim()} type="submit">
                {loading ? <span aria-hidden="true" className="avk-auth-spinner" /> : null}
                {loading ? "Sending code…" : "Send code"}
              </button>
            </form>
          </>
        ) : null}

        {step === "reset" ? (
          <>
            <h1 className="avk-auth-title">Check your email</h1>
            <p className="avk-auth-lead">
              If <strong>{email.trim()}</strong> has an account, we&apos;ve emailed it a 6-digit code. It expires in 15 minutes.
            </p>
            <form
              className="avk-auth-form"
              data-dir={direction}
              data-shake={shake}
              key="reset"
              noValidate
              onSubmit={(event) => { event.preventDefault(); void handleResetPassword(); }}
            >
              <label className="visually-hidden" htmlFor="forgot_page_code">Verification code</label>
              <input
                aria-invalid={Boolean(error) || undefined}
                autoComplete="one-time-code"
                className="avk-auth-input avk-auth-otp"
                id="forgot_page_code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => { setCode(event.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="••••••"
                ref={codeInput}
                value={code}
              />
              <label className="visually-hidden" htmlFor="forgot_page_new_password">New password</label>
              <div className="avk-auth-password">
                <input
                  aria-describedby="forgot_page_rules"
                  autoComplete="new-password"
                  className="avk-auth-input"
                  id="forgot_page_new_password"
                  onChange={(event) => { setNewPassword(event.target.value); setError(""); }}
                  placeholder="New password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
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
              <ul className="avk-signup-rules" id="forgot_page_rules">
                {rules.map((rule) => <li data-ok={rule.ok || undefined} key={rule.label}>{rule.label}</li>)}
              </ul>
              {error ? <p className="avk-auth-error" role="alert">{error}</p> : null}
              <button aria-busy={loading || undefined} className="avk-auth-submit" disabled={loading || !passwordOk || code.length < 6} type="submit">
                {loading ? <span aria-hidden="true" className="avk-auth-spinner" /> : null}
                {loading ? "Updating…" : "Reset password"}
              </button>
              <p className="avk-auth-switch" style={{ margin: "4px 0 0" }}>
                Didn&apos;t get it?{" "}
                <button className="avk-auth-link" disabled={loading} onClick={() => void handleSendCode()} type="button">Resend code</button>
              </p>
            </form>
          </>
        ) : null}

        {step === "done" ? (
          <div className="avk-auth-done" role="status">
            <span aria-hidden="true" className="avk-auth-done-icon"><i className="fa-solid fa-check" /></span>
            <h1 className="avk-auth-title">Password updated</h1>
            <p className="avk-auth-lead" style={{ marginBottom: 0 }}>You&apos;re signed in with your new password. Taking you to your account…</p>
          </div>
        ) : null}

        {step !== "done" ? (
          <p className="avk-auth-switch">
            Remembered it?{" "}
            <ModalTriggerButton className="avk-auth-link" openModalName="signinModal">Sign in</ModalTriggerButton>
          </p>
        ) : null}
        <p className="avk-signup-terms">
          <Link href="/">Back to Avokarto</Link>
        </p>
      </div>
    </div>
  );
}
