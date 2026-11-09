"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Image from "next/image";
import Link from "next/link";
import LanguageSelect from "../common/select/LanguageSelect";
import CurrencySelect from "../common/select/CurrencySelect";
import CompareItemLength from "../store/CompareItemLength";
import CartItemsLength from "../store/CartItemsLength";
import WishlistLength from "../store/WishlistLength";
import CartItemsTotal from "../store/CartItemsTotal";
import SearchDropdownCommon from "./headerComponents/SearchDropdownCommon";
import SearchWithCategory from "./headerComponents/SearchWithCategory";
import TopbarSwiper from "./headerComponents/TopbarSwiper";
import PromoTextScroller from "./headerComponents/PromoTextScroller";
import CommonSearchToggler from "./headerComponents/CommonSearchToggler";
import CartSidebarToggler from "./headerComponents/CartSidebarToggler";
import TopbarRemover from "./headerComponents/TopbarRemover";
import { useSticky } from "@/hooks/useSticky";
import MobileMenuToggler from "../action-buttons/MobileMenuToggler";
import Tooltip from "@/components/common/ui/Tooltip";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import AccountAccessBox from "./headerComponents/AccountAccessBox";
import { contactInfo } from "@/data/contact";
import { useTranslation } from "@/lib/i18n/translations";

