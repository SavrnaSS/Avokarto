"use client";

import MiniCheckout from "./MiniCheckout";
import CheckoutShippingForm from "./CheckoutShippingForm";
import { useCheckoutDetails } from "@/hooks/use-checkout-details";
import { useShippingMethods } from "@/hooks/use-shipping-methods";

export default function CheckoutShipping() {
  const shippingMethodId = useCheckoutDetails((state) => state.shippingMethodId);
  const { methods, loading, error } = useShippingMethods();
  const selectedMethod = !loading && !error
    ? methods.find((method) => method.id === shippingMethodId)
    : undefined;

  return (
    <div className="rbt-component-area rbt-cart-page rbt-section-gapBottom rbt-bg-color-white">
      <div className="container">
        <div className="row row--12 mt_dec--24">
          <div className="col-12 col-md-12 col-lg-8 mt--24">
            <div className="rbt-transparent-table-one-wrapper rbt-has-bg-gray">
              <div className="rbt-checkout-wrapper-box">
                <div className="rbt-checkout-single-content active">
                  <span className="rbt-checkout-step">1</span>
                  <div className="inners">
                    <h5 className="title">Shipping Details</h5>
                    <CheckoutShippingForm
                      methods={methods}
                      methodsLoading={loading}
                      methodsError={error}
                    />
                  </div>
                </div>
                <div className="rbt-checkout-single-content">
                  <span className="rbt-checkout-step">2</span>
                  <h5 className="title">Secure Payment</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-12 col-lg-4 mt--24 order-first order-lg-last">
            <MiniCheckout shippingOverride={selectedMethod?.price} />
          </div>
        </div>
      </div>
    </div>
  );
}
