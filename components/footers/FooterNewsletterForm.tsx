"use client";

import { FormEvent, useState } from "react";
import { useUiElement } from "@/context/uiStore";

interface FooterNewsletterFormProps {
  formClass?: string;
  inputClass?: string;
  btnClass?: string;
  iconClass?: string;
  placeholder?: string;
}

export default function FooterNewsletterForm({
  formClass = "rbt-newsletter-form-one rbt-newsletter-form-one-v1 mt--24",
  inputClass = "",
  btnClass = "rbt-btn rbt-btn-md radius-round-6",
  iconClass = "icon",
  placeholder = "Enter email",
}: FooterNewsletterFormProps) {
  const { showToaster } = useUiElement();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToaster("Please enter your email address");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!isValidEmail) {
      showToaster("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        body: JSON.stringify({ email: trimmedEmail, source: "footer" }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setEmail("");
      showToaster("Thanks for subscribing to our newsletter");
    } catch {
      showToaster("Could not subscribe right now. Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={formClass} onSubmit={handleSubmit}>
      <input
        className={inputClass}
        name="email"
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button type="submit" className={btnClass} disabled={isSubmitting}>
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </button>
      <div className={iconClass}>
        <i className="fa-regular fa-envelope" />
      </div>
    </form>
  );
}
