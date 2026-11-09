import type { Metadata } from "next";
import StoreCheckout from "@/components/stores/StoreCheckout";
import { storeFlowMetadata } from "../flowMetadata";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return storeFlowMetadata((await params).handle, "Checkout", "Secure checkout.");
}

// The store's own checkout. Orders go through Avokarto's /api/checkout,
// exactly like the main shop's checkout pages.
export default function StoreCheckoutRoute() {
  return <StoreCheckout />;
}
