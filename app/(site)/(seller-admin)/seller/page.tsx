import type { Metadata } from "next";
import { Suspense } from "react";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Seller Dashboard",
  description: "Manage your Avokarto store, products, orders and payouts.",
  noindex: true,
});

export default function SellerPage() {
  // The dashboard keeps its active tab in the URL (?tab=...).
  return (
    <Suspense>
      <SellerDashboard />
    </Suspense>
  );
}
