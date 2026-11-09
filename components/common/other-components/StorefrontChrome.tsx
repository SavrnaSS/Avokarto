"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import BootstrapJsLoader from "@/components/common/other-components/BootstrapJsLoader";
import LayoutEffectsLoader from "@/components/common/other-components/LayoutEffectsLoader";
import LayoutModals from "@/components/common/other-components/LayoutModals";
import ProductNavigationEnhancer from "@/components/common/navigation/ProductNavigationEnhancer";
import Toolbar from "@/components/modals/Toolbar";
import CartCatalogProvider from "@/components/store/CartCatalogProvider";

// Reseller stores are their own branded sites; Avokarto's quick-access
// toolbar would read as someone else's navigation there.
function isResellerStorePath(pathname: string | null) {
  // /store-preview is the homepage's demo store, framed the same way.
  return Boolean(pathname?.startsWith("/store/") || pathname === "/store-preview");
}

export default function StorefrontChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The view-only demo store is embedded (up to twice) on the homepage, and
  // every iframe boots its own copy of this chrome. It never uses the cart
  // catalog, session, Bootstrap JS or modals - skipping them keeps each frame's
  // hydration short and stops it holding a live connection of its own.
  if (pathname === "/store-preview") {
    return <main id="main-content">{children}</main>;
  }

  return (
    <CartCatalogProvider>
      <ProductNavigationEnhancer />
      <main id="main-content">{children}</main>
      <BootstrapJsLoader />
      <LayoutEffectsLoader />
      {isResellerStorePath(pathname) ? null : <Toolbar />}
      <LayoutModals />
    </CartCatalogProvider>
  );
}
