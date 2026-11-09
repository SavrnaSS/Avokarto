"use client";
import { CloseIcon } from "../svg-icons";
import { FormEvent, useState } from "react";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import type { CustomerProfile } from "@/hooks/use-customer-profile";

export default function ContactInfoEdit({
  profile,
  onSaved,
}: {
  profile: CustomerProfile | null;
  onSaved: () => void;
}) {
  const { close } = useManagedModalPanel("contactInfoEditModal");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/profile", {
        body: JSON.stringify({ email, phone }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error?.message ?? "Unable to save contact info.",
        );
      }

      onSaved();
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save contact info.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="contactInfoEditModal"
      tabIndex={-1}
      aria-labelledby="contactInfoEditModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered rbt-cart-edit-area">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <CloseIcon />
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              aria-label="Close"
              onClick={close}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-top-folder-shape-wrapper">
            {/* Start Component Area */}
            <div className="rbt-single-product-area rbt-bg-color-white rbt-content-trs-portion">
              <h5 className="rbt-title rbt-modal-title mb--24">
                Change contact information
              </h5>
              <form onSubmit={handleSubmit}>
                <div className="row row--12 mt_dec--24">
                  <div className="col-md-6 mt--24">
                    <label htmlFor="edit_email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="edit_email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="phone_number" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone_number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {error ? (
                    <div className="col-12">
                      <p className="rbt-form-error mb--0">{error}</p>
                    </div>
                  ) : null}
                  <div className="col-12">
                    <div className="d-flex rbt-gap--16">
                      <button
                        type="button"
                        className="rbt-btn rbt-btn-secondary rbt-btn-md rbt-square-btn mt--24"
                        aria-label="Close"
                        onClick={close}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rbt-btn rbt-btn-md rbt-square-btn mt--24"
                        disabled={submitting}
                      >
                        {submitting ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* End Component Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
