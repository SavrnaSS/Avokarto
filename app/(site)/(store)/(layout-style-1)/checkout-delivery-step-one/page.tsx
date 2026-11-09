import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import Testimonials from "@/components/homes/home-phone-case/Testimonials";
import SimilerProducts from "@/components/product-details/others/SimilerProducts";
import Checkout from "@/components/store/Checkout";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Checkout: Delivery Details",
  description:
    "Choose where your Avokarto order should be delivered.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <Breadcrumb title="Checkout Delivery Step One" subtitle="Checkout" />
      <Checkout />
      <Testimonials />
      <SimilerProducts parentClass="rbt-component-area rbt-section-gap rbt-bg-color-gray-white" />
    </>
  );
}
