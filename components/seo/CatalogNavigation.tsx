import Link from "next/link";
import type { Product } from "@/types/product";
import ProductImage from "@/components/seller/ProductImage";
import { catalogPagePath } from "@/lib/seoRoutes";
import { productImageAlt, productPath } from "@/lib/seo";
import s from "./catalog.module.css";

export function CatalogPagination({ path, page, hasMore, filters }: {
  path: string; page: number; hasMore: boolean; filters?: Record<string, string | string[]>;
}) {
  const href = (number: number) => {
    if (!filters || !Object.keys(filters).length) return catalogPagePath(path, number);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) for (const item of Array.isArray(value) ? value : [value]) if (item) params.append(key, item);
    if (number > 1) params.set("page", String(number));
    return `${path}?${params}`;
  };
  if (page === 1 && !hasMore) return null;
  return <nav aria-label="Catalog pages" className={s.pagination}>
    {page > 1 ? <Link href={href(page - 1)} rel="prev">← Previous page</Link> : <span />}
    <span aria-current="page">Page {page}</span>
    {hasMore ? <Link href={href(page + 1)} rel="next">Next page →</Link> : <span />}
  </nav>;
}

/** Later catalog pages stay useful and fully navigable without JavaScript. */
export function CatalogProductGrid({ products }: { products: Product[] }) {
  return <div className={s.grid}>{products.map((product, index) => <article className={s.card} key={product.catalogId || product.id}>
    <Link href={productPath(product)} className={s.image} aria-label={product.title}>
      {product.imgSrc ? <ProductImage src={product.imgSrc} alt={productImageAlt(product, product.imgSrc)} priority={index < 4} sizes="(max-width: 600px) 45vw, (max-width: 1000px) 30vw, 260px" /> : null}
    </Link>
    <h2><Link href={productPath(product)}>{product.title}</Link></h2>
    <p>${product.price.toFixed(2)} <span>USD</span></p>
    <small>{product.inStock && !product.isStockOut ? "In stock" : "Out of stock"}</small>
  </article>)}</div>;
}
