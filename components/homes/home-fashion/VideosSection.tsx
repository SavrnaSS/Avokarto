"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import DataBoundary from "@/components/common/loading/DataBoundary";
import { useLiveProducts } from "@/hooks/use-live-products";
import type { Product } from "@/types/product";
import styles from "./VideosSection.module.css";

// Editorial framing per real storefront category - not the category names
// themselves, so the section reads like curated "stories" rather than a
// plain category index. Falls back to "Customer favorite" for products
// that have no category assigned (several of the current catalog don't).
const CATEGORY_STORY_LABELS: Record<string, string> = {
  Care: "Care essentials",
  Costume: "Costume edit",
  Electronics: "Tech & glow",
  "New Arrivals": "Fresh arrivals",
};
const FALLBACK_STORY_LABEL = "Customer favorite";
const STORY_COUNT = 4;

type Story = {
  href: string;
  image: string;
  key: string;
  label: string;
  title: string;
};

function productScore(product: Product) {
  // Rating alone can't separate a 5-star/1-review product from a proven
  // 4.6-star/30-review one - weight by review volume so "best per slot"
  // means genuinely popular, not just lucky.
  return (product.rating ?? 0) * Math.log((product.reviewCount ?? 0) + 2);
}

function buildStories(products: Product[]): Story[] {
  const byCategory = new Map<string, Product[]>();
  const uncategorized: Product[] = [];

  for (const product of products) {
    const category = product.category?.[0];
    if (category) {
      const bucket = byCategory.get(category) ?? [];
      bucket.push(product);
      byCategory.set(category, bucket);
    } else {
      uncategorized.push(product);
    }
  }

  const usedIds = new Set<string | number>();
  const stories: Story[] = [];

  function addStory(product: Product, label: string) {
    if (usedIds.has(product.id) || stories.length >= STORY_COUNT) {
      return;
    }
    usedIds.add(product.id);
    const category = product.category?.[0];
    stories.push({
      href: category
        ? `/shop?category=${encodeURIComponent(category)}`
        : `/product/${product.slug ?? product.id}`,
      image: product.imgSrc,
      key: String(product.id),
      label,
      title: product.title,
    });
  }

  // Pass 1: one story per known category that currently has stock, best
  // product first - covers the common case (every category populated).
  for (const [category, label] of Object.entries(CATEGORY_STORY_LABELS)) {
    const bucket = byCategory.get(category);
    if (!bucket?.length) {
      continue;
    }
    const best = [...bucket].sort((a, b) => productScore(b) - productScore(a))[0];
    addStory(best, label);
  }

  // Pass 2: backfill any remaining slots (a category is empty, or the
  // catalog has fewer than four categories in stock) from whatever's left,
  // ranked storefront-wide - so the section always shows four real
  // products instead of a gap where a category used to have inventory.
  if (stories.length < STORY_COUNT) {
    const remaining = [...byCategory.values(), uncategorized]
      .flat()
      .filter((product) => !usedIds.has(product.id))
      .sort((a, b) => productScore(b) - productScore(a));

    for (const product of remaining) {
      if (stories.length >= STORY_COUNT) break;
      const category = product.category?.[0];
      addStory(
        product,
        category ? (CATEGORY_STORY_LABELS[category] ?? category) : FALLBACK_STORY_LABEL,
      );
    }
  }

  return stories;
}

export default function VideosSection() {
  const { products, loading, error, hasData, refresh } = useLiveProducts({
    limit: 24,
  });
  const stories = useMemo(() => buildStories(products), [products]);

  return (
    <div className="rbt-component-area rbt-products-area rbt-section-gap rbt-bg-color-gray-light">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-component-section-title text-center border-0 p-0 align-items-center">
              <h2 className="rbt-title rbt-scroll-trigger fade_in animation-order-1">
                <span className="rbt-bold--text">Style </span>Stories
              </h2>
              <p className="description rbt-scroll-trigger fade_in animation-order-2">
                Editorial picks pulled straight from the catalog - top-rated
                finds from each corner of the shop.
              </p>
            </div>
          </div>
        </div>
        <DataBoundary
          count={4}
          empty={!stories.length}
          emptyMessage="No style stories are available yet."
          error={error}
          label="Loading style stories"
          loading={loading}
          onRetry={refresh}
          ready={hasData}
        >
          <div className="row row--12 mt_dec--24 rbt-mobile-row">
            {stories.map((story, index) => (
              <div
                key={story.key}
                className="col-lg-3 col-xl-3 col-xxl-3 col-md-6 col-sm-6 col-6 mt--24"
              >
                <Link
                  href={story.href}
                  className={`rbt-card rbt-product-card rounded--16 rbt-scroll-trigger fade_in animation-order-${index + 1}`}
                >
                  <div className={`rbt-card-img rounded--16 ${styles.storyImageFrame}`}>
                    <Image
                      className={`rbt-prd-img ${styles.storyImage}`}
                      alt={story.title}
                      src={story.image}
                      width={624}
                      height={846}
                      sizes="(max-width: 575px) 50vw, (max-width: 991px) 33vw, 25vw"
                    />
                  </div>
                  <div className="rbt-card-body">
                    <p className="rbt-card-subtitle rbt-card-categories-text mb--4">
                      {story.label}
                    </p>
                    <h6 className="rbt-card-title mb--0">{story.title}</h6>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </DataBoundary>
      </div>
    </div>
  );
}
