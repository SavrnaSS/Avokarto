import Image from "next/image";
import Link from "next/link";
import styles from "./Banner.module.css";
export default function Banner() {
  return (
    <div className="rbt-component-area rbt-product-banner-area rbt-section-gapTop rbt-bg-color-gray-light">
      <div className="container">
        {/* Start Product Banner Area */}
        <div className="row row--12 mt_dec--24">
          <div className="col-lg-6 col-md-12 col-sm-12 col-12 mt--24 d-flex justify-content-center">
            <div className="rbt-product-banner rbt-product-banner-style-four rbt-bg-color-gray-one">
              <div className="rbt-banner-inner">
                <div className="rbt-product-banner-img rbt-card-has-animated rbt-scroll-trigger zoom_in animation-order-1">
                  <Image
                    alt="Discover product collections at Avokarto"
                    src="/assets/images/product-banner/product-banner-img-04.webp"
                    width={648}
                    height={380}
                    sizes="(max-width: 991px) 100vw, 50vw"
                  />
                </div>
                <div className="rbt-product-banner-content">
                  <div className="rbt-content-section">
                    <h6 className="rbt-banner-subtitle mb-0 rbt-scroll-trigger fade_in animation-order-1">
                      PET ESSENTIALS &amp; MORE
                    </h6>
                    <h2 className="rbt-banner-title title-capitalize-text mb-0 rbt-scroll-trigger fade_in animation-order-2">
                      <span className="rbt-bold--text">Little, </span>Big Smiles
                    </h2>
                    <p className="rbt-banner-description rbt-scroll-trigger fade_in animation-order-3">
                      Explore pet accessories, practical gadgets    & playful
                      picks for everyday life.
                    </p>
                    <div className="rbt-banner-btn rbt-scroll-trigger fade_in animation-order-4">
                      <Link className="rbt-btn rbt-btn-md" href={`/shop`}>
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12 col-12 mt--24 d-flex justify-content-center">
            <div className={`rbt-product-banner rbt-product-banner-style-four ${styles.saleBanner}`}>
              <div className="rbt-banner-inner">
                <div className="rbt-product-banner-img rbt-card-has-animated rbt-scroll-trigger zoom_in animation-order-1">
                  <Image
                    alt="Crawling Halloween zombie prop with glowing eyes and outstretched hands"
                    src="/assets/images/product-banner/product-banner-zombie.png"
                    width={1464}
                    height={1074}
                    sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 30vw"
                  />
                </div>
                <div className="rbt-product-banner-content">
                  <div className="rbt-content-section">
                    <h6 className="rbt-banner-subtitle mb-0 rbt-scroll-trigger fade_in animation-order-1">
                      HALLOWEEN &amp; NOVELTY
                    </h6>
                    <h2 className="rbt-banner-title title-capitalize-text mb-0 rbt-scroll-trigger fade_in animation-order-2">
                      <span className="rbt-bold--text">Add Some</span> Playfulness
                    </h2>
                    <p className="rbt-banner-description rbt-scroll-trigger fade_in animation-order-3">
                      Discover seasonal decorations and unexpected finds
                      for your space.
                    </p>
                    <div className="rbt-banner-btn rbt-scroll-trigger fade_in animation-order-4">
                      <Link className="rbt-btn rbt-btn-md" href={`/shop`}>
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Product Banner Area */}
      </div>
    </div>
  );
}
