"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLiveCategories } from "@/hooks/use-live-categories";
import DataBoundary from "@/components/common/loading/DataBoundary";
import styles from "./Categories.module.css";
import { categoryShopHref } from "@/lib/storefront-categories";

// Two presentations of the same live categories, switched by CSS at 768px
// (Categories.module.css): the template's art-directed row on tablet and
// desktop, and a 2-up grid of photo tiles on phones, where the wide tile
// can't fit its overlaid text.

const BASE_COL_CLASS = "col-lg-1-5 col-lg-4 col-md-4 col-sm-12 col-6";
const WIDE_COL_CLASS = "col-lg-2-5 col-lg-8 col-md-8 col-sm-12 col-6";

const NARROW_SIZE = { width: 490, height: 490 };
const WIDE_SIZE = { width: 1026, height: 490 };

// Real catalog rows have no curated wide/narrow layout flag (that's demo-only
// art direction with no equivalent column), so the grid pattern is derived
// from position instead of stored data - it stays correct as the merchant
// adds/removes categories through the admin CRUD.
function isWideSlot(index: number) {
  return index % 4 === 3;
}

// Same reasoning as isWideSlot: the demo's featured tiles ("New Season
// Edit" / "View Trending Styles") each carry a hand-picked badge + subtitle
// with no equivalent admin field to source from live categories. Cycling a
// small set of presets by *occurrence* (1st featured slot, 2nd, ...) keeps
// every live featured tile dressed the same way the demo ones are, without
// inventing a new schema column for it.
const FEATURED_PRESETS = [
  {
    badge: { color: "green", label: "EXCLUSIVE" },
    buttonMarquee: false,
    subtitle: "NEW ARRIVALS",
  },
  {
    badge: { color: "primary", label: "Trending" },
    buttonMarquee: true,
    subtitle: "ONLINE EXCLUSIVE",
  },
] as const;

type DisplayCategory = {
  id: string | number;
  title: string;
  slug: string;
  imgSrc: string;
  width: number;
  height: number;
  isWider: boolean;
  subtitle?: string;
  badge?: { label?: string; color?: string };
  buttonMarquee?: boolean;
};

