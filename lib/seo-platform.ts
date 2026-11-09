import { PLAN_KEYS, PLANS } from "@/lib/billing/plans";
import { sellerFaqs } from "@/lib/seller-faq";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/seo";
import type { SellLandingData } from "@/lib/backend/sell-landing";

export function platformApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl()}/#application`,
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    browserRequirements: "Requires JavaScript and an internet connection",
    provider: { "@id": `${siteUrl()}/#organization` },
    featureList: ["Branded dropshipping stores", "Product catalog", "Store themes", "Product reels and video studio", "Order fulfilment", "Seller dashboard"],
    offers: PLAN_KEYS.map((key) => ({
      "@type": "Offer",
      name: PLANS[key].name,
      url: `${siteUrl()}/pricing#${key}`,
      price: PLANS[key].price.toFixed(2),
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: PLANS[key].price.toFixed(2),
        priceCurrency: "USD",
        unitText: "month",
        billingDuration: "P1M",
      },
    })),
  };
}

export function landingJsonLd(data: SellLandingData) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl()}/#webpage`,
        url: siteUrl(),
        name: `${SITE_NAME} Dropshipping Store Builder`,
        description: SITE_DESCRIPTION,
        isPartOf: { "@id": `${siteUrl()}/#website` },
        mainEntity: { "@id": `${siteUrl()}/#application` },
      },
      platformApplicationJsonLd(),
      {
        "@type": "FAQPage",
        "@id": `${siteUrl()}/#faq`,
        mainEntity: sellerFaqs(data.settings).map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}
