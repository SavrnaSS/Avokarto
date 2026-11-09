import { PhoneReceiverIcon, PaperPlaneIcon, EnvelopeIcon } from "../../svg-icons";
import Tooltip from "@/components/common/ui/Tooltip";
import ContactForm from "./ContactForm";
import type { PublicStoreSettings } from "@/lib/backend/storefront-data";

export default function Contact({ settings }: { settings: PublicStoreSettings }) {
  const hasContactChannel =
    settings.supportPhone || settings.supportEmail || settings.chatLink;

  return (
    <div className="rbt-component-area rbt-bg-color-gray-light">
      <div className="container">
        <div className="row row--24 row--16 mt_dec--24">
          <div className="col-12 col-xl-6 mt--24">
            <div className="rbt-component-section-title rbt-gap--4 mb--24 p-0 border-0 text-left">
              <h1 className="rbt-title h1 rbt-scroll-trigger fade_in animation-order-2 mb--16">
                <span className="rbt-bold--text">Contact Us </span>
              </h1>
              <p className="desc mb--0">
                Reach out by phone, email, or the form and our team will get
                back to you.
              </p>
            </div>
            {hasContactChannel ? (
              <div className="rbt-btn-grp justify-content-between rbt-gap--16 flex-wrap">
                {settings.supportPhone ? (
                  <Tooltip content="Call via Phone" placement="top">
                    <a
                      href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`}
                      className="rbt-trns-modern-btn tooltips"
                    >
                      <span className="icon">
                        <PhoneReceiverIcon />
                      </span>
                      {settings.supportPhone}
                    </a>
                  </Tooltip>
                ) : null}
                {settings.supportEmail ? (
                  <Tooltip content="Email to" placement="top">
                    <a
                      href={`mailto:${settings.supportEmail}`}
                      className="rbt-trns-modern-btn tooltips"
                    >
                      <span className="icon">
                        <EnvelopeIcon />
                      </span>
                      {settings.supportEmail}
                    </a>
                  </Tooltip>
                ) : null}
                {settings.chatLink ? (
                  <Tooltip content="Chat with us" placement="top">
                    <a
                      href={settings.chatLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rbt-trns-modern-btn tooltips"
                    >
                      <span className="icon">
                        <PaperPlaneIcon />
                      </span>
                      Chat with us
                    </a>
                  </Tooltip>
                ) : null}
              </div>
            ) : null}
            {settings.address ? (
              <div className="row row--16 mt--24 mt_sm--0 mt_md--0">
                <div className="col-12 col-md-6 col-lg-6 mt--24">
                  <div className="rbt-location-card style-two">
                    <div className="inner">
                      <h6 className="rbt-location-card-title">
                        <i className="fa-sharp fa-regular fa-location-dot mr--4" />
                        {settings.storeName || "Our Store"}
                      </h6>
                      <p className="rbt-location-card-text">{settings.address}</p>
                      <ul className="rbt-contact-info-list">
                        {settings.supportPhone ? (
                          <li>
                            <span>Phone : </span>
                            <a
                              href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`}
                              className="rbt-contact-info-single color-primary"
                            >
                              {settings.supportPhone}
                            </a>
                          </li>
                        ) : null}
                        {settings.supportEmail ? (
                          <li>
                            <span>Email : </span>
                            <a
                              href={`mailto:${settings.supportEmail}`}
                              className="rbt-contact-info-single color-primary"
                            >
                              {settings.supportEmail}
                            </a>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="col-12 col-xl-6 mt--24">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
