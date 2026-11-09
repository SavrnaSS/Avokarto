"use client";

import Link from "next/link";
import { useLiveProducts } from "@/hooks/use-live-products";

import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";

function truncateTitle(title: string, max = 16) {
  return title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;
}

// Replaces the old static "Choose Gender: Women/Men/Accessories" pills -
// those three links all pointed at the same /shop-by-category URL and did
// nothing gender-specific, since the catalog has no gender field at all.
// This shows the 3 most recently added/updated published products instead,
// live from the same catalog every other storefront section reads from -
// real content that changes as the admin adds products, not a decorative
// dead end.
export default function NavFilterTab() {
  const { products, loading } = useLiveProducts({ limit: 3 });

  if (loading) return <LoadingSkeleton layout="page" count={1} label="Loading new products" />;

  if (!products.length) {
    return null;
  }

  return (
    <div className="rbt-product-nav-section rbt-product-nav-var-black rbt-scroll-trigger fade_in animation-order-2">
      <ul className="rbt-product-nav-grp">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/product/${product.slug ?? product.id}`}
              className="rbt-product-nav"
              title={product.title}
            >
              {truncateTitle(product.title)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
