import { pageMetadata } from "@/lib/seo";
import { FreeShippingAmount, IfFreeShipping } from "@/components/common/FreeShipping";
import Link from "next/link";
import { ArrowRight, LayoutGrid, LifeBuoy, Store, Truck } from "lucide-react";
import styles from "./about.module.css";
import { PLANS, TRIAL_DAYS } from "@/lib/billing/plans";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "Meet Avokarto, the all-in-one dropshipping platform: launch your own store, sell winning products and let us stock, pack and ship every order. Plus a marketplace to shop it all.",
  path: "/about",
});

export default function page() {
  return (
    <section className={`rbt-bg-color-gray-light ${styles.page}`}>
      <div className="container">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>About us</p>
          <h1 className={styles.title}>About Avokarto</h1>
          <p className={styles.lead}>
            Avokarto is an all-in-one dropshipping platform. Anyone can open
            their own branded store in a minute, add winning products from our
            catalog and share ready-made promo reels - while we hold the
            stock, pack and ship every order. Prefer to shop? Everything we
            stock is also on the Avokarto marketplace.
          </p>
          <div className={styles.actions}>
            <Link className="rbt-btn rbt-btn-primary" href="/">
              Start selling free
            </Link>
            <Link className="rbt-btn rbt-btn-border" href="/marketplace">
              Explore the marketplace
            </Link>
          </div>
        </header>

        <div className={styles.grid}>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <Store size={22} />
            </span>
            <h2 className={styles.cardTitle}>Sell without stock</h2>
            <p className={styles.cardText}>
              <Link href="/start">Start your {TRIAL_DAYS}-day free trial</Link>, pick products and set
              your own margin. Plans start at ${PLANS.starter.price} USD a month
              after the trial, with no product inventory to buy upfront.
              Customers pay when they order, we deliver, and eligible earnings
              can be paid out to your bank. <Link href="/pricing">Compare plans</Link>.
            </p>
          </article>

          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <LayoutGrid size={22} />
            </span>
            <h2 className={styles.cardTitle}>Shop the marketplace</h2>
            <p className={styles.cardText}>
              Browse the <Link href="/shop-by-categories">shop by category</Link>,
              or explore the <Link href="/shop">full collection</Link>. Each
              product page brings its photos, description, available options,
              price, and stock information together so you can compare before
              adding it to your cart.
            </p>
          </article>

          <IfFreeShipping>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <Truck size={22} />
            </span>
            <h2 className={styles.cardTitle}>
              Free shipping on orders of <FreeShippingAmount /> or more
            </h2>
            <p className={styles.cardText}>
              Orders of <FreeShippingAmount /> or more (USD), after
              discounts, qualify for free shipping. Your cart and checkout
              show your progress and apply the shipping saving automatically.
            </p>
          </article>
          </IfFreeShipping>

          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <LifeBuoy size={22} />
            </span>
            <h2 className={styles.cardTitle}>Help when you need it</h2>
            <p className={styles.cardText}>
              Visit our <Link href="/help-center">help center</Link> for
              shopping and account guidance. For questions about a product or
              an order, <Link href="/contact">contact Avokarto</Link> with
              the product name or order number so we can help.
            </p>
          </article>
        </div>

        <div className={styles.cta}>
          <p className={styles.ctaText}>
            Your own dropshipping store could be live in the next minute.
          </p>
          <Link className={styles.ctaLink} href="/">
            Start selling free
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
