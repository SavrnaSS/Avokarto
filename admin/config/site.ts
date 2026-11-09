import { adminBranding } from "./branding";

export const siteConfig = {
	name: adminBranding.adminName,
	description: "Avokarto admin dashboard for ecommerce operations.",
	url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
