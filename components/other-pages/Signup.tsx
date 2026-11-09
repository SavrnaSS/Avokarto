"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReviewSlider from "./ReviewSlider";
import { FormEvent, useState } from "react";
import {
  getPasswordStrength,
  getPasswordValidationError,
} from "@/lib/passwordValidation";
import PasswordStrengthIndicator from "@/components/common/forms/PasswordStrengthIndicator";
import { useCustomerSession } from "@/hooks/use-customer-session";

export default function Signup() {
  const router = useRouter();
  const setCustomer = useCustomerSession((state) => state.setCustomer);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const passwordStrength = getPasswordStrength(password);
  const passwordError = getPasswordValidationError(password, confirmPassword, {
    requireStrong: true,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordError) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/signup", {
        body: JSON.stringify({ email, name, password }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to create account.");
      }

      setCustomer(payload.customer);
      router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rbt-component-area rbt-section-gap2Bottom rbt-section-gap2Top">
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5 mx-auto">
            <div className="rbt-login-form">
              <div className="rbt-login-form-inner">
                <div className="rbt-login-form-top">
                  <div className="logo">
                    <Link href={`/`}>
                      <Image
                        alt="Avokarto logo"
                        src="/assets/images/logo/avokarto-logo-mark.webp"
                        width={512}
                        height={512}
                      />
                    </Link>
                  </div>
                  <h6 className="rbt-title rbt-text-bold mb--16">
                    Create an Account
                  </h6>
                  <div className="rbt-tab rbt-round-shape-tab">
                    <form onSubmit={handleSubmit}>
                      <div className="rbt-input-field-grp">
                        <label
                          className="rbt-field-label"
                          htmlFor="register_name"
                        >
                          Your Name
                          <span className="rbt-text-color-danger">*</span>
                        </label>
                        <input
                          autoComplete="name"
                          className="rbt-input-field"
                          type="text"
                          id="register_name"
                          onChange={(e) => setName(e.target.value)}
                          required
                          value={name}
                        />
                      </div>
                      <div className="rbt-input-field-grp mt--16">
                        <label
                          className="rbt-field-label"
                          htmlFor="register_email"
                        >
                          Your Email
                          <span className="rbt-text-color-danger">*</span>
                        </label>
                        <input
                          autoComplete="email"
                          className="rbt-input-field"
                          type="email"
                          id="register_email"
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          value={email}
                        />
                      </div>
                      <div className="rbt-input-field-grp mt--16">
                        <label
                          className="rbt-field-label"
                          htmlFor="register_password"
                        >
                          Password
                          <span className="rbt-text-color-danger">*</span>
                        </label>
                        <input
                          autoComplete="new-password"
                          className="rbt-input-field"
                          type="password"
                          id="register_password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="rbt-input-field-grp mt--16">
                        <label
                          className="rbt-field-label"
                          htmlFor="register_confirm_password"
                        >
                          Confirm Password
                          <span className="rbt-text-color-danger">*</span>
                        </label>
                        <input
                          autoComplete="new-password"
                          className="rbt-input-field"
                          type="password"
                          id="register_confirm_password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      {passwordError && (
                        <p className="rbt-form-error mt--8 mb--0">
                          {passwordError}
                        </p>
                      )}
                      {password.length > 0 && (
                        <PasswordStrengthIndicator
                          label={passwordStrength.label}
                          hint={`Password Strength: ${passwordStrength.label}`}
                        />
                      )}
                      {error ? (
                        <p className="rbt-form-error mt--8 mb--0">{error}</p>
                      ) : null}
                      <button
                        type="submit"
                        className="rbt-btn d-block w-100 mt--24 mb--16"
                        disabled={
                          submitting ||
                          Boolean(passwordError) ||
                          !name ||
                          !email ||
                          !password ||
                          !confirmPassword
                        }
                      >
                        {submitting ? "Creating account..." : "Continue"}
                      </button>
                    </form>
                  </div>
                  {/* Separator */}
                  <div className="d-flex align-items-center justify-content-center mb--24 mt--24">
                    <hr className="rbt-separator rbt-bg-color-gray-light mb--0" />
                    <span className="pl--8 pr--8 b4 rbt-text-medium">OR</span>
                    <hr className="rbt-separator rbt-bg-color-gray-light mb--0" />
                  </div>
                  {/* Social login is not wired to a real provider yet - kept
                      as a visual placeholder, not a functional path. */}
                  <button
                    type="button"
                    className="rbt-btn rbt-btn-border rbt-social-login-btn d-block w-100 mb--16 rbt-social-login-btn"
                  >
                    <Image
                      className="icon"
                      alt="Icon"
                      src="/assets/images/icons/fb-icon.webp"
                      width={37}
                      height={36}
                    />
                    Continue with Facebook
                  </button>
                  <button
                    type="button"
                    className="rbt-btn rbt-btn-border rbt-social-login-btn d-block w-100 rbt-social-login-btn"
                  >
                    <Image
                      className="icon"
                      alt="Icon"
                      src="/assets/images/icons/google-icon.webp"
                      width={36}
                      height={36}
                    />
                    Continue with Google
                  </button>
                  {/* End social login button */}
                  <div className="rbt-login-system-switch rbt-link-hover">
                    Already a customer?{" "}
                    <Link className="rbt-switch-btn ml--4" href={`/signin`}>
                      <span>Sign In</span>
                    </Link>
                  </div>
                </div>
                {/* Start slider */}
                <ReviewSlider />

                {/* End slider */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
