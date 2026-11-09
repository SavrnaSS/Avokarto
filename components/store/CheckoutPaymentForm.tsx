"use client";

import { useState } from "react";

export default function CheckoutPaymentForm() {
  const [validated, setValidated] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
    }

    setValidated(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`needs-validation pt-2 pb-2 ps-3 ms-2 ms-sm-3 ${validated ? "was-validated" : ""}`}
      noValidate
    >
      <div className="position-relative mb-3 mb-sm-4">
        <input
          type="number"
          className="form-icon-end"
          placeholder="Card number"
          required
        />
        <span className="position-absolute d-flex top-50 end-0 translate-middle-y fs-6 text-body-tertiary me-2">
          <i className="fa-regular fa-credit-card" />
        </span>
      </div>
      <div className="row row-cols-1 rbt-form-area row-cols-sm-2 g-3 g-sm-4">
        <div className="col">
          <div className="input-group date rbt-datepicker rbt-expiry-date">
            <input
              type="text"
              placeholder="MM/YY"
              className="form-control"
              id="date"
              required
            />
            <span className="input-group-append">
              <span className="input-group-text d-block">
                <i className="fa fa-calendar" />
              </span>
            </span>
          </div>
        </div>
        <div className="col">
          <input type="number" min={0} max={9999} placeholder="CVC" required />
        </div>
      </div>
    </form>
  );
}
