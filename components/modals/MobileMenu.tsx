"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { contactInfo } from "@/data/contact";
import { mobileMenuSocialLinks } from "@/data/socials";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { isPathActive } from "@/lib/nav";
import { getStackedModalZIndex } from "@/lib/modalStack";
import CurrencySelect from "@/components/common/select/CurrencySelect";
import { useLiveCategories } from "@/hooks/use-live-categories";
import styles from "./MobileMenu.module.css";

const MENU_LINKS = [
  { href: "/marketplace", label: "Home", icon: "fa-regular fa-house" },
  { href: "/shop", label: "Shop", icon: "fa-regular fa-bag-shopping" },
  { href: "/marketplace#new-arrivals", label: "New Arrivals", icon: "fa-regular fa-sparkles" },
  { href: "/marketplace#clearance", label: "Clearance", icon: "fa-regular fa-tag" },
  { href: "/marketplace#best-sellers", label: "Best Sellers", icon: "fa-regular fa-stars" },
  { href: "/", label: "Start selling", icon: "fa-regular fa-store" },
  { href: "/my-order-history", label: "Track Order", icon: "fa-regular fa-truck-fast" },
  { href: "/about", label: "About", icon: "fa-regular fa-circle-info" },
  { href: "/contact", label: "Contact", icon: "fa-regular fa-headset" },
];

// What the store sells - one line under the logo. Keep in step with the
// shop page's metadata description (app/(shop)/.../shop/page.tsx).
const STORE_TAGLINE =
  "Costumes, carriers, and care for cats and dogs, plus playful seasonal finds for your home.";
// Short enough to fit the menu's search field on a 360px phone.
const SEARCH_PLACEHOLDER = "Search costumes & more";

function isCurrentRoute(pathname: string, href: string) {
  // Marketplace section anchors aren't pages - there only Home is current.
  if (href.startsWith("/marketplace#")) return false;
  if (href === "/marketplace") return pathname === "/marketplace" || pathname === "/home-fashion";

  return isPathActive(pathname, href);
}

