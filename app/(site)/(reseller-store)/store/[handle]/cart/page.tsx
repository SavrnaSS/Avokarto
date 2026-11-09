import type { Metadata } from "next";
import { StoreCartPage } from "@/components/stores/StoreCart";
import { getPublicStorefront } from "@/lib/backend/resellers";
import { storeFlowMetadata } from "../flowMetadata";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return storeFlowMetadata((await params).handle, "Your cart", "Review your cart before checkout.");
}

// The store's listings power the "unlock free shipping" suggestions. The layout
// already loads them (getPublicStorefront is cached per request), so this is free.
export default async function StoreCartRoute({ params }: Props) {
  const storefront = await getPublicStorefront((await params).handle);
  return <StoreCartPage listings={storefront?.listings ?? []} />;
}
