"use client";

import ProductCard1 from "@/components/product-cards/ProductCard1";
import { useLiveProducts } from "@/hooks/use-live-products";
import DataBoundary from "@/components/common/loading/DataBoundary";

import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function Products1() {
  const { products: liveProducts, loading, error, hasData, refresh } = useLiveProducts({
    limit: 12,
  });

  return (
    <div
      id="new-arrivals"
      className="rbt-component-area rbt-products-area rbt-section-gapTop rbt-bg-color-gray-light"
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-component-section-title text-center border-0 p-0 align-items-center">
              <h2 className="rbt-title rbt-scroll-trigger fade_in animation-order-1">
                <span className="rbt-bold--text">New Arrivals </span> Just For
                You
              </h2>
              <p className="description rbt-scroll-trigger fade_in animation-order-2">
                The latest pet costumes, carriers, and care essentials, plus
                playful seasonal finds - fresh in the shop and ready to explore.
              </p>
            </div>
          </div>
        </div>
        {/* Start Card Area */}
        <DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
          layout="carousel" label="Loading new arrivals" empty={!liveProducts.length} emptyMessage="No products are available yet.">
        <div className="row row--12">
          <div className="col-md-12">
            <div className="rbt-swiper-container-one rbt-arrow-between">
              <Swiper
                className="swiper rbt-fashion-prd-card-activation-1-v1 rbt-dot-bottom-center"
                {...{
                  slidesPerView: 1.8,
                  spaceBetween: 24,
                  loop: true,
                  pagination: {
                    el: ".fashion-products1-pagination",
                    clickable: true,
                    dynamicBullets: true,
                  },
                  navigation: {
                    prevEl: ".fashion-products1-prev",
                    nextEl: ".fashion-products1-next",
                  },
                  breakpoints: {
                    575: {
                      slidesPerView: 1.8,
                      slidesPerGroup: 1,
                    },
                    768: {
                      slidesPerView: 2.8,
                      slidesPerGroup: 1,
                    },
                    992: {
                      slidesPerView: 2.8,
                      slidesPerGroup: 1,
                    },
                    1200: {
                      slidesPerView: 4,
                      slidesPerGroup: 1,
                    },
                  },
                }}
                modules={[Pagination, Navigation]}
              >
                {liveProducts.map((product, i) => (
                  <SwiperSlide className="swiper-slide" key={i}>
                    <ProductCard1
                      detailsPageUrl="/product"
                      product={product}
                      animationOrder={i + 1}
                    />
                  </SwiperSlide>
                ))}
                <div className="rbt-swiper-pagination rbt-swiper-pagination-var-one has-hide-dot-swipe fashion-products1-pagination" />
              </Swiper>
              <div className="rbt-swiper-arrow rbt-arrow-left rbt-arrow-gray rbt-arrow-lg fashion-products1-prev">
                <div className="custom-overflow">
                  <i className="rbt-icon fa-regular fa-arrow-left" />
                  <i className="rbt-icon-top fa-regular fa-arrow-left" />
                </div>
              </div>
              <div className="rbt-swiper-arrow rbt-arrow-right rbt-arrow-gray rbt-arrow-lg fashion-products1-next">
                <div className="custom-overflow">
                  <i className="rbt-icon fa-regular fa-arrow-right" />
                  <i className="rbt-icon-top fa-regular fa-arrow-right" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Card Area */}
        </DataBoundary>
      </div>
    </div>
  );
}
