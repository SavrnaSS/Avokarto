"use client";

import { useState } from "react";
import { WaveLongIcon } from "../../svg-icons";

export default function ContactForm() {
  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const formData = new FormData(form);
      const response = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          message: formData.get("message"),
          company: formData.get("company"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      form.reset();
      setValidated(false);
      setSubmitSuccess(true);
    } catch {
      setSubmitError("Could not send your message. Please try again.");
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rbt-contact-form needs-validation ${validated ? "was-validated" : ""}`}
      noValidate
    >
      <div className="rbt-fshape-box-outline-style">
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-component-section-title rbt-contact-form-title rbt-bg-color-white rbt-border-color-gray-100">
              <h6 className="rbt-title h6">
                <span className="rbt-bold--text">Get in Touch</span>
              </h6>
              <span className="rbt-fshape-right-portion">
                <WaveLongIcon />
              </span>
            </div>
          </div>
        </div>
        <div className="rbt-fshape-box rbt-bg-color-white rbt-contact-form-fshape rbt-border-color-gray-100">
          <div className="row">
            <div className="col-md-6 col-12 mb--16">
              <div className="rbt-input-field-grp form-group">
                <label htmlFor="f_name">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  className="rbt-contact-input-field form-control"
                  type="text"
                  id="f_name"
                  name="firstName"
                  required
                />
                <div className="invalid-feedback">
                  Please enter your first name.
                </div>
              </div>
            </div>
            <div className="col-md-6 col-12 mb--16">
              <div className="rbt-input-field-grp form-group">
                <label htmlFor="l_name">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  className="rbt-contact-input-field form-control"
                  type="text"
                  id="l_name"
                  name="lastName"
                  required
                />
                <div className="invalid-feedback">
                  Please enter your last name.
                </div>
              </div>
            </div>
            <div className="col-md-6 col-12 mb--16">
              <div className="rbt-input-field-grp form-group">
                <label htmlFor="email">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  className="rbt-contact-input-field form-control"
                  type="email"
                  id="email"
                  name="email"
                  required
                />
                <div className="invalid-feedback">
                  Please enter a valid email address.
                </div>
              </div>
            </div>
            <div className="col-md-6 col-12 mb--16">
              <div className="rbt-input-field-grp form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  className="rbt-contact-input-field form-control"
                  type="tel"
                  id="phone"
                  name="phone"
                />
              </div>
            </div>
            <div className="col-12 mb--16">
              <div className="rbt-input-field-grp form-group">
                <label htmlFor="message">
                  Your Message <span className="text-danger">*</span>
                </label>
                <textarea
                  className="rbt-contact-input-field form-control"
                  name="message"
                  id="message"
                  rows={6}
                  required
                  defaultValue={""}
                />
                <div className="invalid-feedback">
                  Please enter your message.
                </div>
              </div>
            </div>
            {/* Honeypot - hidden from real visitors via CSS, so only bots
                that blindly fill every field trip it (see lib/backend/contact.ts). */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
            <div className="col-12 d-block mt--0">
              {submitSuccess && (
                <div className="alert alert-success py-2 mb--16" role="status">
                  Message sent successfully.
                </div>
              )}
              {submitError && (
                <div className="alert alert-danger py-2 mb--16" role="alert">
                  {submitError}
                </div>
              )}
              <button
                name="submit"
                type="submit"
                id="submit"
                className="rbt-btn rbt-btn-md d-block text-center w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
