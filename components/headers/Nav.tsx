"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPathActive } from "@/lib/nav";
import { useTranslation } from "@/lib/i18n/translations";

const NAV_ITEMS = [
  { href: "/marketplace", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop-by-category", label: "Collections" },
  { href: "/marketplace#new-arrivals", label: "New Arrivals" },
  { href: "/marketplace#best-sellers", label: "Best Sellers" },
  { href: "/sellers", label: "Sellers" },
  // Avokarto leads with dropshipping; the marketplace is the shop behind it.
  { href: "/", label: "Start selling" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  // Intentionally not listed here: /admin is the store owner's dashboard,
  // not a public destination. It stays fully reachable by direct URL - the
  // real access control is the auth check in proxy.ts - this just keeps it
  // off the public nav so casual visitors don't notice it exists.
];

function isCurrentRoute(pathname: string, href: string) {
  if (href.startsWith("/marketplace#")) return false;
  if (href === "/marketplace") return pathname === "/marketplace" || pathname === "/home-fashion";

  return isPathActive(pathname, href);
}

export default function Nav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      {NAV_ITEMS.map((item) => (
        <li key={item.href} className={isCurrentRoute(pathname, item.href) ? "active" : ""}>
          <Link href={item.href}>{t(item.label)}</Link>
        </li>
      ))}
    </>
  );
}
