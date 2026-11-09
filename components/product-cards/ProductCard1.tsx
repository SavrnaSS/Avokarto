"use client";
import OfferBadge from "@/components/common/ui/OfferBadge";
import Image from "next/image";
import {
  useRef,
  useState,
  type MouseEventHandler,
  type PointerEventHandler,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Tooltip from "@/components/common/ui/Tooltip";
import { Product } from "@/types";
import AddToCompare2 from "../action-buttons/AddToCompareTwo";
import AddToCart from "../action-buttons/AddToCart";
import AddToQuickViewOne from "../action-buttons/AddToQuickViewOne";
import AddToWishlistTwo from "../action-buttons/AddToWishlistTwo";
import { useCurrency } from "@/lib/currency";
import {
  announceProductNavigation,
  primeProductNavigationCache,
} from "@/lib/productNavigation";
import styles from "./ProductCard1.module.css";

const PRODUCT_CARD_INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [data-product-card-control]';
const PRODUCT_CARD_CLICK_MOVE_THRESHOLD = 8;

export default function ProductCard1({
  detailsPageUrl = "/product",
  product,
  cardBodyClass = "rbt-card-body has-rbt-top-right-corner-portion rbt-card-body-top-bottom-space",
  animationOrder = 1,
}: {
  detailsPageUrl?: string;
  product: Product;
  cardBodyClass?: string;
  animationOrder?: number;
}) {
  const [selectedVariant, setSelectedVariant] = useState<{
    productId: Product["id"];
    src: string;
  } | null>(null);
  const selectedVariantSrc =
    selectedVariant?.productId === product.id ? selectedVariant.src : product.imgSrc;
  const detailsPageLink = detailsPageUrl + `/${product.slug ?? product.id}`;
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastNavigationAtRef = useRef(0);

  const handleCardPointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    primeProductNavigationCache([product]);
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleCardClick: MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement | null;
    const pointerStart = pointerStartRef.current;
    const pointerMoved =
      pointerStart &&
      Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) >
        PRODUCT_CARD_CLICK_MOVE_THRESHOLD;

    if (pointerMoved || target?.closest(PRODUCT_CARD_INTERACTIVE_SELECTOR)) {
      return;
    }

    const now = Date.now();
    if (now - lastNavigationAtRef.current < 750) return;
    lastNavigationAtRef.current = now;
    announceProductNavigation(detailsPageLink);
    router.push(detailsPageLink);
  };

  return (
    <div
      className={`rbt-card rbt-product-card rbt-product-card-style-2 rbt-clickable-product-card rounded--16 rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
      data-product-href={detailsPageLink}
      onPointerDown={handleCardPointerDown}
      onClick={handleCardClick}
    >
      <div className={`rbt-card-img rounded--16 ${styles.imageFrame}`}>
        <Link href={detailsPageLink} prefetch={false} className={styles.imageLink}>
          <Image
            className={`rbt-scroll-trigger fade_in animation-order-${animationOrder} rbt-prd-img`}
            alt={product.title}
            src={selectedVariantSrc}
            fill
            sizes="(max-width: 575px) 50vw, (max-width: 991px) 33vw, (max-width: 1399px) 25vw, 420px"
          />
        </Link>
        {product.badge && (
          <div className="rbt-badge-wrapper rbt-content-top-left">
            <div
              className={`rbt-product-badge rbt-product-badge-${product.badge.bg}`}
            >
              {product.badge.text}
            </div>
          </div>
        )}
        <AddToWishlistTwo product={product} />
      </div>
      <div className={cardBodyClass}>
        <div className="rbt-curved-radius-bottom-corner" />
        {product.hotSell && (
          <div className="rbt-scroll-animation-wrapper rbt-no-overlay">
            <div className="rbt-scroll-animation rbt-scroll-right-left">
              <div className="rbt-single-column-100">
                <div className="rbt-category-list-dis rbt-category-list">
                  {[...Array(7)].map((_, i) => (
                    <Link href={detailsPageLink} prefetch={false} key={i}>
                      <span className="rbt-category-icon">
                        <Image
                          alt="icon"
                          src="/assets/images/icons/scroll-icon-01.svg"
                          width={16}
                          height={16}
                        />
                      </span>
                      Hot Sell 50% Off
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="rbt-card-top-content">
          <div className="rbt-product-switch-area">
            <ul className={`rbt-switcher-product-list product-switcher-activation ${styles.variants}`}>
              {product.variants?.map((variant, index) => (
                <li
                  className={selectedVariantSrc === variant.src ? "active" : ""}
                  key={index}
                >
                  <button
                    type="button"
                    aria-label={`View ${product.title}, image ${index + 1}`}
                    aria-pressed={selectedVariantSrc === variant.src}
                    className={`rbt-switcher--prd rbt-switcher--prd-${
                      ["one", "two", "three", "four"][index]
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (variant.src) {
                        setSelectedVariant({
                          productId: product.id,
                          src: variant.src,
                        });
                      }
                    }}
                  >
                    {variant.src && (
                      <Image
                        alt=""
                        src={variant.src}
                        width={624}
                        height={846}
                        sizes="(max-width: 479px) 24px, 40px"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {product.moreText && (
              <Link
                className="prd-link-text"
                href={detailsPageLink}
                prefetch={false}
              >
                +{product.moreText} More
              </Link>
            )}
          </div>
          {(product.category?.length ?? 0) > 0 && (
            <div>
              {product.category?.map((item, index) => (
                <Link
                  key={index}
                  href={`/shop-by-categories`}
                  className="rbt-card-subtitle rbt-card-categories-text mt--12"
                >
                  {item}
                </Link>
              ))}
            </div>
          )}
          <h6 className="rbt-card-title mt--4">
            <Link href={detailsPageLink} prefetch={false}>
              {product.title}
            </Link>
          </h6>
          <div className="rbt-card-rating">
            <ul className="rbt-rating-icon-list">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i}>
                  <i
                    className={`fa-solid fa-star${i < (product.rating ?? 0) ? " rbt-rated-icon" : ""}`}
                  />
                </li>
              ))}
            </ul>
            <p className="rating-digit">({product.reviewCount})</p>
          </div>
          <div className="pricing-part">
            {product.oldPrice != null && (
              <del className="price-text">{formatPrice(product.oldPrice)}</del>
            )}
            <span className="price-text">{formatPrice(product.price)}</span>
            <OfferBadge product={product} variant="minus" />
          </div>
        </div>
        <div className="rbt-card-footer d-flex footer-content-btn">
          <AddToCart detailsPageUrl={detailsPageUrl} product={product} />
          <div className="rbt-quick-btn-grp has-mixup-midlayer">
            <AddToCompare2 product={product} tooltipDirection="top" />
            <Tooltip content="Quick View" placement="top">
              <AddToQuickViewOne
                product={product}
                className="rbt-watch-btn rbt-quick-btn tooltips top-right"
                type="button"
                openModalName="quickViewModal"
              >
                <i className="fa-sharp fa-regular fa-eye" />
              </AddToQuickViewOne>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
