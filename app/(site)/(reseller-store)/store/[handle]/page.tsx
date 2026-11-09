import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreHome from "@/components/stores/StoreHome";
import { getPublicStorefront } from "@/lib/backend/resellers";
import { storeBasePath } from "@/lib/backend/store-base-path";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ handle: string }> };

// Reseller stores repeat the main catalog at other prices, so they stay out
// of search results - shoppers arrive through the links resellers share.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const storefront = await getPublicStorefront(handle);
  if (!storefront) return pageMetadata({ title: "Store not found", description: "This store isn't available.", noindex: true });
  const { store } = storefront;
  const description = store.tagline || `Shop ${store.name} - handpicked products delivered by Avokarto.`;
  // Branded card in the store's colours with its logo and banner.
  const image = { alt: store.name, height: 630, url: `/api/stores/share-image?handle=${encodeURIComponent(handle)}`, width: 1200 };
  return {
    ...pageMetadata({ title: store.name, description, noindex: true }),
    // The store's own name in the browser tab (not "| Avokarto"), its logo
    // as the tab icon, and a branded card as the WhatsApp/social preview.
    title: { absolute: store.name },
    icons: { apple: `/api/stores/icon?handle=${encodeURIComponent(handle)}&size=192`, icon: store.logoUrl || `/api/stores/icon?handle=${encodeURIComponent(handle)}&size=192` },
    openGraph: {
      description,
      title: store.name,
      images: [image],
      siteName: store.name,
      type: "website",
    },
    twitter: { card: "summary_large_image", description, images: [image.url], title: store.name },
  };
}

export default async function StorePage({ params }: Props) {
  const { handle } = await params;
  const storefront = await getPublicStorefront(handle);
  if (!storefront) notFound();
  return <StoreHome basePath={await storeBasePath(handle)} listings={storefront.listings} store={storefront.store} />;
}
