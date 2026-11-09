import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import Categories3 from "@/components/products/Categories3";
import { pageMetadata } from "@/lib/seo";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Shop by Category",
  description: "Explore Avokarto's product categories and browse the current catalog.",
  path: "/categories-list",
});

export default function CategoriesListPage() {
  return (
    <>
      <Breadcrumb
        className="rbt-breadcrumb-two rbt-bg-color-gray-light"
        subtitle=""
        hasHrLine
        title="Shop by Category"
      />
      <Categories3 />
    </>
  );
}
