import Link from "next/link";
export default function Breadcrumb({
  subtitle = "Products",
  title = "Compare",
  className = "rbt-breadcrumb-two rbt-bg-color-white",
  hasHrLine = false,
}) {
  return (
    <div className={`${className}`}>
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-breadcrumb-inner text-left">
              <ul className="rbt-breadcrumb-page-list justify-content-start mt--0">
                <li className="rbt-breadcrumb-item">
                  <Link href={`/`}>Home</Link>
                </li>
                <li>
                  <div className="icon-right">
                    <i className="fa-solid fa-chevron-right"></i>
                  </div>
                </li>

                {subtitle ? (
                  <>
                    {/* Plain text, not a Link - there's no single landing
                        page for an intermediate step like "Checkout" (a
                        multi-page flow) or "Products" (several listing
                        pages), so this doesn't pretend to be clickable. */}
                    <li className="rbt-breadcrumb-item">{subtitle}</li>
                    <li>
                      <div className="icon-right">
                        <i className="fa-solid fa-chevron-right"></i>
                      </div>
                    </li>{" "}
                  </>
                ) : (
                  ""
                )}
                <li className="rbt-breadcrumb-item active">{title}</li>
              </ul>
            </div>
          </div>
        </div>
        {hasHrLine ? (
          <hr className="rbt-separator rbt-separator-gray100 mt--24 mb--0" />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
