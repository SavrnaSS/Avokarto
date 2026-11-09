"use client";

import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { freeShippingThresholdLabel } from "@/lib/shippingPolicy";

const otherSlides = [
  "Fresh arrivals in tailoring, denim, and knitwear",
  "Clearance styles are available for a limited time",
];

export default function PromoTextScroller() {
  // The free-shipping line follows Admin -> Settings -> Shipping (and drops out when it's off).
  const threshold = freeShippingThresholdLabel(useStorePolicy().freeShipping);
  const slideContents = threshold ? [`Free shipping · ${threshold} or more (USD)`, ...otherSlides] : otherSlides;
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
      navigation={{
        prevEl: ".header-promo-slider-nav.rbt-arrow-prev",
        nextEl: ".header-promo-slider-nav.rbt-arrow-next",
      }}
      modules={[Navigation, Autoplay]}
      className="rbt-text-swiper-container rbt-arrow-vertical"
    >
      {slideContents.map((text, index) => (
        <SwiperSlide className="swiper-slide" key={index} data-swiper-autoplay={index === 0 ? 5000 : undefined}>
          {text}{" "}
          <Link className={`rbt-fancy-link ml--4 ${index === 0 ? "d-none d-sm-inline-flex" : ""}`} href={`/shop`}>
            Know more
          </Link>
        </SwiperSlide>
      ))}

      <div className="rbt-vertical-arrow rbt-arrow-prev header-promo-slider-nav">
        <i className="fa-regular fa-chevron-up" />
      </div>
      <div className="rbt-vertical-arrow rbt-arrow-next header-promo-slider-nav">
        <i className="fa-regular fa-chevron-down" />
      </div>
    </Swiper>
  );
}
