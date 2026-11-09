import Link from "next/link";

export default function Breadcrumb() {
  return (
    <div className="rbt-breadcrumb-two rbt-bg-color-gray-light">
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
                    <i className="fa-solid fa-chevron-right" />
                  </div>
                </li>
                <li className="rbt-breadcrumb-item active">Contact Us</li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="rbt-separator rbt-separator-gray100 mt--24 mb--0" />
      </div>
    </div>
  );
}
