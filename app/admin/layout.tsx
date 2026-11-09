import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { adminBranding } from "@/admin/config/branding";
import { siteConfig } from "@/admin/config/site";
import { AppProviders } from "@/admin/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: [
      {
        url: adminBranding.logo.favicon,
        type: "image/png",
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#174d0a",
};

// Before paint: apply the theme saved by the header toggle, so a dark-mode
// admin doesn't flash light on every load.
const themeScript = `try{if(localStorage.getItem("unimart-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

/**
 * The admin is its own root layout: it loads only its Tailwind styles, never
 * the storefront's Bootstrap/template bundle (that lives in app/(site)).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppProviders>
          <div className="admin-app min-h-screen bg-surface-body text-ink-500">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
