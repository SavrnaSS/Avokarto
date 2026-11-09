"use client";

import { useState } from "react";
import { FreeShippingAmount, IfFreeShipping } from "@/components/common/FreeShipping";

export default function InfoSection() {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="rbt-component-area rbt-collapsible-content-section rbt-section-gap2 rbt-bg-color-white pb--40">
      <div className="container">
        <div className="row row--12">
          <div className="col-md-12">
            <div
              className={`rbt-collapsible-content-inner rbt-has-show-more ${
                showMore ? "active" : ""
              }`}
            >
              <h4 className="rbt-collapsible-content-title rbt-text-bold rbt-text-color-primary mb--16">
                About Avokarto
              </h4>
              <div className="rbt-collapsible-wrapper rbt-has-show-more-inner-content">
                <div className="rbt-collapsible-block">
                  <h5 className="rbt-collapsible-block-title mb--16">
                    Your own store, without the stock.
                  </h5>
                  <p className="rbt-collapsible-block-content b2 rbt-text-color-gray-500">
                    Avokarto is an all-in-one dropshipping platform. Pick
                    winning products, launch a branded store and share
                    ready-made reels - we stock, pack and ship every order.
                    Prefer to shop? The marketplace brings it all together.
                  </p>
                </div>
                <div className="rbt-collapsible-block mt--32">
                  <h5 className="rbt-collapsible-block-title mb--16">
                    Quality, fit, and service come first.
                  </h5>
                  <p className="rbt-collapsible-block-content b2 rbt-text-color-gray-500">
                    Product pages, size and color choices, cart actions,
                    wishlist tools, and checkout entry points are wired into
                    the storefront so customers can browse, compare, save, and
                    buy with fewer distractions.
                  </p>
                </div>
                <div className="rbt-collapsible-block mt--32">
                  <h5 className="rbt-collapsible-block-title mb--16">
                    Designed for desktop and mobile shopping.
                  </h5>
                  <p className="rbt-collapsible-block-content b2 rbt-text-color-gray-500">
                    The marketplace highlights costume collections, new arrivals,
                    clearance offers, a weekly featured pick, lookbook picks,
                    and top sellers with responsive navigation across screen
                    sizes.
                  </p>
                </div>
                <div className="rbt-collapsible-block mt--32">
                  <h5 className="rbt-collapsible-block-title mb--16">
                    Delivery and returns are part of the promise.
                  </h5>
                  <p className="rbt-collapsible-block-content b2 rbt-text-color-gray-500">
                    <IfFreeShipping fallback="Delivery charges for each method are shown in your cart and at checkout before you pay.">
                      Orders of <FreeShippingAmount /> or more (USD), after
                      discounts, include free shipping. Shipping costs update
                      automatically in your cart and at checkout.
                    </IfFreeShipping>
                  </p>
                </div>
              </div>
              <div
                className={`rbt-show-more-btn-area justify-content-start  ${
                  showMore ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setShowMore((pre) => !pre)}
                  className="rbt-show-more-btn rbt-show-more-btn-naked"
                >
                  Show {showMore ? "Less" : "More"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
