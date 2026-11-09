import Link from "next/link";
import MarketingShell from "@/components/seo/MarketingShell";
import s from "@/components/seo/marketing.module.css";
import { SELLER_GUIDES } from "@/lib/seo-guides";
import { jsonLdString, pageMetadata, siteUrl } from "@/lib/seo";

const title = "Practical guides for your first dropshipping store.";
const description = "Learn how to start dropshipping, choose products and price your catalog. Clear checklists and worked examples for building and running an Avokarto store.";
export const metadata = pageMetadata({ title: "Dropshipping Guides: Products, Pricing & Launch", description, path: "/guides" });

export default function GuidesPage() {
  return <MarketingShell title={title} description={description} path="/guides" eyebrow="Dropshipping guides">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({
      "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `${siteUrl()}/guides`,
      mainEntity: { "@type": "ItemList", itemListElement: SELLER_GUIDES.map((guide, index) => ({ "@type": "ListItem", position: index + 1, name: guide.title, url: `${siteUrl()}/guides/${guide.slug}` })) },
    }) }} />
    <div className={s.grid}>{SELLER_GUIDES.map((guide) => <article className={s.card} key={guide.slug}>
      <span className={s.tag}>{guide.minutes} min read</span>
      <h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
      <p>{guide.description}</p><Link href={`/guides/${guide.slug}`}>Read the guide <span aria-hidden="true">→</span></Link>
    </article>)}</div>
    <div className={s.copy}><h2>Start with the fundamentals.</h2><p>These guides explain the decisions behind your store: who it serves, what it sells and how the numbers work. When you are ready to build, see <Link href="/how-it-works">how Avokarto works</Link>, explore the <Link href="/dropshipping-store-builder">store builder</Link> and compare <Link href="/pricing">plans and pricing</Link>.</p></div>
  </MarketingShell>;
}
