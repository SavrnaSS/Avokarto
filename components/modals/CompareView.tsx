"use client";
import { CloseIcon, ScaleIcon } from "../svg-icons";
import ProductRating from "@/components/common/ui/ProductRating";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import AddToCart from "@/components/action-buttons/AddToCart";
import { getProductDetailsHref } from "@/lib/productLinks";

export default function CompareView() {
  const { removeFromCompareItem, compareItem, mounted } = useContextElement();
  const { close } = useManagedModalPanel("compareReviewModal");

  const items = compareItem;

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="compareReviewModal"
      tabIndex={-1}
      aria-labelledby="compareReviewModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered xl-size">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <CloseIcon />
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              aria-label="Close"
              onClick={close}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-top-folder-shape-wrapper">
            {/* Start Componente Area */}
            <div className="rbt-component-area rbt-compare-table-area rbt-content-trs-portion">
              <div className="row">
                <div className="col-12">
                  <div className="rbt-component-section-title rbt-gap--4 mb--24 p-0 border-0 text-left">
                    <h5
                      id="compareReviewModalLabel"
                      className="rbt-title mb--0"
                    >
                      <span className="rbt-text-bold">Compare Product</span>
                    </h5>
                  </div>
                </div>
                <div className="col-12 rbt-scrollable-content">
                  {mounted && items.length === 0 ? (
                    <div className="rbt-empty-state text-center pt--40 pb--40">
                      <div className="rbt-empty-state-icon mb--16">
                        <ScaleIcon />
                      </div>
                      <h6 className="mb--8">No products to compare yet</h6>
                      <p className="rbt-compare-table-text mb--20">
                        Add products to compare and see differences side by
                        side.
                      </p>
                      <div className="d-flex flex-wrap justify-content-center gap-3">
                        <Link href="/shop" className="rbt-btn rbt-btn-sm">
                          Browse Products
                        </Link>
                        <button
                          type="button"
                          className="rbt-btn rbt-btn-sm rbt-btn-border"
                          onClick={close}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    mounted && (
                      <>
                        {/* Start Compare Table */}
                        <table className="rbt-compare-table">
                          <tbody>
                            <tr className="rbt-compare-prd-table-head">
                              <td className="rbt-compare-table-title">
                                <div className="rbt-compare-values">
                                  <span>
                                    <ScaleIcon />
                                  </span>
                                  <p className="rbt-compare-table-text">
                                    Find and select products to see the
                                    differences and similarities between them
                                  </p>
                                </div>
                              </td>
                              {items.map((product) => {
                                const productHref =
                                  getProductDetailsHref(product);

                                return (
                                  <td key={product.id}>
                                    <div className="rbt-compare-item-wrapper">
                                      <button
                                        type="button"
                                        className="rbt-product-remove-btn"
                                        onClick={() =>
                                          removeFromCompareItem(product.id)
                                        }
                                      >
                                        <i className="fa-sharp fa-solid fa-xmark" />
                                      </button>
                                      <Link
                                        href={productHref}
                                        className="rbt-product-item-img"
                                      >
                                        <Image
                                          alt="Product Image"
                                          src={product.imgSrc}
                                          width={510}
                                          height={692}
                                        />
                                      </Link>
                                      <div className="rbt-compare-values">
                                        <Link
                                          href="/shop-by-category"
                                          className="rbt-product-item-category"
                                        >
                                          {product.category?.[0] ?? "Fashion"}
                                        </Link>
                                        <h6 className="rbt-product-item-title">
                                          <Link href={productHref}>
                                            {product.title}
                                          </Link>
                                        </h6>
                                        <AddToCart product={product} />
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Customer Rating
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    <ProductRating product={product} />
                                  </div>
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Price
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    <span className="rbt-product-price">
                                      ${product.price.toFixed(2)}
                                    </span>
                                  </div>
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Sold By
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    {product.soldBy ?? "Avokarto"}
                                  </div>
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Color
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    {product.color ??
                                      product.filterColor?.[0] ??
                                      "Seasonal color"}
                                  </div>
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Fit Type
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    {product.fitType ?? "Regular"}
                                  </div>
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Item Dimensions
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    {product.dimensions ?? "See size guide"}
                                  </div>
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="rbt-product-feature-name">
                                Special Features
                              </td>
                              {items.map((product, i) => (
                                <td key={i}>
                                  <div className="rbt-compare-values">
                                    {product.features ??
                                      "Comfort fabric, easy styling, durable finish"}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                        {/* End Compare Table */}
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
            {/* End Componente Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
