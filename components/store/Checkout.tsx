import Link from "next/link";
import MiniCheckout from "./MiniCheckout";

export default function Checkout() {
  return (
    <div className="rbt-component-area rbt-cart-page rbt-section-gapBottom rbt-bg-color-white">
      <div className="container">
        <div className="row row--12 mt_dec--24">
          <div className="col-12 col-md-12 col-lg-8 mt--24">
            <div className="rbt-transparent-table-one-wrapper rbt-has-bg-gray">
              <div className="rbt-checkout-wrapper-box">
                <div className="rbt-checkout-single-content active">
                  <span className="rbt-checkout-step">1</span>
                  <div className="inner w-100">
                    <h5 className="title">Delivery Details</h5>
                    <div className="content">
                      <p className="desc">
                        Provide your shipping address to ensure a smooth and
                        timely arrival. 🚚
                      </p>
                      <div className="form-area">
                        <div className="w-100">
                          <label htmlFor="postcode" className="form-label">
                            Postcode :
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            id="postcode"
                            placeholder="e.g. SH 5AP"
                          />
                        </div>
                        <Link
                          href="/checkout-delivery-step-two"
                          className="rbt-btn splash-btn icon-reverse-right rbt-scroll-trigger fade_in animation-order-6 rbt-rounded--4 border-0"
                        >
                          <span className="icon-left">
                            <i className="fa-regular fa-calculator-simple mr--4" />
                          </span>
                          <span>Calculate cost</span>
                          <span className="icon-right">
                            <i className="fa-sharp fa-regular fa-arrow-right ml--4" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rbt-checkout-single-content">
                  <span className="rbt-checkout-step">2</span>
                  <h5 className="title">Shipping Options</h5>
                </div>
                <div className="rbt-checkout-single-content">
                  <span className="rbt-checkout-step">3</span>
                  <h5 className="title">Secure Payment</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-12 col-lg-4 mt--24 order-first order-lg-last">
            <MiniCheckout />
          </div>
        </div>
      </div>
    </div>
  );
}
