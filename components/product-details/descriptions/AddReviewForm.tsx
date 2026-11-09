"use client";

import { useState, type FormEvent } from "react";
import { WaveThinIcon } from "../../svg-icons";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import StarRatingInput from "@/components/common/ui/StarRatingInput";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { Product } from "@/types";

export default function AddReviewForm({
  onSubmitted,
  product,
}: {
  onSubmitted?: () => void;
  product?: Product;
}) {
  const customer = useCustomerSession((state) => state.customer);
  const sessionLoading = useCustomerSession((state) => state.loading);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (sessionLoading) {
    return null;
  }

  if (!customer) {
    return (
      <div className="rbt-reviews-form">
        <p className="b1 mb--0">
          <ModalTriggerButton
            className="rbt-switch-btn"
            openModalName="signinModal"
          >
            Sign in
          </ModalTriggerButton>{" "}
          to leave a review for this product.
        </p>
      </div>
    );
  }

  const catalogId = product?.catalogId;

  if (!catalogId) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!catalogId || rating < 1) {
      setError("Pick a star rating before submitting.");
      return;
    }

    if (!reviewText.trim()) {
      setError("Write a few words about the product before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/reviews", {
        body: JSON.stringify({
          productId: catalogId,
          rating,
          review: reviewText.trim(),
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to submit review.");
      }

      setSubmitted(true);
      setReviewText("");
      setRating(0);
      onSubmitted?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rbt-reviews-form">
      <form onSubmit={handleSubmit} className="rbt-contact-form">
        <div className="rbt-fshape-box-outline-style">
          <div className="row">
            <div className="col-lg-12">
              <div className="rbt-component-section-title rbt-contact-form-title rbt-bg-color-white">
                <h6 className="rbt-title">
                  <span className="rbt-bold--text">Add A Review</span>
                </h6>
                <span className="rbt-fshape-right-portion">
                  <WaveThinIcon />
                </span>
              </div>
            </div>
          </div>
          <div className="rbt-fshape-box rbt-bg-color-white rbt-contact-form-fshape">
            <div className="row">
              <div className="col-12 mb--16">
                <div className="rbt-contact-input-field-grp">
                  <StarRatingInput value={rating} onChange={setRating} size={28} />
                </div>
              </div>
              <div className="col-12 mb--16">
                <div className="rbt-contact-input-field-grp">
                  <label htmlFor="review-message">Your review</label>
                  <textarea
                    className="rbt-contact-input-field"
                    name="message"
                    id="review-message"
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="What did you think of this product?"
                    required
                  />
                </div>
              </div>
              {error ? (
                <div className="col-12">
                  <p className="rbt-form-error mb--0">{error}</p>
                </div>
              ) : null}
              {submitted ? (
                <div className="col-12">
                  <p className="b1 mb--0 rbt-text-color-primary">
                    Thanks! Your review is awaiting approval and will appear
                    here once published.
                  </p>
                </div>
              ) : null}
              <div className="d-flex justify-content-md-end mt--8 rbt-gap--12 flex-wrap">
                <button
                  type="submit"
                  className="rbt-btn rbt-btn-md"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
