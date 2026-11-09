import Banner from "@/components/products/Banner";
import { pageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/products/Breadcrumb";
import LiveShopDefault from "@/components/products/LiveShopDefault";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "All Categories",
  description:
    "Explore every Avokarto category and find costumes, pet gear, care essentials, and seasonal novelties in one place.",
  path: "/shop-by-category",
});

export default function page() {
  return (
    <>
      <Breadcrumb title="Shop By Category" />
      <Banner />
      <div className="rbt-component-area ptb--32 ptb_sm--12">
        <div className="container">
          <div className="rbt-separator rbt-separator-gray200" />
        </div>
      </div>
      <LiveShopDefault
        column={3}
        detailsPageUrl="/product"
      />
    </>
  );
}
