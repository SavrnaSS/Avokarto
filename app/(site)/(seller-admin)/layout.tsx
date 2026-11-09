import type { ReactNode } from "react";

// The seller dashboard is a full-screen app (its own top bar and sidebar,
// like Shopify admin), so it skips the storefront header and footer.
export default function SellerAdminLayout({ children }: { children: ReactNode }) {
  return children;
}
