import type { Metadata } from "next";
import HomeFashionPage from "@/components/homes/home-fashion/HomeFashionPage";
import { MARKETPLACE_DESCRIPTION, MARKETPLACE_TAGLINE, pageMetadata } from "@/lib/seo";

// The shop's own homepage. "/" now leads with selling on Avokarto.
export const metadata: Metadata = pageMetadata({
  title: `Marketplace - ${MARKETPLACE_TAGLINE}`,
  description: MARKETPLACE_DESCRIPTION,
  path: "/marketplace",
});

export default function MarketplacePage() {
  return <HomeFashionPage />;
}
