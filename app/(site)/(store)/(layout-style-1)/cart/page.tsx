import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import Testimonials from "@/components/homes/home-phone-case/Testimonials";
import SimilerProducts from "@/components/product-details/others/SimilerProducts";
import Cart from "@/components/store/Cart";
import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Shopping Cart",
  description:
    "Review the items in your Avokarto cart, update quantities, and check out securely.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <Breadcrumb title="Shopping Cart" subtitle="Pages" />
      <Cart />
      <Testimonials />
      <SimilerProducts parentClass="rbt-component-area rbt-section-gap rbt-bg-color-gray-white" />
    </>
  );
}
