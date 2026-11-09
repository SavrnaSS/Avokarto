"use client";
import { useRef } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { freeShippingThresholdLabel } from "@/lib/shippingPolicy";

export default function Facts({
  parentClass = "rbt-text-swiper-container rbt-arrow-vertical",
}) {
  const swiperRef = useRef<SwiperClass | null>(null);
  // The free-shipping line follows Admin -> Settings -> Shipping (and drops out when it's off).
  const threshold = freeShippingThresholdLabel(useStorePolicy().freeShipping);
  const infoItems = [
    { iconClass: "fa-solid fa-bag-shopping", text: "90+ Sold Recently" },
    ...(threshold ? [{ iconClass: "fa-solid fa-truck", text: `Free shipping · ${threshold} or more (USD)` }] : []),
    { iconClass: "fa-solid fa-rotate-left", text: "7 Days Return Policy" },
  ];

  return (
    <Swiper
      loop={true}
      slidesPerView={1}
      direction="vertical"
      effect="slide"
      autoplay={{
        delay: 2000,
        reverseDirection: true,
        disableOnInteraction: false,
      }}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
      }}
      modules={[Autoplay]}
      className={parentClass}
    >
      {infoItems.map((item, index) => (
        <SwiperSlide className="swiper-slide" key={index}>
          <div className="rbt-text-group">
            <span className="icon mr--4">
              <i className={item.iconClass} />
            </span>
            {item.text}
          </div>
        </SwiperSlide>
      ))}
      <div
        className="rbt-vertical-arrow rbt-arrow-prev header-promo-slider-nav"
        onClick={() => swiperRef.current?.slidePrev()}
        onKeyDown={(e) => e.key === "Enter" && swiperRef.current?.slidePrev()}
        role="button"
        tabIndex={0}
        aria-label="Previous"
      >
        <i className="fa-regular fa-chevron-up" />
      </div>
      <div
        className="rbt-vertical-arrow rbt-arrow-next header-promo-slider-nav"
        onClick={() => swiperRef.current?.slideNext()}
        onKeyDown={(e) => e.key === "Enter" && swiperRef.current?.slideNext()}
        role="button"
        tabIndex={0}
        aria-label="Next"
      >
        <i className="fa-regular fa-chevron-down" />
      </div>
    </Swiper>
  );
}