export default function Header2({ sticky = false }) {
  const isSticky = useSticky();
  const isStickyActive = sticky && isSticky;
  const stickyClass = isStickyActive ? " rbt-sticky" : "";
  const { t } = useTranslation();
  const pathname = usePathname();
  // Below xl, the inline SearchWithCategory bar is hidden and the header's
  // only other search entry point (CommonSearchToggler + SearchDropdownCommon)
  // lives inside the secondary sticky bar, which stays
  // visibility:hidden/height:0 with a clip-path reveal transition that's
  // only ever initialized for the post-scroll sticky context - so it never
  // actually renders when opened before that. Rather than fight that
  // legacy, scroll-coupled system, this is a small self-contained
  // toggle + panel wrapping the same SearchWithCategory used at xl+, so
  // search is reachable immediately on any viewport, regardless of scroll
  // position.
  const [compactSearchOpen, setCompactSearchOpen] = useState(false);
  const compactSearchRef = useRef<HTMLDivElement>(null);
  const compactSearchTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!compactSearchOpen) return;

    // This fires on mousedown, which lands before the trigger button's own
    // onClick (a click event) - without excluding the button here too, a
    // second press meant to close the panel closes it via this handler
    // first, then the button's own toggle handler immediately reopens it.
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !compactSearchRef.current?.contains(target) &&
        !compactSearchTriggerRef.current?.contains(target)
      ) {
        setCompactSearchOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCompactSearchOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [compactSearchOpen]);

  // A navigated-to search result (or any other link) should close the
  // panel rather than leave it floating over the next page.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCompactSearchOpen(false), [pathname]);

  return (
    <header className="rbt-header rbt-header-2" style={{ position: "relative" }}>
      <div
        className={`rbt-header-wrapper rbt-header-sticky-activation rbt-header-wrapper-one header-space-between rbt-bg-color-white header-not-transparent header-sticky plr--0${stickyClass}`}
      >
        <div className="rbt-topbar-section rbt-topbar-one">
          <div className="container">
            <div className="row align-items-center d-none d-md-flex mlr--0 row--0">
              <div className="col-lg-6 col-md-6 col-12">
                <div className="rbt-fancy-item fancy-menu-text fancy-menu-start">
                  <div className="rbt-fancy-text">
                    <strong>{t("Trending Now :")}</strong>
                    <PromoTextScroller />
                  </div>
                </div>
              </div>
              <div className="col-lg-6 col-md-6 col-12">
                <div className="rbt-header-sec-col rbt-header-right rbt-fancy-item fancy-menu-address fancy-menu-end">
                  <div className="rbt-header-content m--0">
                    <ul className="rbt-quick-access d-none d-lg-flex">
                      <li className="rbt-access-box">
                        <div className="header-info">
                          <Link
                            href={`/my-order-history`}
                            className="rbt-access-link"
                          >
                            {t("Track Your Order")}
                          </Link>
                        </div>
                        <div className="header-info">
                          <CurrencySelect />
                        </div>
                        <div className="header-info">
                          <LanguageSelect />
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rbt-separator-mid">
          <hr className="rbt-separator rbt-separator-gray100 m-0" />
        </div>
        <div className="rbt-wrapper-middle rbt-header-middle-one">
          <div className="container">
            <div className="mainbar-row @@navigationEnd align-items-center">
              <div className="header-left">
                {/* Start Mobile-Menu-Bar */}
                <div className="mobile-menu-bar d-block d-xl-none">
                  <div className="hamburger">
                    <MobileMenuToggler />
                  </div>
                </div>
                {/* Start Mobile-Menu-Bar */}
                <div className="rbt-header-content">
                  <div className="header-info">
                    <div className="logo">
                      <Link href={`/marketplace`}>
                        <Image
                          alt="Avokarto logo"
                          src="/assets/images/logo/avokarto-logo-mark.webp"
                          width={512}
                          height={512}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {!isStickyActive && (
                <div className="rbt-header-content d-none d-xl-block">
                  <div className="header-info">
                    <SearchWithCategory parentClass="rbt-search-with-category uni-header-swc-one" />
                  </div>
                </div>
              )}
              <div className="header-right">
                {/* Navbar Icons */}
                <ul className="rbt-quick-access">
                  <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-1 rbt-access-box-has-bg-hover d-xl-none">
                    <Tooltip content={t("Search")} placement="bottom">
                      <button
                        ref={compactSearchTriggerRef}
                        type="button"
                        className="rbt-round-btn has-rbt-md-fsize"
                        aria-label={t("Search")}
                        aria-expanded={compactSearchOpen}
                        aria-controls="header-compact-search-panel"
                        onClick={() => setCompactSearchOpen((current) => !current)}
                      >
                        <i
                          className={`fa-regular ${compactSearchOpen ? "fa-xmark" : "fa-magnifying-glass"}`}
                        />
                      </button>
                    </Tooltip>
                  </li>
                  <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-1 rbt-access-box-has-bg-hover d-none d-lg-flex">
                    <a href={contactInfo.phoneHref} className="rbt-access-box-wrapper">
                      <div className="rbt-round-btn rbt-bg-static-gray">
                        <i className="fa-regular fa-phone" />
                      </div>
                      <div className="content p-0">
                        <p>{t("Hotline")}</p>
                        <span>{contactInfo.phone}</span>
                      </div>
                    </a>
                  </li>
                  <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-2 rbt-access-box-has-bg-hover">
                    <AccountAccessBox />
                  </li>
                  <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-3 rbt-access-box-has-bg-hover rbt-mini-cart">
                    <CartSidebarToggler className="rbt-access-box-wrapper rbt-cart-sidenav-activation">
                      <div className="rbt-round-btn rbt-bg-static-gray">
                        <i className="fa-regular fa-bag-shopping" />
                        <span className="access-box-count rbt-shiny">
                          <CartItemsLength />
                        </span>
                      </div>
                      <div className="content p-0">
                        <p>{t("Total Cart")}</p>
                        <span>
                          {t("Total")} <CartItemsTotal />
                        </span>
                      </div>
                    </CartSidebarToggler>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {compactSearchOpen && (
        <div
          id="header-compact-search-panel"
          className="d-xl-none"
          ref={compactSearchRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 90,
            background: "var(--color-white)",
            boxShadow: "var(--shadow-3, 0 12px 32px rgba(0, 0, 0, 0.12))",
            padding: "16px 0",
          }}
        >
          <div className="container">
            <SearchWithCategory parentClass="rbt-search-with-category uni-header-swc-one" />
          </div>
        </div>
      )}
      {/* Start Header Mid */}
      <div className="rbt-header-middle position-relative rbt-header-mid-1 rbt-bg-color-primary d-none d-xl-block">
        <div className="container">
          <div className="rbt-header-sec align-items-center @@flexDirection">
            <div className="rbt-main-navigation d-none d-xl-block">
              <nav className="rbt-mainmenu-nav">
                <ul className="mainmenu has-nav-bg-shape-hover">
                  <Nav />
                </ul>
              </nav>
            </div>
            <div className="rbt-header-sec-col rbt-header-right" />
          </div>
        </div>
      </div>
      {/* End Header Top */}
      <div
        className={`rbt-header-common-sticky-activation rbt-header-wrapper-common justify-content-between rbt-bg-color-white${stickyClass}`}
      >
        <div className="rbt-header-campaign rbt-header-campaign-1 rbt-header-top-news rbt-topbar-bg-img rbt-topbar-bg-one w-100">
          <div className="rbt-corner-portion-wrapper">
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-6">
                  <div className="inner justify-content-center">
                    <TopbarSwiper />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="icon-close position-right">
            <TopbarRemover />
          </div>
        </div>
        <div className="container">
          <div className="mainbar-row rbt-mainbar-row-md-height  align-items-center">
            <div className="header-left">
              <div className="rbt-header-content d-flex">
                <div className="header-info d-xl-block d-none">
                  <div className="logo rbt-logo-height-sm">
                    <Link href={`/marketplace`}>
                      <Image
                        alt="Avokarto logo"
                        src="/assets/images/logo/avokarto-logo-mark.webp"
                        width={512}
                        height={512}
                      />
                    </Link>
                  </div>
                </div>
              </div>
              {/* Start Mobile-Menu-Bar */}
              <div className="mobile-menu-bar d-block d-xl-none">
                <div className="hamburger">
                  <MobileMenuToggler />
                </div>
              </div>
              {/* Start Mobile-Menu-Bar */}
            </div>
            <div className="header-info d-xl-none d-block">
              <div className="logo">
                <Link href={`/marketplace`}>
                  <Image
                    alt="Avokarto logo"
                    src="/assets/images/logo/avokarto-logo-mark.webp"
                    width={512}
                    height={512}
                  />
                </Link>
              </div>
            </div>
            <div className="rbt-header-content d-none d-xl-block">
              <div className="header-info">
                <nav className="rbt-mainmenu-nav">
                  <ul className="mainmenu mainmenu has-nav-bg-shape-hover">
                    <Nav />
                  </ul>
                </nav>
              </div>
            </div>
            <div className="header-right">
              {/* Navbar Icons */}
              <ul className="rbt-quick-access rbt-gap--12">
                <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-2">
                  <Tooltip content={t("Search")} placement="bottom">
                    <div className="tooltips tooltip-distance-lg">
                      <CommonSearchToggler />
                    </div>
                  </Tooltip>
                </li>
                <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-3 d-none d-lg-flex">
                  <Tooltip content={t("Sign In")} placement="bottom">
                    <ModalTriggerButton
                      className="rbt-round-btn has-rbt-md-fsize tooltips tooltip-distance-lg"
                      openModalName="signinModal"
                    >
                      <i className="fa-regular fa-user" />
                    </ModalTriggerButton>
                  </Tooltip>
                </li>
                <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-4 d-none d-lg-flex">
                  <Tooltip content={t("Compare")} placement="bottom">
                    <ModalTriggerButton
                      as="div"
                      className="rbt-round-btn has-rbt-md-fsize tooltips tooltip-distance-lg"
                      openModalName="compareReviewModal"
                    >
                      <i className="fa-regular fa-code-compare" />
                      <div className="access-box-count">
                        {" "}
                        <CompareItemLength />
                      </div>
                    </ModalTriggerButton>
                  </Tooltip>
                </li>
                <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-5 rbt-wishlist d-none d-lg-flex">
                  <Tooltip content={t("Wishlist")} placement="bottom">
                    <ModalTriggerButton
                      as="div"
                      className="rbt-round-btn has-rbt-md-fsize tooltips tooltip-distance-lg"
                      openModalName="wishlistModal"
                    >
                      <i className="fa-regular fa-heart" />
                      <div className="access-box-count">
                        <WishlistLength />
                      </div>
                    </ModalTriggerButton>
                  </Tooltip>
                </li>
                <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-5 rbt-access-box-has-bg-hover rbt-mini-cart">
                  <Tooltip content={t("Cart")} placement="bottom">
                    <span>
                      <CartSidebarToggler className="rbt-access-box-wrapper rbt-cart-sidenav-activation tooltips tooltip-distance-lg">
                        <span className="rbt-round-btn has-rbt-md-fsize">
                          <i className="fa-regular fa-bag-shopping" />
                          <span className="access-box-count rbt-shiny">
                            <CartItemsLength />
                          </span>
                        </span>
                        <div className="content ml--4">
                          <span className="title-text">
                            <CartItemsTotal />
                          </span>
                        </div>
                      </CartSidebarToggler>
                    </span>
                  </Tooltip>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Start Search Dropdown  */}
        <SearchDropdownCommon />
        {/* End Search Dropdown  */}
      </div>
    </header>
  );
}
