"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import DataBoundary from "@/components/common/loading/DataBoundary";
import ProductCard1 from "@/components/product-cards/ProductCard1";
import { useLiveProducts } from "@/hooks/use-live-products";
import styles from "./LookbookProducts.module.css";

const LOOKBOOK_HOTSPOTS = [
  {
    catalogId: "1e907616-c266-4b89-b2b2-3e1486d58ca6",
    labelSide: "right",
    left: 43,
    top: 48,
  },
  {
    catalogId: "1922959c-d6dd-4d1c-86cf-3f3352754af6",
    labelSide: "left",
    left: 83,
    top: 76,
  },
  {
    catalogId: "2073da43-4b79-4ce5-8ea7-748480208106",
    labelSide: "right",
    left: 55,
    top: 59,
  },
  {
    catalogId: "e5021e6e-902f-4111-98ee-7bb6f99fbbba",
    labelSide: "left",
    left: 81,
    top: 36,
  },
] as const;

const LOOKBOOK_PRODUCT_IDS = LOOKBOOK_HOTSPOTS.map(
  (hotspot) => hotspot.catalogId,
);

export default function LookbookProducts() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const selectionRef = useRef<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string>(
    LOOKBOOK_HOTSPOTS[0].catalogId,
  );
  const { products, loading, error, hasData, refresh } = useLiveProducts({
    catalogIds: LOOKBOOK_PRODUCT_IDS,
    limit: LOOKBOOK_PRODUCT_IDS.length,
  });

  const resolvedHotspots = useMemo(() => {
    const productsById = new Map(
      products.map((product) => [String(product.catalogId), product]),
    );

    return LOOKBOOK_HOTSPOTS.flatMap((hotspot) => {
      const product = productsById.get(hotspot.catalogId);
      return product ? [{ hotspot, product }] : [];
    });
  }, [products]);
  const visibleActiveProductId = resolvedHotspots.some(
    ({ product }) => String(product.catalogId) === activeProductId,
  )
    ? activeProductId
    : String(resolvedHotspots[0]?.product.catalogId ?? "");

  function selectProduct(index: number, catalogId: string) {
    selectionRef.current = catalogId;
    swiperRef.current?.slideTo(index);
    setActiveProductId(catalogId);
    window.setTimeout(() => {
      if (selectionRef.current === catalogId) selectionRef.current = null;
    }, 500);
  }

  return (
    <section
      aria-labelledby="pet-lookbook-title"
      className={`rbt-component-area rbt-lookbook-area rbt-lookbook-area-one rbt-section-gapTop rbt-bg-color-white ${styles.section}`}
    >
      <div className="wrapper">
        <div className="row row--0 mt_dec--24 align-items-center justify-content-center">
          <div className="col-xl-6 col-lg-12 col-md-12 col-sm-12 col-12 mt--24">
            <div className={`rbt-lookbook-section ${styles.bannerSection}`}>
              <div
                className={`rbt-lookbook-banner rbt-scroll-trigger zoom_in animation-order-1 ${styles.banner}`}
              >
                <Image
                  alt="Pet fashion lookbook with cozy carry wear and a denim cat outfit"
                  className={styles.bannerImage}
                  height={1254}
                  sizes="(max-width: 1199px) 100vw, 50vw"
                  src="/assets/images/lookbook-images/pet-fashion-lookbook-banner-v3.webp"
                  width={1254}
                />

                <Link
                  aria-label="Shop pet costumes and cozy carry wear"
                  className={styles.bannerCta}
                  href="/shop?category=Costume"
                />

                {resolvedHotspots.map(({ hotspot, product }, index) => {
                  const catalogId = String(product.catalogId);
                  const active = catalogId === visibleActiveProductId;

                  return (
                    <button
                      aria-controls="pet-lookbook-products"
                      aria-label={`Show ${product.title}`}
                      aria-pressed={active}
                      className={`${styles.hotspot} ${active ? styles.hotspotActive : ""}`}
                      data-label-side={hotspot.labelSide}
                      data-product-id={catalogId}
                      key={catalogId}
                      onClick={() => selectProduct(index, catalogId)}
                      style={{ left: `${hotspot.left}%`, top: `${hotspot.top}%` }}
                      type="button"
                    >
                      <span aria-hidden="true" className={styles.hotspotMarker} />
                      <span className={styles.hotspotLabel}>{product.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-xl-6 col-lg-12 col-md-12 col-sm-12 col-12 mt--24">
            <div className={`rbt-lookbook-content ${styles.productsPanel}`}>
              <div className="rbt-component-section-title text-center p-0 border-0 mb--32 mb_sm--16">
                <h2
                  className="rbt-title rbt-scroll-trigger fade_in animation-order-1"
                  id="pet-lookbook-title"
                >
                  Shop the <span className="rbt-bold--text">Pet Edit</span>
                </h2>
              </div>

              <DataBoundary
                count={2}
                empty={!resolvedHotspots.length}
                emptyMessage="No lookbook products are available yet."
                error={error}
                label="Loading pet lookbook products"
                loading={loading}
                onRetry={refresh}
                ready={hasData}
              >
                <Swiper
                  breakpoints={{
                    481: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2 },
                    992: { slidesPerView: 2 },
                    1200: { slidesPerView: 2 },
                  }}
                  className="swiper product-swiper-activation-three-lookbook rbt-arrow-between rbt-dot-bottom-center gutter-swiper-24 pb--40"
                  id="pet-lookbook-products"
                  modules={[Navigation, Pagination]}
                  navigation={{ nextEl: ".fashion-lookbook-next" }}
                  onSlideChange={(swiper) => {
                    if (selectionRef.current) return;
                    const catalogId = resolvedHotspots[swiper.activeIndex]?.product.catalogId;
                    if (catalogId) setActiveProductId(String(catalogId));
                  }}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  pagination={{
                    clickable: true,
                    el: ".fashion-lookbook-pagination",
                  }}
                  slidesPerView={1.12}
                  spaceBetween={16}
                >
                  {resolvedHotspots.map(({ product }, index) => (
                    <SwiperSlide
                      className="swiper-slide"
                      key={product.catalogId ?? product.id}
                    >
                      <ProductCard1
                        animationOrder={index + 1}
                        detailsPageUrl="/product"
                        product={product}
                      />
                    </SwiperSlide>
                  ))}

                  <div className="rbt-swiper-arrow rbt-arrow-right fashion-lookbook-next">
                    <div className="custom-overflow">
                      <i className="rbt-icon fa-regular fa-arrow-right" />
                      <i className="rbt-icon-top fa-regular fa-arrow-right" />
                    </div>
                  </div>
                  <div className="rbt-swiper-pagination rbt-swiper-pagination-var-one fashion-lookbook-pagination" />
                </Swiper>
              </DataBoundary>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
