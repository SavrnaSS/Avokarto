import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo";
import { TRIAL_DAYS } from "@/lib/billing/plans";
import s from "./marketing.module.css";

export default function MarketingShell({ children, title, description, path, eyebrow = "Sell with Avokarto" }: {
  children: ReactNode;
  title: string;
  description: string;
  path: string;
  eyebrow?: string;
}) {
  return <div className={s.page}>
    <a className={s.skip} href="#page-title">Skip to content</a>
    <header className={s.header}>
      <Link className={s.brand} href="/" aria-label="Avokarto home">
        <Image src="/assets/images/logo/avokarto-logo-mark.webp" alt="" width={32} height={32} />avokarto
      </Link>
      <nav aria-label="Main navigation" className={s.nav}>
        <Link href="/dropshipping-store-builder">Store builder</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/guides">Guides</Link>
      </nav>
      <Link className={s.button} href="/start">Build my store <span aria-hidden="true">↗</span></Link>
    </header>
    <div className={s.container}>
      <nav aria-label="Breadcrumb" className={s.breadcrumb}>
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        {path.startsWith("/guides/") ? <><Link href="/guides">Guides</Link><span aria-hidden="true">/</span></> : null}
        <span aria-current="page">{eyebrow}</span>
      </nav>
      <header className={s.hero}>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>{title}</h1>
        <p className={s.lead}>{description}</p>
      </header>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd([
        { name: "Home", path: "/" },
        ...(path.startsWith("/guides/") ? [{ name: "Guides", path: "/guides" }] : []),
        { name: title, path },
      ])) }} />
      {children}
      <aside className={s.cta} aria-label="Build your store">
        <div><h2>Make your next step a real store.</h2><p>Choose your products, add your brand and try Avokarto free for {TRIAL_DAYS} days.</p></div>
        <Link className={s.button} href="/start">Start your free trial <span aria-hidden="true">↗</span></Link>
      </aside>
    </div>
    <footer className={s.footer}>
      <Link className={s.brand} href="/">avokarto</Link>
      <nav aria-label="Footer navigation">
        <Link href="/marketplace">Marketplace</Link><Link href="/shop-by-categories">Categories</Link>
        <Link href="/about">About</Link><Link href="/contact">Contact</Link>
        <Link href="/help-center">Help center</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-policy">Terms</Link>
      </nav>
      <small>© {new Date().getFullYear()} Avokarto. All rights reserved.</small>
    </footer>
  </div>;
}
