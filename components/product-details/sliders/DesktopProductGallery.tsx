"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Swiper as SwiperClass } from "swiper";
import { FreeMode, Mousewheel, Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import LightGallery from "lightgallery/react";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";

import styles from "./DesktopProductGallery.module.css";
import "@/lib/lightgallery-styles";

const LIGHTGALLERY_LICENSE_KEY = process.env.NEXT_PUBLIC_LIGHTGALLERY_LICENSE_KEY;

/**
 * Desktop/tablet-up product gallery: one large image with a synced thumbnail
 * rail underneath, instead of dumping every photo into a two-column grid
 * (which had no cap on rows and just kept growing - and getting visually
 * cut off - as a product picked up more gallery images). Click-to-zoom via
 * LightGallery is preserved from the old grid.
 */
export default function DesktopProductGallery({
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
  const [mainSwiper, setMainSwiper] = useState<SwiperClass | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [thumbEdges, setThumbEdges] = useState({ atStart: true, atEnd: true });
  const hasMultiple = images.length > 1;

  // Lets a color swatch (ColorVariantSwitcher) jump the gallery to its
  // image without the gallery needing to know anything about colors -
  // it just reacts to "show this src" like any other controlled prop.
  useEffect(() => {
    if (!mainSwiper || !activeSrc) return;

    const index = images.indexOf(activeSrc);
    if (index >= 0) {
      mainSwiper.slideTo(index);
    }
  }, [activeSrc, images, mainSwiper]);

  const updateThumbEdges = (swiper: SwiperClass) => {
    setThumbEdges({ atEnd: swiper.isEnd, atStart: swiper.isBeginning });
  };

  return (
    <div className={styles.wrapper}>
      <LightGallery
        plugins={[lgThumbnail, lgZoom]}
        elementClassNames={styles.mainFrame}
        speed={400}
        selector="a.rbt-product-single-img"
        zoomFromOrigin={false}
        // Omitted (not passed as undefined) when unset, so LightGallery
        // falls back to its own bundled placeholder key instead of hitting
        // its harder "Please provide a valid license key" error path. Set
        // NEXT_PUBLIC_LIGHTGALLERY_LICENSE_KEY once a real commercial
        // license (lightgalleryjs.com/license) is purchased.
        {...(LIGHTGALLERY_LICENSE_KEY
          ? { licenseKey: LIGHTGALLERY_LICENSE_KEY }
          : {})}
      >
        <Swiper
          modules={[Navigation, Thumbs]}
          navigation={
            hasMultiple
              ? { nextEl: `.${styles.next}`, prevEl: `.${styles.prev}` }
              : false
          }
          thumbs={{ swiper: thumbsSwiper }}
          onSwiper={setMainSwiper}
          className={styles.mainSwiper}
        >
          {images.map((src, index) => (
            <SwiperSlide key={src}>
              <a
                href={src}
                data-src={src}
                className={`rbt-product-single-img ${styles.slideLink}`}
              >
                <Image
                  alt={imageAlts?.[src] || (index === 0 ? alt : `${alt} view ${index + 1}`)}
                  src={src}
                  fill
                  sizes="(min-width: 1200px) 40vw, (min-width: 992px) 45vw, 90vw"
                  priority={index === 0}
                />
              </a>
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
      </LightGallery>

      {hasMultiple ? (
        <div
          className={`${styles.thumbRailWrap} ${
            thumbEdges.atStart ? "" : styles.fadeStart
          } ${thumbEdges.atEnd ? "" : styles.fadeEnd}`}
        >
          <Swiper
            modules={[FreeMode, Mousewheel, Thumbs]}
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
              updateThumbEdges(swiper);
            }}
            onProgress={updateThumbEdges}
            onResize={updateThumbEdges}
            slidesPerView="auto"
            spaceBetween={12}
            freeMode
            watchSlidesProgress
            grabCursor
            mousewheel={{ forceToAxis: true }}
            className={styles.thumbRail}
          >
            {images.map((src, index) => (
              <SwiperSlide key={src} className={styles.thumbSlide}>
                <button
                  type="button"
                  className={styles.thumbButton}
                  aria-label={`Show ${alt} image ${index + 1}`}
                >
                  <Image
                    alt=""
                    src={src}
                    fill
                    sizes="84px"
                    aria-hidden
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : null}
    </div>
  );
}
