import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { isSiteIndexable } from "@/lib/seoRoutes";

export const dynamic = "force-dynamic";

// Complements the noindex/nofollow metadata already set on app/admin/layout.tsx -
// this keeps well-behaved crawlers from ever requesting /admin in the first
// place, on top of the per-page meta tag telling them not to index it.
export default function robots(): MetadataRoute.Robots {
	if (!isSiteIndexable()) {
		return { rules: { userAgent: "*", disallow: "/" } };
	}
	return {
		rules: {
			allow: ["/", "/api/uploads/"],
			disallow: ["/admin", "/api/"],
			userAgent: "*",
		},
		// Cart/checkout/account pages are NOT disallowed on purpose: they carry
		// noindex, and crawlers must be able to fetch a page to see that.
		sitemap: `${siteUrl()}/sitemap.xml`,
	};
}
