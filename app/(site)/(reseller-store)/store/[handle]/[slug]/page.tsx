import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreProduct from "@/components/stores/StoreProduct";
import { getPublicStorefront, getPublicStoreProduct } from "@/lib/backend/resellers";
import { storeBasePath } from "@/lib/backend/store-base-path";
import { pageMetadata } from "@/lib/seo";
import { storeFlowMetadata } from "../flowMetadata";

type Props = { params: Promise<{ handle: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const data = await getPublicStoreProduct(handle, slug);
  if (!data) return storeFlowMetadata(handle, "Page not found", "This product isn't available in this store.");
  const description = data.product.shortSummary || `${data.product.productName} from ${data.store.name}, delivered by Avokarto.`;
  const image = {
    alt: data.product.productName,
    height: 630,
    url: `/api/stores/share-image?handle=${encodeURIComponent(handle)}&product=${encodeURIComponent(slug)}`,
    width: 1200,
  };
  return {
    ...pageMetadata({ title: data.product.productName, description, noindex: true }),
    title: { absolute: `${data.product.productName} | ${data.store.name}` },
    icons: { apple: `/api/stores/icon?handle=${encodeURIComponent(handle)}&size=192`, icon: data.store.logoUrl || `/api/stores/icon?handle=${encodeURIComponent(handle)}&size=192` },
    // Rich link previews (photo, price, store brand) when the product is shared on WhatsApp.
    openGraph: {
      description: `From ${data.store.name}`,
      images: [image],
      siteName: data.store.name,
      title: data.product.productName,
      type: "website",
    },
    twitter: { card: "summary_large_image", description, images: [image.url], title: data.product.productName },
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { handle, slug } = await params;
  const [data, storefront] = await Promise.all([getPublicStoreProduct(handle, slug), getPublicStorefront(handle)]);
  if (!data) notFound();
  // The rest of the store, for "More from this store" and "Recently viewed".
  const otherListings = (storefront?.listings ?? []).filter((listing) => listing.productSlug !== slug).slice(0, 120);
  return <StoreProduct basePath={await storeBasePath(handle)} otherListings={otherListings} product={data.product} store={data.store} />;
}
