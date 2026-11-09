"use client";

import Tooltip from "@/components/common/ui/Tooltip";
import { cartCoupons } from "@/data/cartData";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";

type CartCouponPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CartCouponPopup({
  isOpen,
  onClose,
}: CartCouponPopupProps) {
  const { registerInputRef, getTooltip, copyFromRef, isCopied } =
    useCopyToClipboard({ defaultTooltip: "Copy" });

  return (
    <div
      id="cart-coupon-popup"
      className="rbt-offcanvas-inner-popup"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`rbt-offcanvas-inner-popup-card coupon-popup ${
          isOpen ? "open-coupon-popup" : ""
        }`}
      >
        <div className="rbt-offcanvas-card-inner">
          <h6 className="rbt-title rbt-text-bold">
            <span className="mr--4">
              <i className="fa-regular fa-ticket" />
            </span>
            Select or input Coupon
          </h6>
          <div className="rbt-coupon-wrapper rbt-bg-color-white">
            {cartCoupons.map((coupon) => (
              <div key={coupon.id} className="rbt-coupon">
                <div className="inner rbt-text-copy-activation">
                  <div className="left-part">
                    <input
                      ref={registerInputRef(coupon.id)}
                      type="text"
                      defaultValue={coupon.code}
                      readOnly
                      className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                    />
                  </div>
                  <div className="coupon-details">
                    <h2 className="rbt-coupon-info-title b1">{coupon.title}</h2>
                    <p className="rbt-coupon-info-sub-title b3 mt--4">
                      {coupon.subtitle}
                    </p>
                    <ul className="rbt-coupon-info-list mt--12">
                      <li>
                        <span>{coupon.validity}</span>
                      </li>
                      <li>
                        <span>
                          The minimum spend for this coupon
                          <strong>{coupon.minSpend}</strong>
                        </span>
                      </li>
                    </ul>
                  </div>
                  <Tooltip
                    content={getTooltip(coupon.id)}
                    placement="top"
                    forceOpen={isCopied(coupon.id)}
                  >
                    <button
                      type="button"
                      className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn"
                      onClick={() => void copyFromRef(coupon.id)}
                    >
                      <i className="fa-sharp fa-regular fa-copy" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="rbt-input-field-grp mt--24">
              <p className="b1 mb--12 rbt-text-color-gray-600">
                If you have coupon code, please apply it below.
              </p>
              <input type="text" placeholder="Coupon code" />
            </div>
            <div className="rbt-btn-group mt--16">
              <button
                type="submit"
                className="rbt-btn rbt-btn-md rbt-btn-primary d-block w-100"
              >
                Apply
              </button>
              <button
                type="button"
                className="rbt-btn rbt-btn-md rbt-btn-naked d-block w-100 mt--8 mb--8 rbt-popup-close-btn"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
