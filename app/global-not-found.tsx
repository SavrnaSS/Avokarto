import type { Metadata } from "next";
import StorefrontChrome from "@/components/common/other-components/StorefrontChrome";
import { SITE_NAME } from "@/lib/seo";
import NotFound from "./(site)/not-found";
import "../public/assets/scss/main.scss";

// URLs that match no route. The app has two root layouts - the storefront
// (app/(site)) and the admin (app/admin) - so this page brings its own
// <html> and the storefront styles (see next.config.ts experimental.globalNotFound).
export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: `Page not found | ${SITE_NAME}`,
};

export default function GlobalNotFound() {
  return (
    <html className="font-vars" lang="en">
      <body>
        <StorefrontChrome>
          <NotFound />
        </StorefrontChrome>
      </body>
    </html>
  );
}
