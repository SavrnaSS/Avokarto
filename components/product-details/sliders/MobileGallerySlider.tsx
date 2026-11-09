"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Swiper as SwiperClass } from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "./MobileGallerySlider.module.css";

/**
 * Single-image, swipeable gallery for narrow viewports. The desktop grid
 * (two thumbnails per row, every image visible at once) gets cramped once
 * there's no room for two columns - this shows one full-width image at a
 * time with overlaid prev/next arrows and a dot indicator instead.
 *
 * Navigation/pagination targets are plain CSS-selector strings (not refs),
 * matching every other Swiper instance in this codebase (see Hero.tsx in
 * home-skate-store) - refs read as null on Swiper's first init pass here,
 * which silently leaves the arrows unwired.
 */
export default function MobileGallerySlider({
  images,
  alt,
  imageAlts,
  activeSrc,
}: {
  images: readonly string[];
  alt: string;
  // Merchant alt text keyed by image URL (admin > Products > SEO).
  imageAlts?: Readonly<Record<string, string>>;
  activeSrc?: string;
}) {
  const hasMultiple = images.length > 1;
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  // Lets a color swatch (ColorVariantSwitcher) jump the gallery to its
  // image without the gallery needing to know anything about colors - it
  // just reacts to "show this src" like any other controlled prop.
  useEffect(() => {
    if (!swiper || !activeSrc) return;

    const index = images.indexOf(activeSrc);
    if (index >= 0) {
      swiper.slideTo(index);
    }
  }, [activeSrc, images, swiper]);

  return (
    <div className={styles.wrapper} data-testid="mobile-product-gallery">
      <Swiper
        modules={[Navigation, Pagination]}
        className={styles.swiper}
        navigation={
          hasMultiple
            ? { nextEl: `.${styles.next}`, prevEl: `.${styles.prev}` }
            : false
        }
        pagination={hasMultiple ? { clickable: true, el: `.${styles.pagination}` } : false}
        onSwiper={setSwiper}
      >
        {images.map((src, index) => (
          <SwiperSlide key={src}>
            <div className={styles.slide}>
              <Image
                alt={imageAlts?.[src] || (index === 0 ? alt : `${alt} view ${index + 1}`)}
                src={src}
                fill
                sizes="100vw"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className={`${styles.arrow} ${styles.prev}`}
            >
              <i className="fa-regular fa-chevron-left" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              className={`${styles.arrow} ${styles.next}`}
            >
              <i className="fa-regular fa-chevron-right" />
            </button>
          </>
        ) : null}
      </Swiper>

      {hasMultiple ? <div className={styles.pagination} /> : null}
    </div>
  );
}
