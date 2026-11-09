import Banner from "@/components/products/Banner";
import Breadcrumb from "@/components/products/Breadcrumb";
import Categories from "@/components/products/Categories";

import LiveShopFilterCollapse from "@/components/products/LiveShopFilterCollapse";

export default function page() {
  return (
    <>
      <Breadcrumb title="Shop By Brands" />
      <Banner />
      <Categories />

      <div className="rbt-component-area ptb--32 ptb_sm--12">
        <div className="container">
          <div className="rbt-separator rbt-separator-gray200" />
        </div>
      </div>
      <LiveShopFilterCollapse />
    </>
  );
}
