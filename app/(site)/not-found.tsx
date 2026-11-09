import { AvokartoLogoIcon } from '@/components/svg-icons';
import Link from "next/link";
import Image from "next/image";
import Footer10 from "@/components/footers/Footer10";
import Header2 from "@/components/headers/Header2";

export default function page() {
  return (
    <>
      <Header2 sticky={true} />
      <div className="rbt-component-area rbt-error-area rbt-section-gapBottom rbt-bg-color-gray-light">
        <div className="container">
          <div className="rbt-fshape-box-outline-style">
            <div className="row justify-content-center text-center">
              <div className="col-12">
                <div className="rbt-error-content">
                  <h1 className="rbt-error-title">404</h1>
                  <Image
                    className="error-bg-shape"
                    alt="background shape"
                    src="/assets/images/error/error-shape-1.webp"
                    width={964}
                    height={219}
                  />
                  <h3 className="rbt-error-subtitle">
                    This is somewhat embarrassing, isn&apos;t it?
                  </h3>
                  <p className="rbt-error-description">
                    It looks like nothing was found at this location. Maybe try
                    to search for what you are looking for?
                  </p>
                  <Link className="rbt-btn" href={`/shop`}>
                    <span className="btn-text">Browse Products</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12 d-flex mx-auto">
                <div className="rbt-fshape-box-outline-bottom-style rbt-bg-color-white">
                  <div className="rbt-svg-bottom-portion">
                    <AvokartoLogoIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer10 />
    </>
  );
}
