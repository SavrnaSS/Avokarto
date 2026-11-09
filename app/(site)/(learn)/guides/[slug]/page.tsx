import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/seo/MarketingShell";
import s from "@/components/seo/marketing.module.css";
import { getSellerGuide, SELLER_GUIDES } from "@/lib/seo-guides";
import { DEFAULT_SOCIAL_IMAGE, jsonLdString, pageMetadata, SITE_NAME, siteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return SELLER_GUIDES.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props) {
  const guide = getSellerGuide((await params).slug);
  if (!guide) notFound();
  const base = pageMetadata({ title: guide.seoTitle, description: guide.description, path: `/guides/${guide.slug}` });
  return { ...base, openGraph: { ...base.openGraph, type: "article" as const, publishedTime: guide.published, modifiedTime: guide.updated, authors: [SITE_NAME] } };
}

export default async function GuidePage({ params }: Props) {
  const guide = getSellerGuide((await params).slug);
  if (!guide) notFound();
  const path = `/guides/${guide.slug}`;
  return <MarketingShell title={guide.title} description={guide.description} path={path} eyebrow="Seller guide">
    <p className={s.meta}>By Avokarto · Published <time dateTime={guide.published}>{guide.published}</time> · {guide.minutes} min read</p>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({
      "@context": "https://schema.org", "@type": "Article", "@id": `${siteUrl()}${path}#article`,
      headline: guide.title, description: guide.description, datePublished: `${guide.published}T00:00:00+05:30`, dateModified: `${guide.updated}T00:00:00+05:30`,
      mainEntityOfPage: `${siteUrl()}${path}`, url: `${siteUrl()}${path}`, inLanguage: "en-US",
      image: `${siteUrl()}${DEFAULT_SOCIAL_IMAGE.url}`,
      author: { "@type": "Organization", "@id": `${siteUrl()}/#organization`, name: SITE_NAME, url: `${siteUrl()}/about` },
      publisher: { "@id": `${siteUrl()}/#organization` },
    }) }} />
    <div className={s.articleLayout}>
      <nav className={s.toc} aria-label="On this page"><p>In this guide</p>{guide.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</nav>
      <article className={s.copy}>{guide.sections.map((section) => <section id={section.id} key={section.id}>
        <h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.checklist ? <ul>{section.checklist.map((item) => <li key={item}>{item}</li>)}</ul> : null}
      </section>)}
        <p>Explore the <Link href="/dropshipping-store-builder">Avokarto store builder</Link>, see <Link href="/how-it-works">how fulfilment works</Link> or compare <Link href="/pricing">plans and pricing</Link>. For account or order questions, <Link href="/contact">contact support</Link>.</p>
      </article>
    </div>
    <h2 className={s.sectionTitle}>Keep learning.</h2>
    <div className={s.grid}>{SELLER_GUIDES.filter((item) => item.slug !== guide.slug).map((item) => <article className={s.card} key={item.slug}><h2><Link href={`/guides/${item.slug}`}>{item.title}</Link></h2><p>{item.description}</p></article>)}</div>
  </MarketingShell>;
}
