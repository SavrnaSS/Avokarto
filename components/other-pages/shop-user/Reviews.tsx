"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import DropdownSelect from "@/components/common/select/DropdownSelect";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import ReviewModal from "@/components/modals/ReviewModal";
import SingleManagedModalLayer from "@/components/common/modals/SingleManagedModalLayer";
import { ModalName } from "@/types/modal";
import { useCustomerReviews } from "@/hooks/use-customer-reviews";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useReviewTarget } from "@/hooks/use-review-target";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";

export default function Reviews() {
  const customer = useCustomerSession((state) => state.customer);
  const sessionLoading = useCustomerSession((state) => state.loading);
  const { error, loading, products, refresh } = useCustomerReviews();
  const setTarget = useReviewTarget((state) => state.setTarget);
  const reviewFilterOptions = [
    "Products and reviews",
    "My Reviews",
    "Products awaiting reviews",
  ];
  const [selectedReviewFilter, setSelectedReviewFilter] = useState(
    "Products and reviews",
  );

  const visibleProducts = useMemo(() => {
    if (selectedReviewFilter === "My Reviews") {
      return products.filter((product) => product.rating !== null);
    }

    if (selectedReviewFilter === "Products awaiting reviews") {
      return products.filter((product) => product.rating === null);
    }

    return products;
  }, [products, selectedReviewFilter]);

  function openReviewModal(product: (typeof products)[number]) {
    setTarget({
      existingRating: product.rating,
      existingReview: product.review,
      imageUrl: product.imageUrl,
      productId: product.productId,
      productName: product.productName,
      unitPrice: product.unitPrice,
    });
  }

  if (!sessionLoading && !customer) {
    return (
      <div className="rbt-profile-content-area">
        <div className="rbt-component-section-title rbt-gap--4 mb--0 p-0 border-0">
          <h2 className="rbt-title mb--0">
            <span className="rbt-text-bold">My Reviews</span>
          </h2>
        </div>
        <hr className="mt--24" />
        <p>
          Sign in to view and manage your reviews.{" "}
          <ModalTriggerButton
            className="rbt-switch-btn"
            openModalName="signinModal"
          >
            Sign In
          </ModalTriggerButton>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rbt-profile-content-area">
        <div className="row row--12 mt_dec--24">
          <div className="col-12 col-md-7 col-xl-8 mt--24">
            <div className="rbt-component-section-title rbt-gap--4 mb--0 p-0 border-0">
              <h2 className="rbt-title mb--0">
                <span className="rbt-text-bold">My Reviews</span>
              </h2>
            </div>
          </div>
          <div className="col-12 col-md-5 col-xl-4 mt--24">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="rbt-input-field-grp mb--0">
                <div className="rbt-dropdown-select filter-select rbt-modern-select w-100 rbt-bordered-style search-by-category">
                  <DropdownSelect
                    options={reviewFilterOptions}
                    selected={selectedReviewFilter}
                    onChange={setSelectedReviewFilter}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
        <hr className="mt--24" />
        {error ? <p className="rbt-form-error mb--0">{error}</p> : null}
        {loading || sessionLoading ? (
          <LoadingSkeleton layout="table" count={4} label="Loading your reviews" />
        ) : visibleProducts.length === 0 ? (
          <p className="mt--16">
            {products.length === 0
              ? "Products you've purchased will show up here once your order is placed."
              : "Nothing matches this filter."}
          </p>
        ) : (
          <div className="rbt-scrollable-content hide-scrollbar">
            <div className="rbt-transparent-table-one-wrapper pt--0 pb--0 mb--0">
              <table className="rbt-transparent-table-one rbt-wishlist-table mb--0">
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product.productId}>
                      <td className="product-thumbnail">
                        <Image
                          alt={product.productName}
                          src={product.imageUrl}
                          width={93}
                          height={93}
                        />
                      </td>
                      <td className="rbt-wish-product-info">
                        <h6 className="rbt-wish-product-name">
                          {product.productName}
                        </h6>
                        <div className="rbt-product-price-text rbt-text-color-primary">
                          <span>${product.unitPrice.toFixed(2)}</span>
                        </div>
                        <span className="rbt-product-id">
                          <span className="rbt-text-semi-bold">SKU:</span>
                          {product.sku}
                        </span>
                      </td>
                      <td>
                        {product.rating !== null && product.status === "pending" ? (
                          <span className="rbt-badge rbt-badge-bg-warning rbt-badge-border rbt-badge-md rbt-badge-rounded">
                            Awaiting approval
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {product.rating === null ? (
                          <div className="rbt-button-group">
                            <ModalTriggerButton
                              openModalName={ModalName.leaveReviewModal}
                              className="rbt-btn rbt-btn-sm rbt-btn-secondary"
                              onClick={() => openReviewModal(product)}
                            >
                              Leave a review
                            </ModalTriggerButton>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="rbt-order-sum-area rbt-order-sum-area-xm d-flex border-0 bg-transparent"
                            onClick={() => openReviewModal(product)}
                          >
                            <span className="d-flex rbt-gap--16 align-items-center ms-auto">
                              <ul className="rbt-rating-icon-list">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <li key={index}>
                                    <i
                                      className={
                                        index < (product.rating ?? 0)
                                          ? "fa-solid fa-star rbt-rated-icon"
                                          : "fa-solid fa-star"
                                      }
                                    />
                                  </li>
                                ))}
                              </ul>
                              <span className="ordered-item more-icon">
                                <i className="fa-regular fa-pen-to-square" />
                              </span>
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <SingleManagedModalLayer modalName={ModalName.leaveReviewModal}>
        <ReviewModal onSaved={refresh} />
      </SingleManagedModalLayer>
    </>
  );
}
