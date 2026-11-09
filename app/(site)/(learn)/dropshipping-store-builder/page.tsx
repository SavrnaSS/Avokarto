import Link from "next/link";
import MarketingShell from "@/components/seo/MarketingShell";
import s from "@/components/seo/marketing.module.css";
import { PLANS, TRIAL_DAYS } from "@/lib/billing/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Dropshipping Store Builder with Product Reels", description: `Build a dropshipping store without coding. Choose products, customize your theme and share product reels. Avokarto fulfils orders. Try ${TRIAL_DAYS} days free.`, path: "/dropshipping-store-builder" });

export default function StoreBuilderPage() {
  return <MarketingShell title="Build a dropshipping store without starting from scratch." description="Give your products a home with your own store name, branding and theme. Avokarto brings the catalog and fulfilment, so you can work on the offer and the audience." path="/dropshipping-store-builder" eyebrow="Dropshipping store builder">
    <div className={s.grid}>
      <article className={s.card}><h2>A store that looks like your brand.</h2><p>Choose from 8 themes and add a logo, banner and accent color. Your store includes product pages, a cart and checkout. Pro and Scale also let you connect your own domain.</p></article>
      <article className={s.card}><h2>Products you can actually list.</h2><p>Browse the catalog, review stock and prices, then add items to your store. Set your margin within the current marketplace rules. Starter supports up to {PLANS.starter.listingLimit} products.</p></article>
      <article className={s.card}><h2>Content to help you explain them.</h2><p>Use available product reels and the video studio to prepare promotional clips. Show what a product does and give shoppers a direct link to the relevant store page.</p></article>
    </div>
    <div className={s.copy}>
      <h2>Go from a name to a store link.</h2>
      <p>Start in the <Link href="/start">store builder</Link> with your store name. Choose a theme, review your product selection and margin, and complete your account and plan setup. The dashboard brings your catalog, orders, earnings and store settings together.</p>
      <p>You do not need to buy product inventory or write storefront code. Avokarto holds the stock and fulfils customer orders. You remain responsible for choosing an offer, marketing your store and helping customers understand what they are buying.</p>
      <h2>What should you prepare?</h2>
      <ul><li>A memorable store name and a logo you have permission to use.</li><li>A focused audience and a short list of products that serve it.</li><li>A price that accounts for product costs, fees and your subscription.</li><li>Clear product content and a practical plan for reaching potential customers.</li></ul>
      <p>Use our <Link href="/guides/how-to-start-dropshipping">beginner&apos;s dropshipping checklist</Link> to work through the details. Then compare <Link href="/pricing">plans from ${PLANS.starter.price} USD per month</Link>, each with a {TRIAL_DAYS}-day free trial.</p>
      <h2>A simple launch is easier to improve.</h2>
      <p>Begin with a coherent collection instead of listing every product you see. Check the store on a phone, read the product pages and confirm that the links and brand details are correct. As you get real traffic, use your dashboard to see what is working and adjust your catalog and promotional content.</p>
    </div>
  </MarketingShell>;
}
