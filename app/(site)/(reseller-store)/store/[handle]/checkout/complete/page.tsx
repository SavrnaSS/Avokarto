import type { Metadata } from "next";
import StoreOrderComplete from "@/components/stores/StoreOrderComplete";
import { getPublicStorefront } from "@/lib/backend/resellers";
import { storeFlowMetadata } from "../../flowMetadata";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return storeFlowMetadata((await params).handle, "Order confirmed", "Thanks for your order.");
}

export default async function StoreOrderCompleteRoute({ params, searchParams }: Props) {
  const { order } = await searchParams;
  // For "keep shopping" picks; the layout already loaded it (cached per request).
  const storefront = await getPublicStorefront((await params).handle);
  // Same rule as /checkout-thankyou: only echo something shaped like an order number.
  const raw = Array.isArray(order) ? order[0] : order;
  const orderNumber = raw && /^[A-Za-z0-9-]{1,40}$/.test(raw.trim()) ? raw.trim() : "";
  return <StoreOrderComplete listings={storefront?.listings ?? []} orderNumber={orderNumber} />;
}
