import CheckoutPayment from "@/components/store/CheckoutPayment";
import { pageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import Testimonials from "@/components/homes/home-phone-case/Testimonials";
import SimilerProducts from "@/components/product-details/others/SimilerProducts";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Checkout: Payment",
  description:
    "Pay securely to complete your Avokarto order.",
  noindex: true,
});
export default function page() {
  return (
    <>
      <Breadcrumb title="Checkout Payment" subtitle="Checkout" />
      <CheckoutPayment />
      <Testimonials />
      <SimilerProducts parentClass="rbt-component-area rbt-section-gap rbt-bg-color-gray-white" />
    </>
  );
}
