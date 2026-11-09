"use client";

import { useMemo } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import InfoSection from "./footerSections/InfoSection";
import Image from "next/image";
import Link from "next/link";
import { footerData, footerDataStores, socialLinks } from "../../data/footer";
import { contactInfo } from "@/data/contact";
import { useTranslation } from "@/lib/i18n/translations";
import { useLiveProducts } from "@/hooks/use-live-products";
import styles from "./Footer3.module.css";
import { FreeShippingAmount, IfFreeShipping } from "@/components/common/FreeShipping";

// Swiper's loop mode needs a healthy multiple of the visible slide count to
// wrap smoothly - with `slidesPerView: "auto"` that's roughly this many
// regardless of viewport. A small catalog (or a fresh store) repeats to
// stay above it instead of tripping Swiper's loop warning or looking
// obviously short.
const MIN_LOOP_SLIDES = 10;

export default function Footer3() {
  const { t } = useTranslation();
  const { products, hasData } = useLiveProducts({ limit: 24 });
  const instaSlides = useMemo(() => {
    if (!products.length) return [];

    const slides = [...products];
    // Cycle through the real catalog again (not just once) rather than
    // padding with placeholders - every slide still links to a real,
    // shoppable product.
    for (let index = 0; slides.length < MIN_LOOP_SLIDES; index++) {
      slides.push(products[index % products.length]);
    }

    return slides.map((product, index) => ({
      product,
      slideKey: `${product.id}-${index}`,
    }));
  }, [products]);

  return (
    <>
      <InfoSection />
      <footer className="rbt-footer rbt-footer-style-three rbt-bg-color-gray-light pt--48">
        <div className="p-0 rbt-footer-top">
          <div className="container">
            <div className="row row--12 mt_dec--24 mb--40 justify-content-between align-items-center mb_sm--16">
              <div className="col-md-6 col-12 mt--24">
                <div className="footer-widget">
                  <div className="rbt-component-section-title border-0 p-0 text-left">
                    <h5 className="rbt-title mb--4">
                      <span className="rbt-bold--text">Avokarto</span>
                    </h5>
                    <p className="description mb--0">
                      {t("Dropship winning products from your own store - or shop the marketplace.")}
                    </p>
                    <IfFreeShipping>
                      <p className="description mt--8 mb--0 rbt-text-color-primary">
                        <i className="fa-light fa-truck-fast mr--8" aria-hidden="true" />
                        {t("Free shipping on orders of {amount} or more").split("{amount}")[0]}<FreeShippingAmount />{t("Free shipping on orders of {amount} or more").split("{amount}")[1]} (USD)
                      </p>
                    </IfFreeShipping>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-12 mt--24">
                <div className="footer-widget">
                  <div className="rbt-footer-social-area d-flex rbt-gap--16 align-items-center justify-content-start justify-content-md-end">
                    <p className="title mb--0">{t("Follow Us :")}</p>
                    <ul className="rbt-social-icon-list">
                      {socialLinks.map((link, index) => (
                        <li key={index}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className={`fa-brands ${link.icon}`} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* Start Instagram Posts Area */}
            {hasData && instaSlides.length ? (
            <div className="row row--12 mb--32 mb_sm--24">
              <div className="col-12">
                <Swiper
                  className="swiper rbt-insta-slider-activation"
                  {...{
                    slidesPerView: "auto",
                    grabCursor: true,
                    spaceBetween: 15,
                    loop: true,
                    speed: 1000,
                    autoplay: {
                      delay: 1500,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    },
                  }}
                  modules={[Autoplay]}
                >
                  {instaSlides.map(({ product, slideKey }) => (
                    <SwiperSlide className="swiper-slide" key={slideKey}>
                      <div className="rbt-instapost text-center rbt-instapost-style-one">
                        <Link
                          href={`/product/${product.slug ?? product.id}`}
                          className="d-block"
                          aria-label={`Shop ${product.title}`}
                        >
                          <div className={`instapost-img ${styles.instaImageFrame}`}>
                            <Image
                              alt={product.title}
                              className={styles.instaImage}
                              src={product.imgSrc}
                              width={400}
                              height={400}
                              sizes="(max-width: 575px) 45vw, 200px"
                            />
                          </div>
                          <div className="instapost-content rbt-gap--4">
                            <span className="insta-icon insta-icon-sm">
                              <i className="fa-brands fa-instagram" />
                            </span>
                            <span className="rbt-btn-link b4">
                              {t("Shop The Look")}
                            </span>
                          </div>
                        </Link>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
            ) : null}
            {/* End Instagram Posts Area */}
            {/* Start WaterMark */}
            <div className="row">
              <div className="col-12">
                <div className="rbt-watermark-text rbt-watermark-color-var-1">
                  <span>Follow@Avokarto</span>
                </div>
              </div>
            </div>
            {/* End WaterMark */}
            <div className="row mt_dec--24">
              <div className="col-12">
                <hr className="rbt-separator m-0" />
              </div>
            </div>
            <div className="row row--12 pt--8 justify-content-between rbt-footer-nav-wrapper mt_dec--24">
              {footerData.map((widget, index) => (
                <div key={index} className="col-12 col-sm-6 col-lg-2 mt--24">
                  <div className="footer-widget rbt-link-hover">
                    <h5 className="ft-title">{t(widget.title)}</h5>
                    <ul className="ft-link">
                      {widget.items.map((item, i) => (
                        <li key={i}>
                          <Link href={item.href}>{t(item.label)}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              <div className="col-12 col-sm-6 col-lg-2 mt--24">
                <div className="footer-widget rbt-link-hover">
                  <h5 className="ft-title">{t(footerDataStores.title)}</h5>
                  <ul className="ft-link">
                    {footerDataStores.items.map((item, i) => (
                      <li key={i}>
                        <Link href={item.href}>{t(item.label)}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3 col-xxl-2 mt--24">
                <div className="footer-widget rbt-link-hover">
                  <h5 className="ft-title">{t("Contact Us")}</h5>
                  <ul className="ft-link">
                    <li>
                      <span>
                        <i className="fa-regular fa-phone mr--4" />
                        <span className="rbt-text-bold mr--4"> {t("Phone:")}</span>
                        <a className="contact-link" href={contactInfo.phoneHref}>
                          {contactInfo.phone}
                        </a>
                      </span>
                    </li>
                    <li>
                      <span>
                        <i className="fa-regular fa-envelope mr--4" />
                        <span className="rbt-text-bold mr--4"> {t("Email:")}</span>
                        <a
                          className="contact-link"
                          href={contactInfo.emailHref}
                        >
                          {contactInfo.email}
                        </a>
                      </span>
                    </li>
                    <li>
                      <span>
                        <i className="fa-regular fa-location-dot mr--4" />
                        <span className="rbt-text-bold mr--4">{t("Location:")}</span>
                        401 Broadway, 24th floor, New York, NY
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rbt-separator-mid pt--56">
          <div className="container">
            <hr className="rbt-separator m-0 rbt-bg-color-gray-100" />
          </div>
        </div>
        {/* Start Copyright Area  */}
        <div className="copyright-area copyright-style-1 pb--32 pt--32">
          <div className="container">
            <div className="row align-items-center justify-content-between row--12 mt_dec--24">
              <div className="col-xl-4 col-lg-6 col-md-12 col-12 mt--24">
                <p className="rbt-link-hover text-center text-lg-start">
                  {t("Copyright")} {new Date().getFullYear()} Avokarto. {t("All rights reserved.")}
                </p>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-12 col-12 mt--24">
                <ul className="payment-img-link">
                  <li>
                    <Link href="/shop">
                      <Image
                        alt="eCommerce Brand Image"
                        src="/assets/images/payment-brand/image-01.webp"
                        width={812}
                        height={64}
                      />
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-xl-4 col-lg-12 col-md-12 col-12 mt--24">
                <ul className="copyright-link rbt-link-hover justify-content-center justify-content-lg-start justify-content-xl-end mt_sm--12 mt_md--12 mt_lg--12">
                  <li>
                    <Link href={`/return-policy`}>{t("Refund policy")}</Link>
                  </li>
                  <li>
                    <Link href={`/privacy-policy`}>{t("Privacy policy")}</Link>
                  </li>
                  <li>
                    <Link href={`/terms-policy`}>{t("Terms & conditions")}</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* End Copyright Area  */}
      </footer>{" "}
    </>
  );
}
