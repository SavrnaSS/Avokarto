"use client";
import { CloseIcon } from "../svg-icons";
import { FormEvent, useState } from "react";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import type { CustomerProfile } from "@/hooks/use-customer-profile";

export default function AlternativeDelivery({
  profile,
  onSaved,
}: {
  profile: CustomerProfile | null;
  onSaved: () => void;
}) {
  const { close } = useManagedModalPanel("alternateDeliveryAddressEditModal");
  const [country, setCountry] = useState(
    profile?.alternateAddress.country ?? "",
  );
  const [city, setCity] = useState(profile?.alternateAddress.city ?? "");
  const [address, setAddress] = useState(
    profile?.alternateAddress.address1 ?? "",
  );
  const [postcode, setPostcode] = useState(
    profile?.alternateAddress.postcode ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/profile", {
        body: JSON.stringify({
          alternateAddress: { address1: address, city, country, postcode },
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Unable to save alternate delivery address.");
      }

      onSaved();
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save alternate delivery address.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="alternateDeliveryAddressEditModal"
      tabIndex={-1}
      aria-labelledby="alternateDeliveryAddressEditModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered rbt-cart-edit-area">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <CloseIcon />
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              aria-label="Close"
              onClick={close}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-top-folder-shape-wrapper">
            {/* Start Component Area */}
            <div className="rbt-single-product-area rbt-bg-color-white rbt-content-trs-portion">
              <h5 className="rbt-title rbt-modal-title mb--24">
                Change alternative delivery address
              </h5>
              <form onSubmit={handleSubmit}>
                <div className="row row--12 mt_dec--24">
                  <div className="col-md-6 mt--24">
                    <label htmlFor="alt_country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      id="alt_country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="alt_city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="alt_city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="alt_address" className="form-label">
                      Address
                    </label>
                    <input
                      type="text"
                      id="alt_address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="alt_zip_code" className="form-label">
                      ZIP code
                    </label>
                    <input
                      type="text"
                      id="alt_zip_code"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                    />
                  </div>
                  {error ? (
                    <div className="col-12">
                      <p className="rbt-form-error mb--0">{error}</p>
                    </div>
                  ) : null}
                  <div className="col-12">
                    <div className="d-flex rbt-gap--16">
                      <button
                        type="button"
                        className="rbt-btn rbt-btn-secondary rbt-btn-md rbt-square-btn mt--24"
                        aria-label="Close"
                        onClick={close}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rbt-btn rbt-btn-md rbt-square-btn mt--24"
                        disabled={submitting}
                      >
                        {submitting ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* End Component Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
