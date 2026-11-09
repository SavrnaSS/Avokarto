"use client";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { freeShippingThresholdLabel } from "@/lib/shippingPolicy";

const otherSlides = [
  "New-season essentials are now live.",
  "Limited-time clearance styles up to 50% off.",
];

export default function TopbarSwiper({
  position = "center",
  color = "white",
  hasFancyText = false,
}: {
  position?: string;
  color?: string;
  hasFancyText?: boolean;
}) {
  // The free-shipping line follows Admin -> Settings -> Shipping (and drops out when it's off).
  const threshold = freeShippingThresholdLabel(useStorePolicy().freeShipping);
  const slideTexts = threshold ? [`Free shipping · ${threshold} or more (USD)`, ...otherSlides] : otherSlides;
  return (
    <Swiper
      className="rbt-text-swiper-container rbt-arrow-vertical"
      loop
      slidesPerView={1}
      direction="vertical"
      effect="slide"
      autoplay={{
        delay: 2000,
        reverseDirection: true,
        disableOnInteraction: false,
      }}
      navigation={{
        prevEl: ".rbt-arrow-prev",
        nextEl: ".rbt-arrow-next",
      }}
      modules={[Navigation, Autoplay]}
    >
      {slideTexts.map((text, index) => (
        <SwiperSlide key={index} className="swiper-slide" data-swiper-autoplay={index === 0 ? 5000 : undefined}>
          <div
            className={`rbt-fancy-item fancy-menu-text fancy-menu-${position}`}
          >
            <span className={`mr--4 rbt-fancy-text ${hasFancyText ? "rbt-fancy-text" : ""} rbt-text-color-${color}`}>
              <i className={index === 0 ? "fa-solid fa-truck-fast" : "fa-sharp fa-solid fa-bolt"} aria-hidden="true" />
            </span>
            <span
              className={`rbt-fancy-text ${hasFancyText ? "rbt-fancy-text" : ""} rbt-text-color-${color}`}
            >
              {text}
            </span>
            <Link
              className={` ml--8 rbt-fancy-text rbt-fancy-link ${index === 0 ? "d-none d-sm-inline-flex" : ""} ${hasFancyText ? "rbt-fancy-text" : ""} rbt-text-color-${color}`}
              href="/shop"
            >
              Shop Now
            </Link>
          </div>
        </SwiperSlide>
      ))}

      <div
        className={`rbt-vertical-arrow rbt-arrow-prev rbt-text-color-${color}`}
      >
        <i className="fa-regular fa-chevron-up" />
      </div>
      <div
        className={`rbt-vertical-arrow rbt-arrow-next rbt-text-color-${color}`}
      >
        <i className="fa-regular fa-chevron-down" />
      </div>
    </Swiper>
  );
}
