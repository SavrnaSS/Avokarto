import CheckoutComplete from "@/components/store/CheckoutComplete";
import { pageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import Testimonials from "@/components/homes/home-phone-case/Testimonials";
import SimilerProducts from "@/components/product-details/others/SimilerProducts";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Order Confirmed",
  description:
    "Thanks for shopping with Avokarto. Your order is confirmed and we'll email you tracking details once it ships.",
  noindex: true,
});
export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  // Order numbers look like AVO-XXXX-XXXXX; anything else is ignored rather
  // than echoed back (and never replaced with a made-up number).
  const raw = Array.isArray(order) ? order[0] : order;
  const orderNumber = raw && /^[A-Za-z0-9-]{1,40}$/.test(raw.trim()) ? raw.trim() : "";

  return (
    <>
      <Breadcrumb title="Order Confirmed" subtitle="Checkout" />
      <CheckoutComplete orderNumber={orderNumber} />
      <Testimonials />
      <SimilerProducts parentClass="rbt-component-area rbt-section-gap rbt-bg-color-gray-white" />
    </>
  );
}
