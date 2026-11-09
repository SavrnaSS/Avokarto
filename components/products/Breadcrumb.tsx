import Link from "next/link";

interface BreadcrumbProps {
  containerFull?: boolean;
  title?: string;
}

export default function Breadcrumb({
  containerFull = false,
  title,
}: BreadcrumbProps) {
  return (
    <div className="rbt-breadcrumb-two rbt-bg-color-white">
      <div
        className={`${containerFull ? "rbt-full-width-wrapper" : "container"}`}
      >
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-breadcrumb-inner text-left">
              <ul className="rbt-breadcrumb-page-list justify-content-start mt--0">
                <li className="rbt-breadcrumb-item">
                  <Link href={`/marketplace`}>Home</Link>
                </li>
                <li>
                  <div className="icon-right">
                    <i className="fa-solid fa-chevron-right" />
                  </div>
                </li>

                <li className="rbt-breadcrumb-item active">
                  {title ? title : "Shop"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
