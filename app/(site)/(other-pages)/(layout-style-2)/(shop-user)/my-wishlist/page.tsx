import Breadcrumb from "@/components/common/other-components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import Sidebar from "@/components/other-pages/shop-user/Sidebar";
import Wishlist from "@/components/other-pages/shop-user/Wishlist";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "My Wishlist",
  description:
    "The pet costumes, gear, and seasonal finds you've saved on Avokarto.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <Breadcrumb
        className="rbt-breadcrumb-two rbt-bg-color-gray-100"
        title="My Wishlist"
        subtitle="Profile"
      />
      <div className="rbt-component-area rbt-section-gap rbt-bg-color-gray-light">
        <div className="container">
          <div className="row row--12 mt_dec--24">
            <div className="col-12 col-md-12 col-lg-4 col-xl-3 mt--24">
              <Sidebar />
            </div>
            <div className="col-12 col-md-12 col-lg-8 col-xl-9 mt--24">
              <Wishlist />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
