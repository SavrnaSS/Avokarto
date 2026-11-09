"use client";

import QuantitySelect from "../common/ui/QuantitySelect";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import CompareQuickLinkTrigger from "@/components/action-buttons/CompareQuickLinkTrigger";
import WishlistQuickLinkTrigger from "@/components/action-buttons/WishlistQuickLinkTrigger";
import { useCartQuantityAction } from "@/hooks/useCartQuantityAction";

import { Product } from "@/types";
import { useTranslation } from "@/lib/i18n/translations";
import { LiveFreeShippingProgress } from "@/components/store/FreeShippingProgress";
export default function ProductActionPanel({ product }: { product: Product }) {
  const {
    quantity,
    setQuantity,
    quantityLimit,
    buttonLabel,
    isDisabled,
    isOutOfStock,
    applyCartAction,
    buyNow,
    isBuyingNow,
    isBuyNowDisabled,
  } = useCartQuantityAction(product);
  const { t } = useTranslation();
  return (
    <>
      {" "}
      <div className="product-btn-grp">
        <div className="rbt-qty-area">
          <QuantitySelect
            quantity={quantity}
            setQuantity={setQuantity}
            max={quantityLimit}
          />
        </div>
        <ModalTriggerButton
          openModalName="popup-cartModal"
          className="rbt-btn rbt-btn-border has-left-icon d-block text-center"
          disabled={isDisabled}
          onClick={(e) => {
            e.preventDefault();
            applyCartAction();
          }}
          suppressHydrationWarning
        >
          <i className="fa-regular fa-cart-shopping mr--4" />
          {buttonLabel}
        </ModalTriggerButton>
      </div>
      <div className="prd-btn-grp">
        <button
          type="button"
          className="rbt-btn d-block text-center w-100"
          disabled={isBuyNowDisabled}
          aria-busy={isBuyingNow}
          onClick={() => buyNow()}
        >
          {isOutOfStock ? t("Out of Stock") : t("Buy Now")}
        </button>
      </div>
      <div className="rbt-quick-link-grp ">
        <CompareQuickLinkTrigger product={product} />
        <WishlistQuickLinkTrigger product={product} />
        <ModalTriggerButton
          openModalName="socialShareModal"
          className="rbt-quick-link"
          type="button"
        >
          <i className="fa-sharp fa-regular fa-share-nodes" />
          {t("Share")}
        </ModalTriggerButton>
      </div>
      <LiveFreeShippingProgress />
    </>
  );
}
