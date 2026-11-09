"use client";

import Image from "next/image";
import Link from "next/link";
import { footerData, socialLinks } from "../../data/footer";
import { contactInfo } from "@/data/contact";
import FooterNewsletterForm from "./FooterNewsletterForm";
import { useTranslation } from "@/lib/i18n/translations";

export default function Footer10() {
  const { t } = useTranslation();
  return (
    <footer className="rbt-footer rbt-footer-style-ten rbt-bg-color-gray-light">
      <div className="rbt-footer-top rbt-section-gap2">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="rbt-watermark-text rbt-watermark-color-var-1 text-center">
                <span>Follow@Avokarto</span>
              </div>
            </div>
          </div>
          <div className="row mt_dec--24">
            <div className="col-12">
              <hr className="rbt-separator m-0" />
            </div>
          </div>
          <div className="row row--16 justify-content-between pt--32 rbt-footer-nav-wrapper">
            <div className="col-lg-4 col-md-6 col-sm-12 col-12 mt--24">
              <div className="footer-widget">
                <div className="logo">
                  <Link href="/marketplace">
                    <Image
                      alt="Avokarto logo"
                      src="/assets/images/logo/avokarto-logo-mark.webp"
                      width={512}
                      height={512}
                    />
                  </Link>
                </div>
                <p className="description pr--52 pr_sm--0">
                  {t(
                    "Avokarto is the all-in-one dropshipping platform: launch your own store, sell winning products and let us ship every order.",
                  )}
                </p>
                <div className="footer-widget mt--40">
                  <ul className="ft-link">
                    <li>
                      <p>{t("Subscribe for new arrivals and private offers.")}</p>
                    </li>
                  </ul>
                  <FooterNewsletterForm formClass="rbt-newsletter-form-one mt--24" />
                </div>
                <div className="footer-widget mt--40">
                  <ul className="ft-link">
                    <li>
                      <div className="rbt-quick-contact-box border-0 bg-transparent pl--0">
                        <a
                          href={contactInfo.phoneHref}
                          className="rbt-icon rbt-text-color-heading h2 mb--0 rbt-text-medium"
                        >
                          <i className="fa-regular fa-phone" />
                        </a>
                        <div className="rbt-quick-contact-info border-0 rbt-link-hover pl--0">
                          <p className="b1 mb--0 rbt-text-color-gray-500">
                            {t("Need help? Call now!")}
                          </p>
                          <a
                            href={contactInfo.phoneHref}
                            className="rbt-text-color-heading rbt-text-bold rbt-link-hover"
                          >
                            {contactInfo.phone}
                          </a>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-8 col-md-6 col-sm-12 col-12 mt--24">
              <div className="row row--16 mt_dec--24">
                {footerData.map((widget, index) => (
                  <div
                    key={index}
                    className="col-lg-3 col-md-6 col-sm-6 col-12 mt--24"
                  >
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
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rbt-separator-mid">
        <div className="container">
          <hr className="rbt-separator m-0" />
        </div>
      </div>
      {/* Start Copyright Area  */}
      <div className="copyright-area copyright-style-1">
        <div className="container">
          <div className="row row--16 mt_dec--24 align-items-center justify-content-between">
            <div className="col-xxl-4 col-xl-3 col-lg-4 col-md-12 col-12 mt--24">
              <div className="rbt-footer-social-area justify-content-center justify-content-lg-start d-flex flex-wrap rbt-gap--16">
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
            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-12 col-12 mt--24">
              <p className="rbt-link-hover text-center text-lg-start">
                {t("Copyright")} {new Date().getFullYear()} Avokarto.{" "}
                {t("All rights reserved.")}
              </p>
            </div>
            <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-12 col-12 mt--24">
              <ul className="payment-img-link justify-content-center justify-content-lg-start justify-content-xl-end">
                <li>
                  <Link href="/shop">
                    <Image
                      alt="Payment Brand Image"
                      src="/assets/images/payment-brand/image-01.webp"
                      width={812}
                      height={64}
                    />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* End Copyright Area  */}
    </footer>
  );
}
