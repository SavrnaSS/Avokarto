"use client";

import { GridMatrixIcon, WaveSquareIcon } from "../../svg-icons";
import Image from "next/image";
import AddReviewForm from "./AddReviewForm";
import { parseProductSpecifications } from "@/lib/productSpecifications";
import { useState } from "react";
import { useProductReviews } from "@/hooks/use-product-reviews";
import { Product } from "@/types";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";
import { useTranslation } from "@/lib/i18n/translations";

export default function DescriptionTab1({
  parentClass = "rbt-tab rbt-product-single-details-tab rbt-fshape-tab",
  product,
}: {
  parentClass?: string;
  product?: Product;
}) {
  const [activeTab, setActiveTab] = useState<
    "description" | "specification" | "reviews" | "question"
  >("description");
  const { loading: reviewsLoading, refresh: refreshReviews, summary } =
    useProductReviews(product?.catalogId ?? product?.id);
  const { t } = useTranslation();

  return (
    <>
      <div className={parentClass}>
        <div className="rbt-tab-nav-wrapper">
          <ul
            className="nav nav-tabs"
            id="rbt-single-productTab"
            role="tablist"
          >
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link${activeTab === "description" ? " active" : ""}`}
                onClick={() => {
                  setActiveTab("description");
                }}
              >
                {t("Description")}
                <span className="rbt-fshape-portion rbt-fshape-left-portion">
                  <GridMatrixIcon />
                </span>
                <span className="rbt-fshape-portion rbt-fshape-right-portion">
                  <WaveSquareIcon />
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link${activeTab === "specification" ? " active" : ""}`}
                onClick={() => {
                  setActiveTab("specification");
                }}
              >
                {t("Specification")}
                <span className="rbt-fshape-portion rbt-fshape-left-portion">
                  <GridMatrixIcon />
                </span>
                <span className="rbt-fshape-portion rbt-fshape-right-portion">
                  <WaveSquareIcon />
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link${activeTab === "reviews" ? " active" : ""}`}
                onClick={() => {
                  setActiveTab("reviews");
                }}
              >
                {t("Reviews")}
                <span className="rbt-fshape-portion rbt-fshape-left-portion">
                  <GridMatrixIcon />
                </span>
                <span className="rbt-fshape-portion rbt-fshape-right-portion">
                  <WaveSquareIcon />
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link${activeTab === "question" ? " active" : ""}`}
                onClick={() => {
                  setActiveTab("question");
                }}
              >
                {t("Questions")}
                <span className="rbt-fshape-portion rbt-fshape-left-portion">
                  <GridMatrixIcon />
                </span>
                <span className="rbt-fshape-portion rbt-fshape-right-portion">
                  <WaveSquareIcon />
                </span>
              </button>
            </li>
          </ul>
        </div>
        <div className="tab-content">
          {activeTab === "description" && (
            <div className="tab-pane fade active show">
              <div className="rbt-product-single-description">
                {product?.shortSummary ? (
                  <h6 className="rbt-block-title mb--0">
                    {product.shortSummary}
                  </h6>
                ) : null}
                {product?.shortSummaryImage ? (
                  product.shortSummaryImageWidth && product.shortSummaryImageHeight ? (
                    // Real width/height captured at upload time, so the
                    // image renders at its true aspect ratio (no cropping)
                    // and just scales down responsively within the cap.
                    <div className="rbt-block-banner-img mt--24" style={{ maxWidth: 360 }}>
                      <Image
                        alt={product.shortSummary || product.title || "Product image"}
                        src={product.shortSummaryImage}
                        width={product.shortSummaryImageWidth}
                        height={product.shortSummaryImageHeight}
                        sizes="360px"
                        style={{ borderRadius: 12, height: "auto", width: "100%" }}
                      />
                    </div>
                  ) : (
                    // Legacy rows saved before dimensions were captured -
                    // still show the full image (never crop), just
                    // letterboxed inside a capped box instead of stretched.
                    <div
                      className="rbt-block-banner-img mt--24 position-relative"
                      style={{ aspectRatio: "4 / 3", maxWidth: 360 }}
                    >
                      <Image
                        alt={product.shortSummary || product.title || "Product image"}
                        src={product.shortSummaryImage}
                        fill
                        sizes="360px"
                        style={{ borderRadius: 12, objectFit: "contain" }}
                      />
                    </div>
                  )
                ) : null}
                {product?.description ? (
                  <p
                    className="rbt-block-desc b1 mb--0 mt--12"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {product.description}
                  </p>
                ) : null}
                {!product?.shortSummary && !product?.description ? (
                  <p className="rbt-block-desc b1 mb--0">
                    {t("No description added yet.")}
                  </p>
                ) : null}
                {product?.keyHighlights && product.keyHighlights.length > 0 ? (
                  <div className="rbt-prd-feature-area mt--32">
                    <div className="row row--12 mt_dec--24 rbt-mobile-row">
                      {product.keyHighlights.map((highlight, index) => (
                        <div
                          className="col-lg-4 col-md-4 col-sm-6 col-12 mt--24"
                          key={index}
                        >
                          <div className="rbt-prd-feature-card rbt-bg-color-brand-50 rbt-curved-style-box">
                            <div className="rbt-inner text-center">
                              <span className="icon">
                                <i className="fa-sharp fa-regular fa-circle-check" />
                              </span>
                              <p className="title b1">{highlight}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {activeTab === "specification" && (
            <div className="tab-pane fade active show">
              <div className="rbt-prd-single-specification-info">
                {parseProductSpecifications(product?.specifications).length === 0 ? (
                  <p className="b1 mb--0">{t("No specifications added yet.")}</p>
                ) : null}
                {parseProductSpecifications(product?.specifications).map(
                  (spec, index: number) => (
                    <div className="rbt-single-specification" key={index}>
                      <label className="b1 title">{spec.label}</label>
                      <div className="rbt-specification-content">
                        <span className="desc">{spec.value}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="tab-pane fade active show">
              {reviewsLoading ? (
                <LoadingSkeleton layout="table" count={4} label="Loading reviews" />
              ) : (
                <>
                  <div className="rbt-product-single-reviews-area">
                    <div className="rbt-review-statistics-section">
                      <div className="row row--12 mt_dec--24">
                        <div className="col-md-6 mt--24">
                          <div className="rbt-avr-review">
                            <span className="rbt-abr-review-number-text">
                              {summary.average.toFixed(2)}
                            </span>
                            <div className="rbt-abr-review-content">
                              <ul className="rbt-rating-icon-list">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <li key={star}>
                                    <i
                                      className={`fa-solid fa-star${
                                        star <= Math.round(summary.average)
                                          ? " rbt-rated-icon"
                                          : ""
                                      }`}
                                    />
                                  </li>
                                ))}
                              </ul>
                              <p className="rating-text b3 mt--8 rbt-text-color-gray-700">
                                {t("Based on")} {summary.total}{" "}
                                {t(summary.total === 1 ? "Review" : "Reviews")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mt--24">
                          <div className="rbt-rating-breakdown">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count =
                                summary.breakdown[star as 1 | 2 | 3 | 4 | 5];
                              const percent = summary.total
                                ? Math.round((count / summary.total) * 100)
                                : 0;
                              return (
                                <div className="rbt-rating-item" key={star}>
                                  <span className="icon">
                                    <i className="fa-solid fa-star rbt-rated-icon" />
                                  </span>
                                  <span className="number-text">{star}</span>
                                  <div
                                    className="progress"
                                    role="progressbar"
                                    aria-label={`${star} star reviews`}
                                    aria-valuenow={percent}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                  >
                                    <div
                                      className="progress-bar"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="number-text">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rbt-prd-single-reviews-list-area">
                    {summary.reviews.length === 0 ? (
                      <p className="b1 mb--0">
                        {t("Be the first to review this product.")}
                      </p>
                    ) : (
                      <ul className="rbt-comment-list">
                        {summary.reviews.map((review) => (
                          <li className="comment" key={review.id}>
                            <div className="comment-body">
                              <div className="single-comment">
                                <div className="comment-inner">
                                  <ul className="rbt-rating-icon-list">
                                    {[...Array(5)].map((_, i) => (
                                      <li key={i}>
                                        <i
                                          className={`fa-solid fa-star${i < review.rating ? " rbt-rated-icon" : ""}`}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="comment-meta">
                                    <div className="time-spent">
                                      {review.customerName} &middot;{" "}
                                      {review.createdAt}
                                    </div>
                                  </div>
                                  <div className="comment-text">
                                    <p className="b1">{review.review}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
              <AddReviewForm product={product} onSubmitted={refreshReviews} />
            </div>
          )}
          {activeTab === "question" && (
            <div className="tab-pane fade active show">
              <div className="rbt-prd-single-faq-section">
                <div className="rbt-section-title-area rbt-bg-color-gray-light">
                  <h6 className="rbt-block-title mb--0">
                    {t("Frequently Asked Questions? Look here")}
                  </h6>
                </div>
                <div className="rbt-accordion-style rbt-accordion-01 accordion">
                  <div className="accordion" id="accordionExampleb4">
                    {(product?.faqs?.length ?? 0) === 0 ? (
                      <p className="b1 mb--0">
                        {t("No questions yet for this product.")}
                      </p>
                    ) : null}
                    {product?.faqs?.map((faq, index) => {
                      const faqId = `product-faq-${index}`;
                      return (
                        <div className="accordion-item card" key={faqId}>
                          <h2
                            className="accordion-header card-header"
                            id={`heading${index}`}
                          >
                            <button
                              className={`accordion-button${index !== 0 ? " collapsed" : ""}`}
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#${faqId}`}
                              aria-expanded={index === 0 ? "true" : "false"}
                              aria-controls={faqId}
                            >
                              {faq.question}
                            </button>
                          </h2>
                          <div
                            id={faqId}
                            className={`accordion-collapse collapse${index === 0 ? " show" : ""}`}
                            aria-labelledby={`heading${index}`}
                            data-bs-parent="#accordionExampleb4"
                          >
                            <div className="accordion-body card-body">
                              {faq.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