export default function Categories() {
  const { categories: liveCategories, loading, error, hasData, refresh } = useLiveCategories();

  // Phone slider: every published category, stocked ones first; each links
  // to its own filtered shop page.
  const phoneCategories = useMemo(
    () =>
      liveCategories
        .filter((category) => category.status === "published")
        .sort(
          (a, b) =>
            Number(b.count > 0) - Number(a.count > 0) ||
            a.sortOrder - b.sortOrder ||
            a.name.localeCompare(b.name),
        ),
    [liveCategories],
  );

  // Slider position for the dots - derived from native scrolling (swipe,
  // trackpad, keyboard) rather than driving it, so it never fights the user.
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const syncActiveSlide = useCallback(() => {
    const track = trackRef.current;
    const first = track?.querySelector("li");
    if (!track || !first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || "0");
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    setActiveSlide(atEnd ? phoneCategories.length - 1 : Math.round(track.scrollLeft / step));
  }, [phoneCategories.length]);
  useEffect(() => {
    syncActiveSlide();
  }, [syncActiveSlide]);
  const goToSlide = (index: number) => {
    const track = trackRef.current;
    const slide = track?.querySelectorAll("li")[index];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
  };

  let featuredCount = 0;
  const categories: DisplayCategory[] = liveCategories.map((category, index) => {
        const wide = isWideSlot(index);
        const preset = wide
          ? FEATURED_PRESETS[featuredCount++ % FEATURED_PRESETS.length]
          : undefined;
        return {
          id: category.id,
          title: category.name,
          slug: category.slug,
          imgSrc: category.image ?? "",
          ...(wide ? WIDE_SIZE : NARROW_SIZE),
          isWider: wide,
          subtitle: preset?.subtitle,
          badge: preset?.badge,
          buttonMarquee: preset?.buttonMarquee ?? false,
        };
      });

  return (
    <div className="rbt-component-area rbt-categories-area rbt-section-gap rbt-bg-color-white">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-component-section-title text-center border-0 p-0">
              <h2 className="rbt-title rbt-scroll-trigger fade_in animation-order-1">
                <span className={styles.desktopOnly}>
                  <span className="rbt-bold--text">Categories</span> You May Like
                </span>
                <span className={styles.phoneOnly}>
                  <span className="rbt-bold--text">Shop</span> by Category
                </span>
              </h2>
            </div>
          </div>
        </div>
        {/* Start Card Area */}
        <DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
          layout="categories" count={4} label="Loading categories" empty={!categories.length}
          emptyMessage="No categories are available yet.">
        <div className={styles.phoneOnly}>
          <ul
            ref={trackRef}
            className={styles.slider}
            onScroll={syncActiveSlide}
            aria-label="Categories"
          >
            {phoneCategories.map((category, index) => (
              <li
                key={category.id}
                className={`${styles.tile} ${category.count > 0 ? "" : styles.soon}`}
                aria-label={`${index + 1} of ${phoneCategories.length}`}
              >
                <Link
                  href={categoryShopHref(category.name, category.slug)}
                  className={styles.link}
                >
                  <span className={styles.media}>
                    {category.image ? (
                      <Image src={category.image} alt="" fill sizes="72vw" />
                    ) : null}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.name}>{category.name}</span>
                    <span className={styles.count}>
                      {category.count > 0
                        ? `${category.count} ${category.count === 1 ? "product" : "products"}`
                        : "Coming soon"}
                    </span>
                  </span>
                  <span className={styles.corner} aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {phoneCategories.length > 1 ? (
            <div className={styles.dots}>
              {phoneCategories.map((category, index) => (
                <button
                  key={category.id}
                  type="button"
                  className={`${styles.dot} ${index === activeSlide ? styles.dotActive : ""}`}
                  aria-label={`Show ${category.name}`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className={`row row--12 mt_dec--24 ${styles.desktopOnly}`}>
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`${category.isWider ? WIDE_COL_CLASS : BASE_COL_CLASS} mt--24`}
            >
              <div
                className={`rbt-cat-box rbt-cat-box-5 rbt-card-has-animated rbt-scroll-trigger fade_in animation-order-${index + 1} ${category.isWider ? "wider-column" : "text-center"}`}
              >
                <div className="inner">
                  <div
                    className={`rbt-image-portion rbt-scroll-trigger zoom_in animation-order-${index + 1}`}
                  >
                    <Link href={categoryShopHref(category.title, category.slug)}>
                      {category.imgSrc ? <Image
                        alt={category.title}
                        src={category.imgSrc}
                        width={category.width}
                        height={category.height}
                        sizes={category.isWider
                          ? "(max-width: 767px) 56vw, (max-width: 1199px) 67vw, 40vw"
                          : "(max-width: 767px) 56vw, (max-width: 1199px) 34vw, 20vw"}
                        style={{
                          // The theme CSS floors this image to min-height:
                          // 305px, which assumes every source photo is
                          // already cropped to roughly match its slot's
                          // aspect ratio. Live categories can point at any
                          // real product photo (portrait, square, whatever
                          // the merchant picked), so without a forced ratio
                          // here, narrow and wide slots end up wildly
                          // different heights in the same row - overriding
                          // minHeight lets aspectRatio be the only thing
                          // that decides height, so every slot of the same
                          // type renders identically regardless of the
                          // source image's real proportions.
                          aspectRatio: `${category.width} / ${category.height}`,
                          height: "auto",
                          minHeight: 0,
                          objectFit: "cover",
                          width: "100%",
                        }}
                      /> : <div style={{ aspectRatio: `${category.width} / ${category.height}`, background: "#f1f3ef" }} />}
                    </Link>
                  </div>
                  {category.isWider ? (
                    <div className="content">
                      <div className="top-content">
                        {category.badge && (
                          <span
                            className={`rbt-badge rbt-badge-${category.badge.color} rbt-badge-small`}
                          >
                            {category.badge.label}
                          </span>
                        )}
                        <p className="subtitle">{category.subtitle}</p>
                        <h5 className="title">{category.title}</h5>
                      </div>
                      <div className="bottom-content">
                        <Link
                          href={categoryShopHref(category.title, category.slug)}
                          className={`rbt-btn rbt-btn-white rbt-btn-md ${category.buttonMarquee ? "rbt-marquee-btn marquee-auto" : ""}`}
                        >
                          {category.buttonMarquee ? (
                            <span data-text={category.title}>
                              {category.title}
                            </span>
                          ) : (
                            category.title
                          )}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={categoryShopHref(category.title, category.slug)}
                      className="rbt-btn rbt-btn-white rbt-btn-md"
                    >
                      {category.title}
                    </Link>
                  )}
                </div>
                <div className="rbt-right-corner-portion">
                  <div className="rbt-corner-portion-wrapper">
                    <Link href={categoryShopHref(category.title, category.slug)} className="rbt-card-link-btn">
                      <i className="fa-solid fa-arrow-up-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* End Card Area */}
        </DataBoundary>
      </div>
    </div>
  );
}
