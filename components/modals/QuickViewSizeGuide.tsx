import { CloseIcon } from '../svg-icons';
import { useState } from "react";
import { sizeGuideIn, sizeGuideCm } from "@/data/sizeGuide";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";

export default function QuickViewSizeGuide() {
  const { close } = useManagedModalPanel("quickViewSizeGuideModal");
  const [activeTab, setActiveTab] = useState<"in" | "cm">("in");
  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="quickViewSizeGuideModal"
      tabIndex={-1}
      aria-labelledby="quickViewSizeGuideModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered rbt-size-guide-area">
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
            {/* Start Component Area */}
            <div className="rbt-single-product-area rbt-bg-color-white rbt-content-trs-portion">
              <div className="container">
                <div className="flex-column align-items-start">
                  <h5
                    className="rbt-title rbt-modal-title"
                    id="quickViewSizeGuideModalLabel"
                  >
                    Size Guide
                  </h5>
                  <p className="rbt-modal-description">
                    Masculine Tailored Pants
                  </p>
                  <div className="w-100 d-flex align-items-center justify-content-between">
                    <p className="rbt-modal-subtitle">Find Your Size</p>
                    <div className="rbt-tab rbt-round-shape-tab">
                      {/* Start tabs */}
                      <ul
                        className="nav nav-tabs rbt-tabs-primary mb--0"
                        id="rbt-sizeTab"
                        role="tablist"
                      >
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link nav-link-btn-sm${activeTab === "in" ? " active" : ""}`}
                            id="rbt-tab-id-1"
                            type="button"
                            onClick={() => setActiveTab("in")}
                          >
                            IN
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link nav-link-btn-sm${activeTab === "cm" ? " active" : ""}`}
                            id="rbt-tab-id-2"
                            type="button"
                            onClick={() => setActiveTab("cm")}
                          >
                            CM
                          </button>
                        </li>
                      </ul>
                      {/* End tabs */}
                    </div>
                  </div>
                </div>
                <div className="row pt--16">
                  <div className="col-12 rbt-scrollable-content pb--8">
                    {/* Start tabs content */}
                    <div className="tab-content">
                      {activeTab === "in" && (
                      <div className="tab-pane fade show active">
                        <div className="rbt-responsive-table">
                          <table className="rbt-sizeguide-table">
                            <thead>
                              <tr>
                                <th>Size</th>
                                <th>US Size</th>
                                <th>Chest</th>
                                <th>Waist</th>
                                <th>Low Hip</th>
                                <th>Inseam</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sizeGuideIn.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.size}</td>
                                  <td>{row.usSize}</td>
                                  <td>{row.chest}</td>
                                  <td>{row.waist}</td>
                                  <td>{row.lowHip}</td>
                                  <td>{row.inseam}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      )}
                      {activeTab === "cm" && (
                      <div className="tab-pane fade show active">
                        <div className="rbt-responsive-table">
                          <table className="rbt-sizeguide-table">
                            <thead>
                              <tr>
                                <th>Size</th>
                                <th>US Size</th>
                                <th>Chest</th>
                                <th>Waist</th>
                                <th>Low Hip</th>
                                <th>Inseam</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sizeGuideCm.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.size}</td>
                                  <td>{row.usSize}</td>
                                  <td>{row.chest}</td>
                                  <td>{row.waist}</td>
                                  <td>{row.lowHip}</td>
                                  <td>{row.inseam}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      )}
                    </div>
                    {/* End tabs content */}
                  </div>
                </div>
              </div>
            </div>
            {/* End Component Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
