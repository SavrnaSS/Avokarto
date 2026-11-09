import type { Metadata } from "next";
import DemoStorefront from "@/components/seller/DemoStorefront";
import { getSellLandingData } from "@/lib/backend/sell-landing";
import { isStoreTheme } from "@/lib/storeThemes";

// The homepage's live store prototype (embedded in an iframe). Same cached
// data as the homepage, so it costs no extra queries.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store preview",
  robots: { follow: false, index: false },
};

// Runs as soon as the store's HTML and CSS are in - long before hydration -
// so the embedding page can drop its loading shimmer at first paint.
const PAINTED_SCRIPT =
  'if(window.parent!==window)window.parent.postMessage({source:"avk-store",type:"paint"},location.origin)';

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function StorePreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [data, query] = await Promise.all([getSellLandingData(), searchParams]);
  // The look the embedding page starts with, so the first paint is already
  // right instead of flashing the default theme until the postMessage lands.
  const theme = one(query.theme);
  const accent = one(query.accent);
  const name = one(query.name)?.trim().slice(0, 60);
  const margin = Number(one(query.margin));
  return (
    <>
      <DemoStorefront
        initial={{
          accent: accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : null,
          margin: Number.isFinite(margin) && one(query.margin) ? margin : undefined,
          name: name || undefined,
          theme: isStoreTheme(theme) ? theme : undefined,
        }}
        pricing={{
          maxMarginPercent: data.settings?.maxMarginPercent ?? 50,
          platformFeePercent: data.settings?.platformFeePercent ?? 0,
        }}
        products={data.products}
        since={new Date().toISOString()}
      />
      <script dangerouslySetInnerHTML={{ __html: PAINTED_SCRIPT }} />
    </>
  );
}
