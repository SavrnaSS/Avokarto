"use client";

import Nav from "./Nav";
import Image from "next/image";
import Link from "next/link";
import LanguageSelect from "../common/select/LanguageSelect";
import CurrencySelect from "../common/select/CurrencySelect";
import CompareItemLength from "../store/CompareItemLength";
import WishlistLength from "../store/WishlistLength";
import CartItemsLength from "../store/CartItemsLength";
import CartItemsTotal from "../store/CartItemsTotal";
import CategorySidebarToggler from "./headerComponents/CategorySidebarToggler";
import SearchDropdownCommon from "./headerComponents/SearchDropdownCommon";
import SearchDropdown from "./headerComponents/SearchDropdown";
import TopbarSwiper from "./headerComponents/TopbarSwiper";
import PromoTextScroller from "./headerComponents/PromoTextScroller";
import CommonSearchToggler from "./headerComponents/CommonSearchToggler";
import CartSidebarToggler from "./headerComponents/CartSidebarToggler";
import TopbarRemover from "./headerComponents/TopbarRemover";
import SearchToggler from "./headerComponents/SearchToggler";
import MiniCartDropdown from "./headerComponents/MiniCartDropdown";
import { useSticky } from "@/hooks/useSticky";
import MobileMenuToggler from "../action-buttons/MobileMenuToggler";
import Tooltip from "@/components/common/ui/Tooltip";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import AccountAccessBox from "./headerComponents/AccountAccessBox";
import { useTranslation } from "@/lib/i18n/translations";

export default function Header7({ sticky = false }) {
  const isSticky = useSticky();
  const stickyClass = sticky && isSticky ? " rbt-sticky" : "";
  const { t } = useTranslation();

  return (
    <header className="rbt-header rbt-header-7">
      {/* Start Header Mid */}
      <div
        className={`rbt-header-wrapper rbt-header-sticky-activation rbt-header-wrapper-three rbt-header-wrapper-one bg @@gapSpaceBetween @@transparent plr--0${stickyClass}`}
      >
        <div className="rbt-topbar-section rbt-topbar-one rbt-bg-color-white">
          <div className="container">
            <div className="row align-items-center d-none d-md-flex mlr--0 row--0">
              <div className="col-lg-3 col-md-12 col-12">
                <div className="rbt-header-sec-col rbt-header-left rbt-fancy-item fancy-menu-address fancy-menu-start">
                  <div className="rbt-header-content">
                    <ul className="rbt-quick-access">
                      <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-1 without-separator">
                        <div className="header-info">
                          <Link href="/contact" className="rbt-access-link">
                            {t("Contact")}
                          </Link>
                        </div>
                        <div className="header-info">
                          <Link
                            href="/my-order-history"
                            className="rbt-access-link"
                          >
                            {t("Track Order")}
                          </Link>
                        </div>
                        <div className="header-info">
                          <Link
                            href="/return-policy"
                            className="rbt-access-link"
                          >
                            {t("Return Policy")}
                          </Link>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-12">
                <div className="rbt-fancy-item fancy-menu-text fancy-menu-center">
                  <div className="rbt-fancy-text">
                    <PromoTextScroller />
                  </div>
                </div>
              </div>
              <div className="col-lg-5 col-md-12 col-12">
                <div className="rbt-header-sec-col rbt-header-right rbt-fancy-item fancy-menu-address fancy-menu-end">
                  <div className="rbt-header-content">
                    <ul className="rbt-quick-access has-sm-separator">
                      <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-1 rbt-contract-info">
                        <div className="text-portion">
                          <i className="fa-regular fa-phone" />
                          <p>{t("Contact 24/7")}</p>
                        </div>
                        <a href="tel:+800300-353-569" className="link-portion">
                          +800 300-353-569
                        </a>
                      </li>
                      <li className="rbt-access-box">
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
        <div className="rbt-header-middle position-relative rbt-header-mid-3 rbt-bg-color-primary">
          <div className="container">
            <div className="rbt-header-sec align-items-center rbt-gap--68">
              <div className="header-info d-flex d-xl-none">
                <div className="hamburger">
                  <MobileMenuToggler />
                </div>
              </div>
              <div className="header-info">
                <div className="logo">
                  <Link href={`/marketplace`}>
                    <Image
                      alt="Avokarto logo"
                      src="/assets/images/logo/avokarto-logo-mark-white.webp"
                      width={512}
                      height={512}
                    />
                  </Link>
                </div>
              </div>
              <div className="rbt-main-navigation d-none d-xl-block">
                <nav className="rbt-mainmenu-nav">
                  <ul className="mainmenu has-nav-bg-shape-hover">
                    <Nav />
                  </ul>
                </nav>
              </div>
              <div className="rbt-header-sec-col rbt-header-right">
                <div className="rbt-header-content">
                  {/* Navbar Icons */}
                  <ul className="rbt-quick-access">
                    <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-2 d-none d-lg-flex">
                      <Tooltip content={t("Search")} placement="bottom">
                        <SearchToggler />
                      </Tooltip>
                    </li>
                    <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-3 rbt-wishlist d-none d-md-flex">
                      <Tooltip content={t("Wishlist")} placement="bottom">
                        <ModalTriggerButton
                          as="div"
                          className="rbt-round-btn rbt-bg-static-gray has-rbt-sm-fsize tooltips tooltip-distance-lg"
                          openModalName="wishlistModal"
                        >
                          <i className="fa-regular fa-heart" />
                          <div className="access-box-count">
                            <WishlistLength />
                          </div>
                        </ModalTriggerButton>
                      </Tooltip>
                    </li>
                    <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-4 rbt-minicart-popup-relative">
                      <a
                        className="rbt-round-btn rbt-bg-static-gray has-rbt-sm-fsize"
                        href="/cart"
                      >
                        <i className="fa-regular fa-bag-shopping" />
                        <span className="access-box-count rbt-shiny">
                          <CartItemsLength />
                        </span>
                      </a>
                      <MiniCartDropdown />
                    </li>
                    <li className="rbt-access-box rbt-scroll-trigger fade_in animation-order-5 rbt-access-box-has-bg-hover d-none d-md-flex">
                      <AccountAccessBox />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SearchDropdown />
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
          <div className="mainbar-row rbt-mainbar-row-md-height @@navigationEnd align-items-center">
            <div className="header-left">
              <div className="rbt-header-content d-flex">
                <div className="header-info p-0 d-none d-xxl-flex mr--24">
                  <CategorySidebarToggler />
                </div>
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
                  <Tooltip content="Sign In" placement="bottom">
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
