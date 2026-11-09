import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/products/Breadcrumb";
import LiveShopDefault from "@/components/products/LiveShopDefault";
import { CatalogPagination, CatalogProductGrid } from "@/components/seo/CatalogNavigation";
import s from "@/components/seo/catalog.module.css";
import { CATALOG_PAGE_SIZE, getCatalogCategories, getCatalogCategory, getCatalogWindow } from "@/lib/backend/catalog-seo";
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString, pageMetadata } from "@/lib/seo";
import { catalogPageNumber, catalogPagePath, isFacetedShopQuery } from "@/lib/seoRoutes";
import { categoryShopHref } from "@/lib/storefront-categories";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function categoryData(props: Props) {
  const { slug } = await props.params;
  const query = await props.searchParams;
  const page = catalogPageNumber(query.page);
  if (page === null) notFound();
  const category = await getCatalogCategory(slug);
  if (!category) notFound();
  const window = await getCatalogWindow(page, "", JSON.stringify([category.name]));
  if (page > 1 && !window?.products.length) notFound();
  const path = categoryShopHref(category.name, category.slug);
  const description = `Shop ${category.name} at Avokarto. Compare product photos, current prices, available options and stock before you buy.`;
  return { category, page, window, path, description, query };
}

export async function generateMetadata(props: Props) {
  const { category, page, window, path, description, query } = await categoryData(props);
  return pageMetadata({ title: `Shop ${category.name}${page > 1 ? ` - Page ${page}` : ""}`, description, path: catalogPagePath(path, page), noindex: !window?.products.length || isFacetedShopQuery(query) });
}

export default async function CategoryPage(props: Props) {
  const { category, page, window, path, description } = await categoryData(props);
  const categories = await getCatalogCategories();
  const canonical = catalogPagePath(path, page);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({ "@context": "https://schema.org", "@graph": [
      breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Categories", path: "/shop-by-categories" }, { name: category.name, path }, ...(page > 1 ? [{ name: `Page ${page}`, path: canonical }] : [])]),
      collectionJsonLd({ name: category.name, description, path: canonical, products: window?.products ?? [], offset: (page - 1) * CATALOG_PAGE_SIZE }),
    ] }) }} />
    <Breadcrumb title={category.name} />
    <div className="container mt--24 mb--24">
      <h1 className="h2 mb--12">{category.name}{page > 1 ? ` — Page ${page}` : ""}</h1>
      <p>{description} Browse this collection or <Link href="/shop">explore all products</Link>.</p>
      <nav className={s.categories} aria-label="Browse other categories">{categories.filter((item) => item.count > 0 && item.id !== category.id).map((item) => <Link href={categoryShopHref(item.name, item.slug)} key={item.id}>{item.name}</Link>)}</nav>
    </div>
    {page === 1 ? <LiveShopDefault key={category.id} detailsPageUrl="/product" initialProducts={window?.products} defaultFilterCategory={[category.name]} /> : <div className="container"><CatalogProductGrid products={window?.products ?? []} /></div>}
    <div className="container"><CatalogPagination path={path} page={page} hasMore={window?.hasMore ?? false} /></div>
  </>;
}
