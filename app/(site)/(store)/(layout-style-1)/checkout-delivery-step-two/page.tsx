import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import Testimonials from "@/components/homes/home-phone-case/Testimonials";
import SimilerProducts from "@/components/product-details/others/SimilerProducts";
import Checkout2 from "@/components/store/Checkout2";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Checkout: Delivery Options",
  description:
    "Pick a delivery option for your Avokarto order.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <Breadcrumb title="Checkout Delivery Step Two" subtitle="Checkout" />
      <Checkout2 />
      <Testimonials />
      <SimilerProducts parentClass="rbt-component-area rbt-section-gap rbt-bg-color-gray-white" />
    </>
  );
}
