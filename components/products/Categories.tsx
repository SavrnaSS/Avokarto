"use client";

import Link from "next/link";
import Image from "next/image";
import { useLiveCategories } from "@/hooks/use-live-categories";
import DataBoundary from "@/components/common/loading/DataBoundary";
import styles from "./Categories.module.css";
import { categoryShopHref, type StorefrontCategory } from "@/lib/storefront-categories";

const FALLBACK_SIZE = { width: 410, height: 398 };

type DisplayCategory = {
  id: string | number;
  title: string;
  imgSrc: string;
  width: number;
  height: number;
  count: number;
  slug: string;
};

export default function Categories({ containerFull = false, showCounts = false, initialCategories }: {
  containerFull?: boolean;
  showCounts?: boolean;
  initialCategories?: StorefrontCategory[];
}) {
  const { categories: liveCategories, loading, error, hasData, refresh } = useLiveCategories(initialCategories);

  const categories: DisplayCategory[] = liveCategories.map((category) => ({
        id: category.id,
        title: category.name,
        slug: category.slug,
        imgSrc: category.image ?? "",
        count: category.count,
        ...FALLBACK_SIZE,
      }));

  return (
    <div className="rbt-component-area rbt-categories-area pt--0 pt_sm--16 pt_md--16 rbt-bg-color-white">
      <div
        className={`${containerFull ? "rbt-full-width-wrapper" : "container"}`}
      >
        {/* Start Component Area */}
        <DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
          layout="categoryTiles" count={6} label="Loading categories" empty={!categories.length}
          emptyMessage="No categories are available yet.">
        <div className={styles.grid}>
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={styles.item}
            >
              <Link
                className={`${styles.link} rbt-cat-box rbt-cat-box-1 text-center rbt-scroll-trigger fade_in animation-order-${
                  index + 1
                }`}
                href={categoryShopHref(cat.title, cat.slug)}
              >
                <div className="inner">
                  <div className={styles.imageFrame}>
                    {cat.imgSrc && (
                      <Image
                        alt={cat.title}
                        src={cat.imgSrc}
                        fill
                        sizes="(max-width: 767px) 33vw, (max-width: 1199px) 25vw, 17vw"
                      />
                    )}
                  </div>
                  <div className={styles.caption}>
                    <h6 className={styles.title}>{cat.title}</h6>
                    {showCounts && <span className={styles.count}>{cat.count} {cat.count === 1 ? "product" : "products"}</span>}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        {/* End Component Area */}
        </DataBoundary>
      </div>
    </div>
  );
}
