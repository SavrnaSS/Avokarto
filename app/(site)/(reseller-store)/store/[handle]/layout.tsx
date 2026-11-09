import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import StoreShell from "@/components/stores/StoreShell";
import { getPublicStoreBranding, getPublicStorefront } from "@/lib/backend/resellers";
import { storeBasePath } from "@/lib/backend/store-base-path";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ handle: string }> };

// Each store installs as its own home-screen app with its name, icon and colour.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const store = await getPublicStoreBranding(handle);
  if (!store) return {};
  return {
    // Relative on purpose: on a custom domain the manifest must be same-origin.
    manifest: `/api/stores/manifest?handle=${encodeURIComponent(handle)}`,
    appleWebApp: { capable: true, statusBarStyle: "default", title: store.name },
  };
}

export async function generateViewport({ params }: Params): Promise<Viewport> {
  const { handle } = await params;
  const store = await getPublicStoreBranding(handle);
  if (!store?.accentColor) return {};
  // The browser chrome matches the page: black for the dark theme.
  return { themeColor: store.theme === "noir" ? "#0b0b0d" : store.accentColor };
}

// Reseller stores render inside their own branded shell (logo, colours,
// navigation, footer) instead of Avokarto's header and footer, so each one
// reads as its own website. The cart, modals and checkout stay Avokarto's.
export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  // The storefront (cached per request, so pages that also load it don't
  // query twice) gives the header its categories, biggest first.
  const storefront = await getPublicStorefront(handle);
  if (!storefront) notFound();
  const counts = new Map<string, number>();
  for (const listing of storefront.listings) {
    if (listing.category) counts.set(listing.category, (counts.get(listing.category) ?? 0) + 1);
  }
  const categories = [...counts].map(([name, count]) => ({ count, name })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  // A small index for the header's live search suggestions and the cart
  // drawer's "add to unlock free shipping" picks (capped so big stores don't
  // ship their whole catalog in every page).
  const searchIndex = storefront.listings.slice(0, 300).map((listing) => ({
    cartId: listing.cartId,
    category: listing.category,
    imageUrl: listing.imageUrl,
    inStock: listing.inStock,
    listingId: listing.id,
    name: listing.productName,
    price: listing.price,
    productId: listing.productId,
    slug: listing.productSlug,
    stock: listing.stock,
  }));
  return (
    <StoreShell basePath={await storeBasePath(handle)} categories={categories} searchIndex={searchIndex} store={storefront.store}>
      {children}
    </StoreShell>
  );
}
