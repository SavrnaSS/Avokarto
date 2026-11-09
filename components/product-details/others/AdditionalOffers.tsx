"use client";

import { Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Tooltip from "@/components/common/ui/Tooltip";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import { useLiveCoupons } from "@/hooks/use-live-coupons";
import type { PublicCoupon } from "@/lib/backend/storefront-data";

function couponValidity(coupon: PublicCoupon) {
  if (coupon.startsAt && coupon.endsAt) {
    return `${coupon.startsAt} - ${coupon.endsAt}`;
  }

  if (coupon.endsAt) {
    return `Ends ${coupon.endsAt}`;
  }

  if (coupon.startsAt) {
    return `Starts ${coupon.startsAt}`;
  }

  return "No expiration date";
}

export default function AdditionalOffers() {
  const { registerInputRef, getTooltip, copyFromRef, isCopied } =
    useCopyToClipboard({ defaultTooltip: "Copy" });
  // Admin creating/editing/ending a coupon (see /admin/coupons) fires the
  // same "coupons" NOTIFY every list-page live hook subscribes to - a
  // shopper already on a product page sees a new code appear, or an
  // expired one disappear, without a refresh.
  const { coupons, hasData } = useLiveCoupons();

  // Nothing to advertise is a normal state (most products won't always
  // have an active storewide coupon) - hide the whole block rather than
  // show an empty "Additional Offers" box, same as every other optional
  // section on this page.
  if (!hasData || !coupons.length) {
    return null;
  }

  return (
    <div className="rbt-info-wrapper d-block mt--24">
      <div className="rbt-info-box rbt-bg-color-brand-50">
        <p className="text-bold rbt-info-title b1">Additional Offers</p>
        <div className="rbt-coupon-container">
          <Swiper
            className="swiper rbt-coupon-slide-active rbt-swiper-scrollbar-bottom"
            {...({
              slidesPerView: "auto",
              spaceBetween: 24,
              scrollbar: {
                el: ".swiper-scrollbar",
                draggable: true,
              },
            } as unknown as import("swiper/react").SwiperProps)}
            modules={[Scrollbar]}
          >
            {coupons.map((coupon, index) => (
              <SwiperSlide
                className="swiper-slide rbt-scroll-trigger fade_in animation-order-1"
                key={coupon.code}
              >
                <div className="rbt-coupon">
                  <div className="inner rbt-text-copy-activation">
                    <div className="left-part">
                      <input
                        ref={registerInputRef(index)}
                        type="text"
                        defaultValue={coupon.code}
                        readOnly
                        className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                      />
                    </div>
                    <div className="coupon-details">
                      <h2 className="rbt-coupon-info-title b1">
                        {coupon.title}
                      </h2>
                      <p className="rbt-coupon-info-sub-title b3 mt--4">
                        {coupon.subtitle}
                      </p>
                      <ul className="rbt-coupon-info-list mt--12">
                        <li>
                          <span>{couponValidity(coupon)}</span>
                        </li>
                      </ul>
                    </div>

                    <Tooltip
                      content={getTooltip(index)}
                      placement="top"
                      forceOpen={isCopied(index)}
                    >
                      <button
                        type="button"
                        className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn copy-icon-none"
                        onClick={() => void copyFromRef(index)}
                      >
                        <i className="fa-sharp fa-regular fa-copy" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </SwiperSlide>
            ))}
            <div className="rbt-swiper-scrollbar swiper-scrollbar" />
          </Swiper>
        </div>
      </div>
    </div>
  );
}
