"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const CookiesConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const consented = localStorage.getItem("cookies-consented");
    if (pathname === "/home-electronics" && !consented && !hasBeenShown) {
      // Show after a small delay for a smoother entrance
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pathname, hasBeenShown]);

  const handleConsent = () => {
    localStorage.setItem("cookies-consented", "true");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className={`rbt-cookies ${isVisible ? "isVisible" : ""}`}>
      <div className="rbt-icon">
        <Image
          src="/assets/images/icons/cookie.svg"
          alt="Cookie Icon"
          width={48}
          height={49}
          style={{ width: 40, height: "auto" }}
        />
      </div>
      <div className="rbt-content">
        <div className="rbt-cookie-info">
          <p className="b2 mb--4 rbt-text-bold rbt-text-color-heading">
            We Care About Your Privacy
          </p>
          <p className="b4 mb--0 rbt-text-color-gray-600">
            We use cookies &amp; similar technologies to provide the best
            experience on our website.{" "}
            <a
              href="#!"
              className="rbt-btn-link rbt-text-color-heading rbt-text-bold b4"
            >
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="rbt-gap--8 rbt-btn-group">
          <button
            className="rbt-btn rbt-btn-md rbt-btn-gray-light rbt-cookies-decline-btn"
            onClick={handleConsent}
          >
            Decline
          </button>
          <button
            className="rbt-btn rbt-btn-md rbt-cookies-accept-btn"
            onClick={handleConsent}
          >
            Accept
          </button>
        </div>
      </div>
      <button className="rbt-close-btn" onClick={handleClose}>
        <i className="fa-sharp fa-solid fa-xmark" />
      </button>
    </div>
  );
};

export default CookiesConsent;
