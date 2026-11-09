"use client";
import { CloseIcon } from "../svg-icons";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useReviewTarget } from "@/hooks/use-review-target";
import StarRatingInput from "@/components/common/ui/StarRatingInput";

export default function ReviewModal({ onSaved }: { onSaved: () => void }) {
  const { close } = useManagedModalPanel("leaveReviewModal");
  const customer = useCustomerSession((state) => state.customer);
  const target = useReviewTarget((state) => state.target);
  const [rating, setRating] = useState(target?.existingRating ?? 0);
  const [reviewText, setReviewText] = useState(target?.existingReview ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // The modal is a single global instance re-used for every product, so its
  // rating/text need to reset to whatever the newly-selected target has
  // whenever that target changes (adjusted during render, not an effect,
  // per React's guidance for state derived from a prop/store value).
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  if (target && target.productId !== syncedFor) {
    setSyncedFor(target.productId);
    setRating(target.existingRating ?? 0);
    setReviewText(target.existingReview ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!target || rating < 1) {
      setError("Pick a star rating before saving.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/reviews", {
        body: JSON.stringify({
          productId: target.productId,
          rating,
          review: reviewText,
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to save review.");
      }

      onSaved();
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="leaveReviewModal"
    >
      <div className="modal-dialog rbt-register-form-modal modal-dialog-centered">
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
                Leave a review for:
              </h5>
              {target ? (
                <ul className="rbt-minicart-wrapper pt--0">
                  <li className="minicart-item">
                    <div className="thumbnail transparent-verticle-thumbnail">
                      <Image
                        alt={target.productName}
                        src={target.imageUrl}
                        width={93}
                        height={93}
                      />
                    </div>
                    <div className="product-content">
                      <h6 className="rbt-title mb--8 b2">
                        {target.productName}
                      </h6>
                      <span className="quantity">
                        <span className="price">
                          ${target.unitPrice.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </li>
                </ul>
              ) : null}
              <hr />
              <form onSubmit={handleSubmit}>
                <div className="row row--12 mt_dec--24">
                  <div className="col-12 mt--24">
                    <label htmlFor="full_name" className="form-label">
                      Your name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      value={customer?.name ?? ""}
                      readOnly
                    />
                  </div>
                  <div className="col-12 mt--24">
                    <span className="form-label d-block">Rating</span>
                    <StarRatingInput value={rating} onChange={setRating} size={26} />
                  </div>
                  <div className="col-12 mt--24">
                    <label htmlFor="review_area" className="form-label">
                      Review
                    </label>
                    <textarea
                      id="review_area"
                      rows={5}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your opinion..."
                      required
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
                        className="rbt-btn rbt-btn-secondary rbt-btn-md rbt-square-btn w-100 mt--24"
                        aria-label="Close"
                        onClick={close}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rbt-btn rbt-btn-md rbt-square-btn w-100 mt--24"
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
