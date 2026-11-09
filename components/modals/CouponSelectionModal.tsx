"use client";

import Tooltip from "@/components/common/ui/Tooltip";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";

export default function CouponSelectionModal() {
  const { registerInputRef, getTooltip, copyFromRef, isCopied } =
    useCopyToClipboard({ defaultTooltip: "Copy" });

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="couponSelectionModal"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a coupon"
    >
      <div className="modal-dialog rbt-coupon-modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={85}
              height={90}
              viewBox="0 0 85 90"
              fill="none"
            >
              <path
                d="M0 0H11.1844C14.5695 0 17.7971 1.42971 20.0716 3.93671L82.1927 72.4059C83.9992 74.397 84.9999 76.9893 84.9999 79.6778C84.9999 85.6547 85.0001 90 85.0001 90H0V0Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-top-folder-shape-wrapper">
            <div className="rbt-bg-color-white rbt-content-trs-portion">
              <h6 className="rbt-title rbt-text-bold">
                <span className="mr--4">
                  <i className="fa-regular fa-ticket" />
                </span>
                Select or input Coupon
              </h6>
              <div className="rbt-coupon-wrapper rbt-bg-color-white">
                <div className="rbt-coupon">
                  <div className="inner rbt-text-copy-activation">
                    <div className="left-part">
                      <input
                        ref={registerInputRef(0)}
                        type="text"
                        defaultValue="WELCOME100"
                        readOnly
                        className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                      />
                    </div>
                    <div className="coupon-details">
                      <h2 className="rbt-coupon-info-title b1">UP TO 30% OFF</h2>
                      <p className="rbt-coupon-info-sub-title b3 mt--4">
                        For orders over $9.90
                      </p>
                      <ul className="rbt-coupon-info-list mt--12">
                        <li>
                          <span>12/18/2023 14:00 ~ 12/25/2023 14:00</span>
                        </li>
                        <li>
                          <span>
                            The minimum spend for this coupon
                            <strong>$200.00</strong>
                          </span>
                        </li>
                      </ul>
                    </div>
                    <Tooltip content={getTooltip(0)} forceOpen={isCopied(0)}>
                      <button
                        type="button"
                        className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn"
                        onClick={() => void copyFromRef(0)}
                      >
                        <i className="fa-sharp fa-regular fa-copy" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="rbt-coupon">
                  <div className="inner rbt-text-copy-activation">
                    <div className="left-part">
                      <input
                        ref={registerInputRef(1)}
                        type="text"
                        defaultValue="WELCOME100"
                        readOnly
                        className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                      />
                    </div>
                    <div className="coupon-details">
                      <h2 className="rbt-coupon-info-title b1">UP TO 30% OFF</h2>
                      <p className="rbt-coupon-info-sub-title b3 mt--4">
                        For orders over $9.90
                      </p>
                      <ul className="rbt-coupon-info-list mt--12">
                        <li>
                          <span>12/18/2023 14:00 ~ 12/25/2023 14:00</span>
                        </li>
                        <li>
                          <span>
                            The minimum spend for this coupon
                            <strong>$200.00</strong>
                          </span>
                        </li>
                      </ul>
                    </div>
                    <Tooltip content={getTooltip(1)} forceOpen={isCopied(1)}>
                      <button
                        type="button"
                        className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn"
                        onClick={() => void copyFromRef(1)}
                      >
                        <i className="fa-sharp fa-regular fa-copy" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <form>
                <div className="rbt-input-field-grp mt--24">
                  <p className="b1 mb--12 rbt-text-color-gray-600">
                    If you have coupon code, please apply it below.
                  </p>
                  <input type="text" placeholder="Coupon code" />
                </div>
                <div className="rbt-btn-group mt--16">
                  <button className="rbt-btn rbt-btn-md rbt-btn-primary d-block w-100">
                    Apply
                  </button>
                  <button
                    className="rbt-btn rbt-btn-md rbt-btn-naked d-block w-100 mt--8 mb--8 rbt-popup-close-btn"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