export default function MobileMenu() {
  const {
    activeBsModal,
    isAnimatedOpen: mobileMenuOpen,
    close,
  } = useManagedModalPanel("mobileMenu");
  const pathname = usePathname();
  const router = useRouter();
  const [activeRootTab, setActiveRootTab] = useState<"menu" | "categories">(
    "menu",
  );
  const [query, setQuery] = useState("");
  // Live admin categories (realtime "categories" topic). Only published ones
  // that actually have products are worth a tap from the menu.
  const { categories, loading: categoriesLoading, error: categoriesError, hasData: categoriesReady, refresh: refreshCategories } = useLiveCategories();
  const shopCategories = useMemo(
    () =>
      categories
        .filter((category) => category.status === "published" && category.count > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  );

  const closeMenu = () => {
    setActiveRootTab("menu");
    close();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    setQuery("");
    closeMenu();
  };

  const handleBackdropClick = () => {
    if (mobileMenuOpen) closeMenu();
  };

  return (
    <div
      className={`popup-mobile-menu ${mobileMenuOpen ? "active" : ""}`}
      onClick={handleBackdropClick}
      role="presentation"
      style={{
        zIndex: getStackedModalZIndex(activeBsModal, "mobileMenu"),
      }}
    >
      <div className="inner-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-top">
          <div className="inner-top">
            <div className="content">
              <div className="logo">
                <Link href="/" onClick={closeMenu}>
                  <Image
                    alt="Avokarto logo"
                    src="/assets/images/logo/avokarto-logo-mark.webp"
                    width={512}
                    height={512}
                  />
                </Link>
              </div>
              <div className="rbt-btn-close">
                <button
                  className="close-button rbt-round-btn"
                  onClick={closeMenu}
                  type="button"
                  aria-label="Close mobile menu"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between mt--12 mb--12">
              <span>Currency</span>
              <CurrencySelect />
            </div>
            <p className="description">{STORE_TAGLINE}</p>
            <form
              className="rbt-inner-search-field style-one rbt-search-field-rounded rbt-search-field-sm-width"
              role="search"
              onSubmit={handleSearch}
            >
              <input
                type="search"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={SEARCH_PLACEHOLDER}
                aria-label="Search products"
                enterKeyHint="search"
                autoComplete="off"
              />
              <button
                className="rbt-round-btn search-btn rbt-text-color-gray-500"
                type="submit"
                aria-label="Search products"
              >
                <i className="fa-solid fa-magnifying-glass" />
              </button>
            </form>
          </div>
          <div className="rbt-tab rbt-round-shape-tab">
            <ul
              className="nav nav-tabs mb--0"
              id="mobile-menuTab"
              role="tablist"
            >
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link${activeRootTab === "menu" ? " active" : ""}`}
                  id="rbt-tab-mobile-menu-1"
                  type="button"
                  role="tab"
                  aria-controls="rbt-tab-pane-mobile-menu-1"
                  aria-selected={activeRootTab === "menu"}
                  onClick={() => setActiveRootTab("menu")}
                >
                  <i className="fa-solid fa-bars-sort" />
                  Menu
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link${
                    activeRootTab === "categories" ? " active" : ""
                  }`}
                  id="rbt-tab-mobile-menu-2"
                  type="button"
                  role="tab"
                  aria-controls="rbt-tab-pane-mobile-menu-2"
                  aria-selected={activeRootTab === "categories"}
                  onClick={() => setActiveRootTab("categories")}
                >
                  <i className="fa-sharp fa-regular fa-layer-group" />
                  Categories
                </button>
              </li>
            </ul>
            <div className="tab-content" id="mobile-menuTabContent">
              <div
                className="tab-pane fade show active"
                id={
                  activeRootTab === "menu"
                    ? "rbt-tab-pane-mobile-menu-1"
                    : "rbt-tab-pane-mobile-menu-2"
                }
                role="tabpanel"
                aria-labelledby={
                  activeRootTab === "menu"
                    ? "rbt-tab-mobile-menu-1"
                    : "rbt-tab-mobile-menu-2"
                }
                tabIndex={0}
              >
                <nav
                  className="rbt-mainmenu-nav"
                  aria-label={activeRootTab === "menu" ? "Main menu" : "Shop by category"}
                >
                  {activeRootTab === "menu" ? (
                    <ul className="mainmenu">
                      {MENU_LINKS.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={closeMenu}
                            className={
                              isCurrentRoute(pathname, item.href) ? "active" : ""
                            }
                          >
                            <span>
                              <i className={`rbt-categories-icon mr--8 ${item.icon}`} />
                            </span>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Own list (not `.mainmenu`) so the theme's text-link rows
                    // don't apply; styled to match the desktop category menu.
                    <ul className={styles.catList}>
                      <li>
                        <Link
                          href="/shop"
                          onClick={closeMenu}
                          className={`${styles.catRow} ${styles.catRowAll}`}
                        >
                          <span className={styles.catThumb} aria-hidden="true">
                            <i className="fa-regular fa-bag-shopping" />
                          </span>
                          <span className={styles.catName}>Shop all products</span>
                          <i className={`fa-regular fa-chevron-right ${styles.catArrow}`} aria-hidden="true" />
                        </Link>
                      </li>
                      {shopCategories.map((category) => (
                        <li key={category.id}>
                          <Link
                            href={`/shop?category=${encodeURIComponent(category.name)}`}
                            onClick={closeMenu}
                            className={styles.catRow}
                          >
                            <span className={styles.catThumb} aria-hidden="true">
                              {category.image ? (
                                <Image
                                  src={category.image}
                                  alt=""
                                  width={40}
                                  height={40}
                                  sizes="40px"
                                  // Rendered only when the tab opens - load
                                  // now rather than lazily, so no blank slot.
                                  loading="eager"
                                />
                              ) : (
                                <i className="fa-regular fa-tag" />
                              )}
                            </span>
                            <span className={styles.catName}>{category.name}</span>
                            <span
                              className={styles.catCount}
                              aria-label={`${category.count} ${category.count === 1 ? "product" : "products"}`}
                            >
                              {category.count}
                            </span>
                            <i className={`fa-regular fa-chevron-right ${styles.catArrow}`} aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                      {categoriesLoading && !shopCategories.length ? (
                        <li className={styles.catStatus} role="status">
                          Loading categories…
                        </li>
                      ) : categoriesError ? (
                        <li className={styles.catStatus} role="status">
                          {categoriesReady ? "Categories could not be updated." : "Unable to load categories."}{" "}
                          <button type="button" className="rbt-btn-link" onClick={refreshCategories}>Try again</button>
                        </li>
                      ) : categoriesReady && !shopCategories.length ? (
                        <li className={styles.catStatus} role="status">No categories with products yet.</li>
                      ) : null}
                    </ul>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
        <div className="mobile-menu-bottom">
          <div className="social-share-wrapper">
            <span className="rbt-short-title d-block">Follow us</span>
            <ul className="rbt-social-icon-list mt--12">
              {mobileMenuSocialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                  >
                    <i className={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <ul className="navbar-top-left rbt-information-list justify-content-center">
            <li>
              <a href={contactInfo.emailHref}>
                <i className="fa-light fa-envelope" />
                {contactInfo.email}
              </a>
            </li>
            <li>
              <a href={contactInfo.phoneHref}>
                <i className="fa-regular fa-phone" />
                {contactInfo.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
