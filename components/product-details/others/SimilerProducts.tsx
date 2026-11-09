"use client";

import { WaveThinIcon } from "../../svg-icons";
import Image from "next/image";
import Link from "next/link";
import { useLiveProducts } from "@/hooks/use-live-products";
import { useAdvertisement } from "@/hooks/use-advertisement";
import ProductCard9 from "@/components/product-cards/ProductCard9";
import DataBoundary from "@/components/common/loading/DataBoundary";

export default function SimilerProducts({
  parentClass = "rbt-component-area rbt-section-gap rbt-bg-color-gray-light pt--0",
}: {
  parentClass?: string;
}) {
  const { products, loading, error, hasData, refresh } = useLiveProducts({
    limit: 3,
  });
  // Renders nothing until an admin actually adds a banner in
  // /admin/advertisements (see ProductSidebarAd) - never a placeholder ad.
  const { advertisement } = useAdvertisement();

  return (
    <div className={parentClass}>
      <div className="container">
        {/* Start Product Single Component */}
        <div className="rbt-fshape-box-outline-style rbt-fshape-box-outline-style-extend-width rbt-product-fshape-box-outline-style">
          <div className="row rbt-section-gap2Top pt_sm--100 pt_md--80 pt--0">
            <div className="col-lg-12 rbt-fshape-row position-relative">
              <div className="rbt-component-section-title rbt-bg-color-white">
                <h4 className="rbt-title text-start">
                  <span className="rbt-bold--text">Similar Items</span>
                </h4>
                <span className="rbt-fshape-right-portion">
                  <WaveThinIcon />
                </span>
              </div>
              <Link
                className="rbt-link position-absolute d-inline-block rbt-text-color-primary rbt-text-medium rbt-gap--8 justify-content-center rbt-btn-link"
                href={`/shop`}
              >
                <span className="btn-text">View All Products</span>
                <span className="btn-icon">
                  <i className="fa-sharp fa-solid fa-arrow-up-right-from-square rbt-color-primary" />
                </span>
              </Link>
            </div>
          </div>
          <div className="rbt-component-area rbt-fshape-box rbt-bg-color-white">
            {/* Start Card Area */}
            <DataBoundary
              loading={loading}
              error={error}
              ready={hasData}
              onRetry={refresh}
              count={3}
              label="Loading similar items"
              empty={!products.length}
              emptyMessage="No products are available yet."
            >
              <div className="row row--12 mt_dec--24">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 col-6 mt--24"
                  >
                    <ProductCard9 product={product} detailsPageUrl="/product" />
                  </div>
                ))}
                {/* Start Single Card - only when an admin has configured a
                    real banner, matching ProductSidebarAd's own rule. */}
                {advertisement && (
                  <div className="col-xxl-3 col-xl-3 col-lg-12 col-md-6 col-sm-6 col-6 mt--24">
                    <div className="rbt-card rbt-beta-shop-card rbt-bg-color-primary">
                      <div className="inner rbt-scroll-trigger fade_in animation-order-4">
                        <div className="rbt-card-img rbt-bg-color-default">
                          <Link href={advertisement.linkUrl || "/shop"}>
                            <Image
                              alt={advertisement.title}
                              src={advertisement.imageUrl}
                              width={216}
                              height={216}
                            />
                          </Link>
                        </div>
                        <div className="rbt-card-content">
                          <h5 className="rbt-card-title">
                            <Link href={advertisement.linkUrl || "/shop"}>
                              {advertisement.title}
                            </Link>
                          </h5>
                          <Link
                            className="rbt-btn rbt-btn-white rbt-btn-sm has-left-icon"
                            href={advertisement.linkUrl || "/shop"}
                          >
                            Shop Now{" "}
                            <i className="fa-solid fa-arrow-up-right" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* End Single Card  */}
              </div>
            </DataBoundary>
            {/* End Card Area */}
          </div>
        </div>
        {/* End Product Single Component */}
      </div>
    </div>
  );
}
