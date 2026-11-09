import CheckoutShipping from "@/components/store/CheckoutShipping";
import { pageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import Testimonials from "@/components/homes/home-phone-case/Testimonials";
import SimilerProducts from "@/components/product-details/others/SimilerProducts";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Checkout: Shipping",
  description:
    "Enter your shipping details to complete your Avokarto order.",
  noindex: true,
});
export default function page() {
  return (
    <>
      <Breadcrumb title="Checkout Shipping" subtitle="Checkout" />
      <CheckoutShipping />
      <Testimonials />
      <SimilerProducts parentClass="rbt-component-area rbt-section-gap rbt-bg-color-gray-white" />
    </>
  );
}
