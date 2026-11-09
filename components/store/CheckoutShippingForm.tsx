"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCheckoutDetails } from "@/hooks/use-checkout-details";
import { useCustomerSession } from "@/hooks/use-customer-session";
import type { ShippingMethod } from "@/hooks/use-shipping-methods";
import { useCurrency } from "@/lib/currency";
import { useHydratedStore } from "@/context/store";
import { useCartCatalog } from "./CartCatalogProvider";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import {
  freeShippingThresholdLabel,
  getShippingCost,
  qualifiesForFreeShipping,
} from "@/lib/shippingPolicy";

export default function CheckoutShippingForm({
  methods,
  methodsLoading,
  methodsError,
}: {
  methods: ShippingMethod[];
  methodsLoading: boolean;
  methodsError: string | null;
}) {
  // Admin -> Settings -> Shipping: the live free-shipping rule.
  const { freeShipping } = useStorePolicy();
  const router = useRouter();
  const { ready: cartReady } = useCartCatalog();
  const customer = useCustomerSession((state) => state.customer);
  const details = useCheckoutDetails();
  const merchandiseTotal = useHydratedStore((state) => state.totalPrice, 0);
  const hasCartItems = useHydratedStore((state) => state.cartProducts.length > 0, false);
  const { formatPrice } = useCurrency();
  const [validated, setValidated] = useState(false);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);

  // This has to be an effect, not "adjust state during render" - unlike a
  // component's own useState, useCheckoutDetails is a shared external store
  // (zustand). Writing to it mid-render can hit another already-mounted
  // subscriber (e.g. CheckoutOrderButton) and trip React's "cannot update a
  // component while rendering a different component" guard.
  useEffect(() => {
    if (!customer || customer.sub === prefilledFor) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefilledFor(customer.sub);
    if (!details.name) details.setField("name", customer.name);
    if (!details.email) details.setField("email", customer.email);
    // Deliberately depends on the individual fields this effect reads/
    // writes, not the whole `details` store object - that reference changes
    // on every keystroke in any field (city, address, ...), which would
    // otherwise re-run this on each one instead of only when the signed-in
    // customer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, prefilledFor, details.name, details.email, details.setField]);

  const hasSelectedMethod =
    !methodsLoading &&
    !methodsError &&
    methods.some((method) => method.id === details.shippingMethodId);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    setValidated(true);

    if (!hasCartItems || !cartReady || !form.checkValidity() || !hasSelectedMethod) {
      return;
    }

    router.push("/checkout-payment");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`needs-validation d-block mt--12 ${validated ? "was-validated" : ""}`}
      noValidate
    >
      <div className="row row-cols-1 row-cols-sm-2 g-3 g-sm-3 mb-4 mb_sm--12">
        <div className="col">
          <label htmlFor="shipping-name" className="form-label">
            Full name
            <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="shipping-name"
            autoComplete="name"
            required
            value={details.name}
            onChange={(event) => details.setField("name", event.target.value)}
          />
          <div className="valid-feedback">Looks good!</div>
          <div className="invalid-feedback">Please enter your full name.</div>
        </div>
        <div className="col">
          <label htmlFor="shipping-email" className="form-label">
            Email address
            <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className="form-control form-control-lg"
            id="shipping-email"
            autoComplete="email"
            required
            value={details.email}
            onChange={(event) => details.setField("email", event.target.value)}
          />
          <div className="valid-feedback">Looks good!</div>
          <div className="invalid-feedback">
            Please enter a valid email address.
          </div>
        </div>
        <div className="col">
          <label htmlFor="shipping-mobile" className="form-label">
            Mobile number
          </label>
          <input
            type="tel"
            inputMode="tel"
            className="form-control form-control-lg"
            id="shipping-mobile"
            autoComplete="tel"
            value={details.phone}
            onChange={(event) => details.setField("phone", event.target.value)}
          />
        </div>
        <div className="col">
          <label htmlFor="shipping-city" className="form-label">
            City <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="shipping-city"
            autoComplete="address-level2"
            required
            value={details.city}
            onChange={(event) => details.setField("city", event.target.value)}
          />
          <div className="valid-feedback">Looks good!</div>
          <div className="invalid-feedback">Please enter your city.</div>
        </div>
        <div className="col">
          <label htmlFor="shipping-state" className="form-label">
            State / Province
          </label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="shipping-state"
            autoComplete="address-level1"
            value={details.state}
            onChange={(event) => details.setField("state", event.target.value)}
          />
        </div>
        <div className="col">
          <label htmlFor="shipping-postcode" className="form-label">
            Postcode <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="shipping-postcode"
            autoComplete="postal-code"
            required
            value={details.postcode}
            onChange={(event) => details.setField("postcode", event.target.value)}
          />
          <div className="valid-feedback">Looks good!</div>
          <div className="invalid-feedback">Please enter your postcode.</div>
        </div>
        <div className="col">
          <label htmlFor="shipping-country" className="form-label">
            Country
          </label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="shipping-country"
            autoComplete="country-name"
            value={details.country}
            onChange={(event) => details.setField("country", event.target.value)}
          />
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="shipping-address" className="form-label">
          House / apartment number and street address
          <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control form-control-lg"
          id="shipping-address"
          autoComplete="address-line1"
          required
          value={details.address1}
          onChange={(event) => details.setField("address1", event.target.value)}
        />
        <div className="valid-feedback">Looks good!</div>
        <div className="invalid-feedback">Please enter your address.</div>
      </div>

      <h3 className="h6 mb--8">Shipping method</h3>
      {freeShipping.enabled ? (
        <p className="mb--12">
          {qualifiesForFreeShipping(merchandiseTotal, freeShipping)
            ? "Free shipping is applied to your delivery choice."
            : `Free shipping on orders of US${freeShippingThresholdLabel(freeShipping)} or more after discounts.`}
        </p>
      ) : null}
      {methodsError ? (
        <p className="rbt-form-error mb--12">{methodsError}</p>
      ) : methodsLoading ? (
        <p className="mb--12">Loading shipping options...</p>
      ) : methods.length === 0 ? (
        <p className="mb--12">
          No shipping methods are available right now. Please check back
          shortly.
        </p>
      ) : (
        <div className="mb-lg-4" role="radiogroup" aria-label="Shipping method">
          {methods.map((method) => {
            const shippingCost = getShippingCost(merchandiseTotal, method.price, freeShipping);
            return (
              <div
                className="single-payment-methode mt-2 d-block"
                key={method.id}
              >
                <label className="rbt-radio-accordion form-check mb-0 d-flex align-items-center justify-content-between w-100">
                  <span className="d-flex align-items-center">
                    <input
                      type="radio"
                      className="rbt-form-check-input me-2"
                      name="shipping-method"
                      checked={details.shippingMethodId === method.id}
                      onChange={() =>
                        details.setField("shippingMethodId", method.id)
                      }
                      required
                    />
                    <span>
                      <span className="d-block fw-semibold">{method.name}</span>
                      <span className="d-block fs-sm text-body-tertiary">
                        {method.description
                          ? `${method.description} - `
                          : ""}
                        {method.deliveryEstimate}
                      </span>
                    </span>
                  </span>
                  <span className="fw-semibold">
                    {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                  </span>
                </label>
              </div>
            );
          })}
          {validated && !hasSelectedMethod ? (
            <div className="invalid-feedback d-block">
              Please select a shipping method.
            </div>
          ) : null}
        </div>
      )}

      <div className="text-center mt--12 text-center rbt-btn-area">
        {!hasCartItems ? (
          <p role="status">
            Add a product to your cart before continuing. <Link href="/shop">Continue shopping</Link>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!hasCartItems || !cartReady || methodsLoading || Boolean(methodsError) || methods.length === 0}
          className="rbt-btn splash-btn icon-reverse-left rbt-scroll-trigger fade_in animation-order-5 d-block rbt-rounded--4"
        >
          <span className="icon-left">
            <i className="fa-sharp fa-regular fa-arrow-right mr--4" />
          </span>
          <span>Continue to Payment</span>
          <span className="icon-right">
            <i className="fa-regular fa-arrow-right ml--4" />
          </span>
        </button>
      </div>
    </form>
  );
}
