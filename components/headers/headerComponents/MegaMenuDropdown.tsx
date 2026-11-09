"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Grid2X2 } from "lucide-react";
import { useLiveCategories } from "@/hooks/use-live-categories";
import { categoryShopHref } from "@/lib/storefront-categories";
import styles from "./MegaMenuDropdown.module.css";

/* Rows use module classes rather than the theme's `.dropdown-parent-list`
   rules; only the wrapper classes that drive open/close stay global. */
export default function MegaMenuDropdown() {
  const { categories, loading, error, hasData, refresh } = useLiveCategories();

  return (
    <div className={`rbt-update-category-dropdown ${styles.dropdown}`}>
      <div className={`inner ${styles.inner}`}>
        <ul className={styles.list} aria-label="Shop categories" aria-busy={loading}>
          {loading ? (
            <li className={styles.status} role="status">Loading categories…</li>
          ) : error ? (
            <li className={styles.status} role="status">
              <span>{hasData ? "Categories could not be updated." : "Unable to load categories."}</span>
              <button type="button" onClick={refresh}>Try again</button>
            </li>
          ) : !categories.length ? (
            <li className={styles.status} role="status">No categories available yet.</li>
          ) : null}
          {categories.map((category) => (
            <li className={styles.item} key={category.id}>
              <Link className={styles.row} href={categoryShopHref(category.name, category.slug)} prefetch={false}>
                <span className={styles.icon} aria-hidden="true">
                  {category.image ? (
                    <Image src={category.image} alt="" width={36} height={36} sizes="36px" />
                  ) : <Grid2X2 size={18} />}
                </span>
                <span className={styles.name}>{category.name}</span>
                <span
                  className={`${styles.count} ${category.count ? "" : styles.countEmpty}`}
                  aria-label={`${category.count} ${category.count === 1 ? "product" : "products"}`}
                >
                  {category.count}
                </span>
                <ChevronRight className={styles.arrow} size={14} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <Link className={styles.viewAll} href="/categories-list" prefetch={false}>
          <span>View All Categories</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
