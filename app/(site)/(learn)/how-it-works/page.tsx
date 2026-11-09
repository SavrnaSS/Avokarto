import Link from "next/link";
import MarketingShell from "@/components/seo/MarketingShell";
import s from "@/components/seo/marketing.module.css";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "How Avokarto Dropshipping Works", description: "Learn how to pick products, build a branded Avokarto store, set your margin and promote it with reels. Avokarto holds inventory and fulfils customer orders.", path: "/how-it-works" });

export default function HowItWorksPage() {
  return <MarketingShell title="Your brand. Your store. We handle the stock." description="Avokarto brings the store builder, product catalog, promotional reels and order fulfilment together. Here is what you do, and what happens after a customer buys." path="/how-it-works" eyebrow="How it works">
    <div className={s.grid}>
      <article className={s.card}><span className={s.tag}>01 · Pick</span><h2>Start with a focused catalog.</h2><p>Browse the available products, compare their prices and stock, and choose items that fit your audience. Start with a small collection so your store is easy to understand.</p><Link href="/guides/choose-dropshipping-products">Learn how to evaluate products →</Link></article>
      <article className={s.card}><span className={s.tag}>02 · Build</span><h2>Make the store your own.</h2><p>Choose a store name, theme, logo and banner. Set your product margins within the current store rules, review your plan and launch your branded store link.</p><Link href="/dropshipping-store-builder">Explore the store builder →</Link></article>
      <article className={s.card}><span className={s.tag}>03 · Share</span><h2>Give shoppers a reason to visit.</h2><p>Use ready-made product reels or the video studio to create promotional content. Share your store link and show the product clearly. Track orders and earnings in your dashboard.</p><Link href="/guides/how-to-start-dropshipping">Read the launch checklist →</Link></article>
    </div>
    <div className={s.copy}>
      <h2>What happens after an order?</h2>
      <ol>
        <li><strong>The customer checks out.</strong> They see the store&apos;s selling price and the available shipping options before placing the order.</li>
        <li><strong>Avokarto fulfils the order.</strong> We hold the inventory and handle packing and shipping. You can follow order status from the seller dashboard.</li>
        <li><strong>Earnings move through their hold period.</strong> A sale is not immediately withdrawable. Delivery, the return window and any cancellations or refunds affect your available balance.</li>
        <li><strong>You request a payout.</strong> Add your bank details and request payment when your eligible balance meets the current minimum shown in your dashboard.</li>
      </ol>
      <h2>Understand your costs before launching.</h2>
      <p>Your retail price starts with the catalog price and the margin you set. A subscription, any platform fee and your marketing costs affect what you keep. The dashboard shows the store rules that apply to your account. <Link href="/guides/price-dropshipping-products">Work through a pricing example</Link> before deciding how much to charge.</p>
      <p>Compare the <Link href="/pricing">current plans and trial</Link>, and check the <Link href="/return-policy">published return policy</Link> before sharing your store. Contact <Link href="/contact">Avokarto support</Link> if you need help with an order or your account.</p>
      <h2>Build a store, then test the offer.</h2>
      <p>A store link is the start of your work. Clear product information, useful videos and relevant traffic help customers decide whether an item is right for them. Sales are not guaranteed. Use actual order and traffic data to improve your selection and content over time.</p>
    </div>
  </MarketingShell>;
}
