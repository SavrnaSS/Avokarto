"use client";

import SearchableDropdown from "../../common/select/SearchableDropdown";
import { shippingCityOptions } from "@/data/cartData";

type CartShippingPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
};

export default function CartShippingPopup({
  isOpen,
  onClose,
  selectedCity,
  onCityChange,
}: CartShippingPopupProps) {
  return (
    <div
      id="cart-shipping-popup"
      className="rbt-offcanvas-inner-popup"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`rbt-offcanvas-inner-popup-card shipping-popup ${
          isOpen ? "open-shipping-popup" : ""
        }`}
      >
        <div className="rbt-offcanvas-card-inner">
          <h6 className="rbt-title rbt-text-bold">
            <span className="mr--4">
              <i className="fa-light fa-truck-fast" />
            </span>
            Estimate shipping rates
          </h6>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="rbt-input-field-grp mb--12">
              <div className="rbt-dropdown-select filter-select rbt-modern-select search-by-category">
                <SearchableDropdown
                  options={shippingCityOptions}
                  selected={selectedCity}
                  onChange={onCityChange}
                  placeholder="Select your City"
                  searchPlaceholder="Search City"
                />
              </div>
            </div>
            <div className="rbt-input-field-grp mb--12">
              <input type="text" placeholder="State / County" />
            </div>
            <div className="rbt-input-field-grp mb--12">
              <input type="text" placeholder="City" />
            </div>
            <div className="rbt-input-field-grp">
              <input type="text" placeholder="Postcode / ZIP" />
            </div>
            <div className="rbt-btn-group mt--16">
              <button
                type="submit"
                className="rbt-btn rbt-btn-md rbt-btn-primary d-block w-100"
              >
                Calculate shipping rates
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
