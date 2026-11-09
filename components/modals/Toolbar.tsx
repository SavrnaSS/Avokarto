"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CompareItemLength from "../store/CompareItemLength";
import WishlistLength from "../store/WishlistLength";
import { useUiElement } from "@/context/uiStore";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { toolbarItems } from "@/data/toolbar";

export default function Toolbar() {
  const [isVisible, setIsVisible] = useState(false);
  const { toggleCommonSearch, closeCommonSearch } = useUiElement();

  useEffect(() => {
    const handleScroll = () => {
      closeCommonSearch();

      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || 0;

      setIsVisible(scrollTop >= 400);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [closeCommonSearch]);

  return (
    <div
      className={`rbt-toolbar rbt-toolbar--bottom d-block d-xl-none${
        isVisible ? " visible" : ""
      }`}
    >
      <div className="container p--0">
        <div className="row row--0">
          <div className="col-md-12">
            <ul className="rbt-quick-access onepagenav">
              {toolbarItems.map((item) => (
                <li key={item.id} className="rbt-access-box">
                  {item.isSearchTrigger ? (
                    <button
                      className="rbt-common-search-trigger-active rbt-round-btn has-rbt-md-fsize rbt-modern-close-btn"
                      type="button"
                      onClick={toggleCommonSearch}
                    >
                      <i className={`${item.icon} search-icon`} />
                      <div className="modern-close-wrapper" />
                      <span className="rbt-toolbar-label"> {item.label}</span>
                    </button>
                  ) : item.href ? (
                    <Link
                      className="rbt-round-btn has-rbt-md-fsize"
                      href={item.href}
                    >
                      <i className={item.icon} />
                      <span className="rbt-toolbar-label"> {item.label}</span>
                    </Link>
                  ) : (
                    <>
                      {item.modalTarget ? (
                        <ModalTriggerButton
                          as="div"
                          className="rbt-round-btn has-rbt-md-fsize"
                          openModalName={item.modalTarget}
                        >
                          <i className={item.icon} />
                          {item.id === "compare" && (
                            <div className="access-box-count">
                              <CompareItemLength />
                            </div>
                          )}
                          {item.id === "wishlist" && (
                            <div className="access-box-count">
                              <WishlistLength />
                            </div>
                          )}
                          <span className="rbt-toolbar-label"> {item.label}</span>
                        </ModalTriggerButton>
                      ) : (
                        <div className="rbt-round-btn has-rbt-md-fsize">
                          <i className={item.icon} />
                          {item.id === "compare" && (
                            <div className="access-box-count">
                              <CompareItemLength />
                            </div>
                          )}
                          {item.id === "wishlist" && (
                            <div className="access-box-count">
                              <WishlistLength />
                            </div>
                          )}
                          <span className="rbt-toolbar-label"> {item.label}</span>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
