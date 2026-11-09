import Link from "next/link";
import MarketingShell from "@/components/seo/MarketingShell";
import s from "@/components/seo/marketing.module.css";
import { PLAN_KEYS, PLANS, TRIAL_DAYS } from "@/lib/billing/plans";
import { jsonLdString, pageMetadata } from "@/lib/seo";
import { platformApplicationJsonLd } from "@/lib/seo-platform";

const description = `Compare Avokarto Starter, Pro and Scale dropshipping plans, from $${PLANS.starter.price} USD per month. Try every plan free for ${TRIAL_DAYS} days. Cancel from your dashboard.`;
export const metadata = pageMetadata({ title: "Dropshipping Plans & Pricing", description, path: "/pricing" });

export default function PricingPage() {
  return <MarketingShell title="One plan for your store, products and fulfilment." description={`Start with ${TRIAL_DAYS} days free. Choose the plan that fits your store, with monthly billing and no product inventory to buy upfront.`} path="/pricing" eyebrow="Plans & pricing">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(platformApplicationJsonLd()) }} />
    <div className={s.grid}>
      {PLAN_KEYS.map((key) => {
        const plan = PLANS[key];
        return <article className={`${s.card} ${key === "pro" ? s.featured : ""}`} id={key} key={key}>
          <span className={s.tag}>{key === "pro" ? "For growing stores" : `${TRIAL_DAYS}-day free trial`}</span>
          <h2>{plan.name}</h2><p>{plan.blurb}</p>
          <div className={s.price}><strong>${plan.price}</strong> USD / month</div>
          <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <Link href="/start" className={s.button}>Try {plan.name} free</Link>
        </article>;
      })}
    </div>
    <p className={s.note}>Prices are in USD per month. A card is checked when your trial starts and first charged when it ends. Confirm the final price, taxes and trial terms in checkout. Product prices, shipping and any platform fee on your margin are separate from the subscription; review your store&apos;s current rules in the dashboard.</p>
    <div className={s.copy}>
      <h2>Choose a plan around your catalog.</h2>
      <p>Starter lets you build a branded store with up to {PLANS.starter.listingLimit} products. All plans include the store themes, product reels, video studio and fulfilment. Move to Pro when you need a custom domain or a larger catalog. Scale includes the services listed above for sellers who want additional support.</p>
      <p>Before choosing, see <Link href="/how-it-works">how Avokarto works</Link> and our <Link href="/guides/price-dropshipping-products">guide to product pricing</Link>. Subscription costs should be part of your business budget, alongside marketing and any other expenses.</p>
    </div>
    <h2 className={s.sectionTitle}>Billing questions, answered.</h2>
    <details className={s.faq}><summary>Can I cancel during the trial?</summary><p>Yes. Cancel from Plan &amp; billing during the {TRIAL_DAYS}-day trial to avoid the first subscription charge. Review the current billing status and end date in your dashboard.</p></details>
    <details className={s.faq}><summary>Do I need to buy inventory?</summary><p>No. You add products from the Avokarto catalog to your store. Avokarto holds stock, packs and ships customer orders. A subscription is separate from product and order costs.</p></details>
    <details className={s.faq}><summary>Can I connect my own domain?</summary><p>Custom domains are available on Pro and Scale. Use your own domain registration and connect it in your store settings. Starter uses an Avokarto store link.</p></details>
    <details className={s.faq}><summary>Does a plan guarantee sales?</summary><p>No. Your results depend on product selection, pricing, demand and marketing. Review your costs and test your offer before increasing spending.</p></details>
  </MarketingShell>;
}
