"use client";
import { CloseIcon } from "../svg-icons";
import QuantitySelect from "@/components/common/ui/QuantitySelect";
import { useContextElement } from "@/context/Context";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Tooltip from "@/components/common/ui/Tooltip";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { normalizeCartQuantity } from "@/lib/cartQuantity";
import { getProductDetailsHref } from "@/lib/productLinks";

const colors = [
  { name: "Black", value: "#2B2B2B" },
  { name: "Pink", value: "#cc999d" },
  { name: "Dark", value: "#9C9B9E" },
  { name: "White", value: "#F2EDE7" },
  { name: "Gray", value: "#a09fa4" },
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

type SelectedOptions = {
  color: string;
  size: string;
};

export default function EditCart() {
  const { activeCartProduct, updateQuantity, setActiveCartProduct } =
    useContextElement();
  const { close } = useManagedModalPanel("quickviewEditCartModal");

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    color: "",
    size: "",
  });

  const handleSelection = (type: "color" | "size", value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const quantity = activeCartProduct?.quantity ?? 1;
  const productHref = getProductDetailsHref(activeCartProduct);

  const handleQuantityChange = (nextQuantity: number) => {
    if (!activeCartProduct) return;
    setActiveCartProduct({
      ...activeCartProduct,
      quantity: normalizeCartQuantity(nextQuantity),
    });
  };

  const handleUpdateCart = () => {
    if (!activeCartProduct) return;
    updateQuantity(
      activeCartProduct.id,
      normalizeCartQuantity(activeCartProduct.quantity),
    );
    // close the modal
    close();
  };

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="quickviewEditCartModal"
      tabIndex={-1}
      aria-labelledby="quickviewEditCartModalLabel"
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
              <h5 className="rbt-title rbt-modal-title mb--16">
                Edit Your Selection
              </h5>
              <div className="row row--8 mt_dec--12">
                <div className="col-md-6 col-12 mt--12">
                  <div className="rbt-cart-product-edit-area">
                    <Link href={productHref} className="rbt-cart-product-thumb">
                      <Image
                        alt={activeCartProduct?.title || "Product Thumbnail"}
                        src={
                          activeCartProduct?.imgSrc ||
                          "/assets/images/product-img/fashion/product-new-01-a-1.webp"
                        }
                        width={1072}
                        height={824}
                      />
                    </Link>
                    <div className="rbt-product-info">
                      <h6
                        className="rbt-card-title b3"
                        id="quickviewEditCartModalLabel"
                      >
                        <Link href={productHref}>
                          {activeCartProduct?.title ||
                            "Nirvana Graphic Oversized Sweatshirt"}
                        </Link>
                      </h6>
                      <div className="pricing-part mb--12 mt--0">
                        {activeCartProduct?.oldPrice != null && (
                          <del className="price-text">
                            ${activeCartProduct.oldPrice.toFixed(2)}
                          </del>
                        )}
                        <span className="price-text">
                          $
                          {activeCartProduct
                            ? activeCartProduct.price.toFixed(2)
                            : "179.98"}
                        </span>
                      </div>
                      <div className="rbt-qty-area rbt-qty-sm">
                        <QuantitySelect
                          quantity={quantity}
                          setQuantity={handleQuantityChange}
                          parentClass="qty-item-btn qty-item-btn-decr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-12 mt--12 pl--32">
                  <div className="rbt-single-product-content">
                    <div className="rbt-info-wrapper d-flex mt--0">
                      <div className="prd-info-section">
                        <div className="prd-id-text">
                          <p className="text-bold rbt-variation-label">
                            Color:{" "}
                            <span className="rbt-text">
                              {selectedOptions.color || "No Selection"}
                            </span>
                          </p>
                          <div className="rbt-color-select-area">
                            <ul className="rbt-switcher-root rbt-switcher-color-list rbt-switcher-color-list-lg product-switcher-activation">
                              {colors.map((color) => (
                                <li
                                  key={color.name}
                                  className={` ${
                                    selectedOptions.color === color.name
                                      ? "active"
                                      : ""
                                  }`}
                                >
                                  <Tooltip content={color.name} placement="top">
                                    <button
                                      type="button"
                                      className="rbt-switcher--color tooltips"
                                      aria-label={`Select ${color.name} color`}
                                      onClick={() => {
                                        handleSelection("color", color.name);
                                      }}
                                    >
                                      <div
                                        className="rbt-color-circle"
                                        style={{ backgroundColor: color.value }}
                                      />
                                    </button>
                                  </Tooltip>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rbt-info-wrapper d-flex justify-content-between mt--12">
                      <div className="product-styles-grp d-flex mt--0">
                        <p className="text-bold rbt-variation-label">
                          Size:{" "}
                          <span className="rbt-text">
                            {selectedOptions.size || "No Selection"}
                          </span>
                        </p>
                        <div className="rbt-product-switch-area">
                          <ul className="rbt-switcher-root rbt-switcher-product-list product-switcher-activation">
                            {sizes.map((size) => (
                              <li
                                key={size}
                                className={`${
                                  selectedOptions.size === size ? "active" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  className="rbt-btn rbt-btn-border rbt-btn-xs rbt-store-button"
                                  aria-label={`Select size ${size}`}
                                  onClick={() => {
                                    handleSelection("size", size);
                                  }}
                                >
                                  <span className="rbt-store-radio-button">
                                    {size}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="rbt-info-wrapper d-flex mt--12">
                      <div className="product-styles-grp d-flex mt--0">
                        <p className="text-bold title">Fit :</p>
                        <div className="content d-flex flex-wrap">
                          <button
                            type="button"
                            className="rbt-btn rbt-btn-border rbt-btn-sm rbt-square-btn active"
                          >
                            Relaxed Fit
                          </button>
                          <button
                            type="button"
                            className="rbt-btn rbt-btn-border rbt-btn-sm disabled"
                            aria-disabled="true"
                            tabIndex={-1}
                          >
                            Oversized Fit
                          </button>
                          <button
                            type="button"
                            className="rbt-btn rbt-btn-border rbt-btn-sm rbt-square-btn"
                          >
                            Tailored Fit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <button
                    type="button"
                    className="rbt-btn d-block text-center rbt-btn-sm rbt-square-btn has-left-icon mt--24 mt_sm--16"
                    onClick={handleUpdateCart}
                  >
                    <i className="fa-regular fa-cart-shopping" /> Update Cart
                  </button>
                </div>
              </div>
            </div>
            {/* End Component Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
