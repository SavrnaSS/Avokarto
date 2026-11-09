"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MiniCheckout from "./MiniCheckout";
import CheckoutPaymentForm from "./CheckoutPaymentForm";
import CheckoutOrderButton from "./CheckoutOrderButton";
import ModalTriggerButton from "../action-buttons/ModalTriggerButton";
import CouponSelectionModal from "@/components/modals/CouponSelectionModal";
import SingleManagedModalLayer from "@/components/common/modals/SingleManagedModalLayer";
import { ModalName } from "@/types/modal";
import {
  useCheckoutDetails,
  useCheckoutDetailsHydrated,
} from "@/hooks/use-checkout-details";
import { useShippingMethods } from "@/hooks/use-shipping-methods";
import { useCurrency } from "@/lib/currency";
import { useHydratedStore } from "@/context/store";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getShippingCost } from "@/lib/shippingPolicy";
import type { PaymentMethodKey } from "@/lib/storePolicy";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Credit or debit card",
  cod: "Cash on delivery",
  googlepay: "Google Pay",
  paypal: "PayPal",
};

export default function CheckoutPayment() {
  const router = useRouter();
  const details = useCheckoutDetails();
  const hydrated = useCheckoutDetailsHydrated();
  const { methods, loading: methodsLoading, error: methodsError, refresh: refreshShipping } = useShippingMethods();
  const merchandiseTotal = useHydratedStore((state) => state.totalPrice, 0);
  const { formatPrice } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState("card");
  // Admin -> Settings -> Payments / Shipping: only methods still on are shown;
  // if the shopper's pick is switched off, the first one still on is used.
  const policy = useStorePolicy();
  const offered = (key: PaymentMethodKey) => policy.paymentMethods.includes(key);
  const activePayment = offered(paymentMethod as PaymentMethodKey) ? paymentMethod : (policy.paymentMethods[0] ?? paymentMethod);

  const selectedMethod = !methodsLoading && !methodsError
    ? methods.find((method) => method.id === details.shippingMethodId)
    : undefined;
  const shippingCost = selectedMethod
    ? getShippingCost(merchandiseTotal, selectedMethod.price, policy.freeShipping)
    : undefined;
  const hasShippingDetails = Boolean(
    details.name && details.email && details.address1 && details.shippingMethodId,
  );

  // Someone landed here without going through /checkout-shipping first (a
  // direct link, or a session that expired) - send them back rather than
  // showing a payment step with no address or shipping method to charge.
  useEffect(() => {
    if (hydrated && !hasShippingDetails) {
      router.replace("/checkout-shipping");
    }
  }, [hasShippingDetails, hydrated, router]);

  const addressLines = [
    details.address1,
    [details.city, details.state, details.postcode].filter(Boolean).join(", "),
    details.country,
  ].filter(Boolean);

  return (
    <>
      <div className="rbt-component-area rbt-cart-page rbt-section-gapBottom rbt-bg-color-white">
        <div className="container">
          <div className="row row--12 mt_dec--24 justify-content-center">
            <div className="col-12 col-md-12 col-lg-8 mt--24">
              <div className="rbt-transparent-table-one-wrapper rbt-has-bg-gray">
                <div className="rbt-checkout-wrapper-box">
                  <div className="rbt-checkout-single-content">
                    <span className="rbt-checkout-step">
                      <i className="fa-regular fa-check" />
                    </span>
                    <div className="inner w-100">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="title">Shipping Details</h5>
                        <div className="rbt-link-hover">
                          <Link href="/checkout-shipping">Edit</Link>
                        </div>
                      </div>
                      <div className="content">
                        <h6 className="h6 mb-0">Deliver to</h6>
                        <p className="desc mt--12">{details.name}</p>
                        {addressLines.map((line) => (
                          <p className="desc mb-0" key={line}>
                            {line}
                          </p>
                        ))}
                        <h6 className="h6 mb-0 mt--12">Shipping method</h6>
                        <p className="desc mt--12">
                          {selectedMethod
                            ? `${selectedMethod.name} (${
                                shippingCost === 0
                                  ? "Free"
                                  : formatPrice(shippingCost ?? 0)
                              }) - ${selectedMethod.deliveryEstimate}`
                            : methodsLoading
                              ? "Loading shipping option..."
                              : methodsError ?? "Choose an available shipping method."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rbt-checkout-single-content active">
                    <span className="rbt-checkout-step">2</span>
                    <div className="rbt-checkout-content-inner">
                      <h5 className="title">Secure Payment</h5>
                      <div className="mb-4" id="paymentMethod" role="list">
                        {offered("cod") ? (
                          <>
                        {/* Cash on delivery */}
                        <div className="single-payment-methode mt-2">
                          <div
                            className="rbt-radio-accordion form-check mb-0"
                            role="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#cash"
                            aria-expanded="false"
                            aria-controls="cash"
                          >
                            <label className="form-check-label w-100 text-dark-emphasis fw-semibold">
                              <input
                                type="radio"
                                className="rbt-form-check-input me-1 me-sm-2"
                                name="payment-method"
                                checked={activePayment === "cod"}
                                onChange={() => setPaymentMethod("cod")}
                              />
                              Cash on delivery
                            </label>
                          </div>
                          <div
                            className="collapse"
                            id="cash"
                            data-bs-parent="#paymentMethod"
                          >
                            <div className="d-sm-flex align-items-center pt-2 pt-sm-1 pb-2 ps-3 ms-2 ms-sm-3">
                              <span className="fs-sm me-3">
                                I would require a change from:
                              </span>
                              <div className="rbt-price-input-grp">
                                <input
                                  type="number"
                                  min={10}
                                  placeholder="10$"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                          </>
                        ) : null}
                        {offered("card") ? (
                          <>
                        {/* Credit card */}
                        <div className="single-payment-methode mt-2 d-block">
                          <div
                            className="rbt-radio-accordion form-check mb-0"
                            role="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#card"
                            aria-expanded="true"
                            aria-controls="card"
                          >
                            <label className="form-check-label d-flex align-items-center text-dark-emphasis fw-semibold">
                              <input
                                type="radio"
                                className="rbt-form-check-input me-1 me-sm-2"
                                name="payment-method"
                                checked={activePayment === "card"}
                                onChange={() => setPaymentMethod("card")}
                              />
                              Credit or debit card
                              <span className="d-none d-sm-flex gap-2 ms-3">
                                <Image
                                  className="d-block"
                                  width={200}
                                  alt="Credit Or Debit Card"
                                  src="/assets/images/payment-brand/image-01.webp"
                                  height={64}
                                />
                              </span>
                            </label>
                          </div>
                          <div
                            className="collapse show"
                            id="card"
                            data-bs-parent="#paymentMethod"
                          >
                            <CheckoutPaymentForm />
                          </div>
                        </div>
                          </>
                        ) : null}
                        {offered("paypal") ? (
                          <>
                        {/* PayPal */}
                        <div className="single-payment-methode mt-2">
                          <div
                            className="rbt-radio-accordion form-check mb-0"
                            role="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#paypal"
                            aria-expanded="false"
                            aria-controls="paypal"
                          >
                            <label className="form-check-label d-flex align-items-center text-dark-emphasis fw-semibold">
                              <input
                                type="radio"
                                className="rbt-form-check-input me-1 me-sm-2"
                                name="payment-method"
                                checked={activePayment === "paypal"}
                                onChange={() => setPaymentMethod("paypal")}
                              />
                              PayPal
                              <Image
                                className="ms-3"
                                alt="PayPal"
                                src="/assets/images/icons/paypal-icon.svg"
                                width={16}
                                height={19}
                              />
                            </label>
                          </div>
                          <div
                            className="collapse"
                            id="paypal"
                            data-bs-parent="#paymentMethod"
                          />
                        </div>
                          </>
                        ) : null}
                        {offered("googlepay") ? (
                          <>
                        {/* Google Pay */}
                        <div className="single-payment-methode mt-2">
                          <div
                            className="rbt-radio-accordion form-check mb-0"
                            role="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#googlepay"
                            aria-expanded="false"
                            aria-controls="googlepay"
                          >
                            <label className="form-check-label d-flex align-items-center text-dark-emphasis fw-semibold">
                              <input
                                type="radio"
                                className="rbt-form-check-input me-1 me-sm-2"
                                name="payment-method"
                                checked={activePayment === "googlepay"}
                                onChange={() => setPaymentMethod("googlepay")}
                              />
                              Google Pay
                              <Image
                                className="ms-3"
                                alt="Google Pay"
                                src="/assets/images/icons/google-icon.svg"
                                width={21}
                                height={17}
                              />
                            </label>
                          </div>
                          <div
                            className="collapse"
                            id="googlepay"
                            data-bs-parent="#paymentMethod"
                          />
                        </div>
                          </>
                        ) : null}

                        <div className="nav pb-3 mb-2 mb-sm-3 rbt-link-hover mt-2">
                          <ModalTriggerButton
                            className="nav-link animate-underline rbt-text-color-gray-400 p-0 rbt-text-bold border-0 bg-transparent"
                            openModalName={ModalName.couponSelectionModal}
                          >
                            <i className="fa-regular fa-circle-plus fs-xl ms-a me-2" />
                            <span className="animate-target">
                              Add a promo code or a gift card
                            </span>
                          </ModalTriggerButton>
                        </div>
                        <textarea
                          className="mb-4"
                          rows={3}
                          placeholder="Additional comments"
                          value={details.notes}
                          onChange={(event) =>
                            details.setField("notes", event.target.value)
                          }
                        />
                        <CheckoutOrderButton
                          paymentMethod={
                            PAYMENT_METHOD_LABELS[activePayment] ?? "pending"
                          }
                          shippingCost={shippingCost}
                          shippingMethodName={selectedMethod?.name}
                          shippingEstimate={selectedMethod?.deliveryEstimate}
                          onRefreshShipping={refreshShipping}
                        />
                      </div>
                    </div>
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
      <SingleManagedModalLayer modalName={ModalName.couponSelectionModal}>
        <CouponSelectionModal />
      </SingleManagedModalLayer>
    </>
  );
}
