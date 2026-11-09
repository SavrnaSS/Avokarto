import { ArrowUpRight, Award, BadgeCheck, Globe, LayoutGrid, Sparkles, Star, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import ProductImage from "@/components/seller/ProductImage";
import type { SellerBadge, SellerSummary } from "@/lib/backend/seller-profiles";
import { STORE_THEME_INFO } from "@/lib/storeThemes";
import { BADGE_INFO, compactNumber, initialsOf, sellerPath } from "./sellerFormat";
import styles from "./sellers.module.css";

/** Inline style carrying the seller's brand colour to the CSS (`--seller`). */
export function sellerStyle(seller: Pick<SellerSummary, "accentColor">): CSSProperties {
	return { "--seller": seller.accentColor } as CSSProperties;
}

export function SellerAvatar({
	priority = false,
	seller,
	size = 48,
}: {
	priority?: boolean;
	seller: Pick<SellerSummary, "accentColor" | "logoUrl" | "name">;
	size?: number;
}) {
	return (
		<span className={styles.avatar} style={{ ...sellerStyle(seller), fontSize: size * 0.38, height: size, width: size }}>
			{seller.logoUrl ? (
				<Image alt="" fill fetchPriority={priority ? "high" : undefined} loading={priority ? "eager" : undefined} sizes={`${size * 2}px`} src={seller.logoUrl} style={{ objectFit: "cover" }} />
			) : (
				<span aria-hidden="true">{initialsOf(seller.name)}</span>
			)}
		</span>
	);
}

const BADGE_ICONS: Record<SellerBadge, typeof Award> = {
	"highly-rated": Star,
	"new": Sparkles,
	"own-domain": Globe,
	"partner": BadgeCheck,
	"top-seller": Award,
	"wide-catalog": LayoutGrid,
};

export function SellerBadges({ badges, compact = false }: { badges: SellerBadge[]; compact?: boolean }) {
	return (
		<ul aria-label="Seller badges" className={styles.badges} data-compact={compact || undefined}>
			{badges.map((badge) => {
				const Icon = BADGE_ICONS[badge];
				return (
					<li className={styles.badge} data-badge={badge} key={badge} title={BADGE_INFO[badge].hint}>
						<Icon aria-hidden="true" size={compact ? 12 : 14} />
						{BADGE_INFO[badge].label}
					</li>
				);
			})}
		</ul>
	);
}

export function RatingInline({ rating, reviews }: { rating: number | null; reviews: number }) {
	if (rating === null) return <span className={styles.muted}>No reviews yet</span>;
	return (
		<span className={styles.ratingInline}>
			<Star aria-hidden="true" fill="currentColor" size={14} />
			<strong>{rating.toFixed(1)}</strong>
			<span className={styles.muted}>({compactNumber(reviews)})</span>
		</span>
	);
}

/**
 * A miniature of the seller's own store in its chosen theme and colour:
 * browser chrome with the store's address, its header, a hero line and a
 * few products. The theme's look comes from `[data-theme]` in
 * sellers.module.css, matching the real storefront's personality.
 */
export function StoreThemePreview({ seller }: { seller: SellerSummary }) {
	const info = STORE_THEME_INFO[seller.theme];
	const address = seller.domain ?? `avokarto.com/store/${seller.handle}`;
	const images = seller.previewImages.slice(0, 3);
	return (
		<div className={styles.themePreview} data-mood={info.mood} data-theme={seller.theme} style={{ ...sellerStyle(seller), "--theme-bg": info.background } as CSSProperties}>
			<div aria-hidden="true" className={styles.tpChrome}>
				<span /><span /><span />
				<span className={styles.tpAddress}>{address}</span>
			</div>
			<div aria-hidden="true" className={styles.tpPage}>
				<div className={styles.tpHeader}>
					<SellerAvatar seller={seller} size={22} />
					<span className={styles.tpBrand}>{seller.name}</span>
					<span className={styles.tpNav}><i /><i /><i /></span>
				</div>
				<div className={styles.tpHero}>
					<span className={styles.tpHeadline}>{seller.tagline || `Welcome to ${seller.name}`}</span>
					<span className={styles.tpCta}>Shop now</span>
				</div>
				<div className={styles.tpGrid}>
					{[0, 1, 2].map((index) => (
						<span className={styles.tpTile} key={index}>
							{images[index] ? <ProductImage alt="" sizes="90px" src={images[index]} /> : null}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}

/** A seller tile for the directory and "similar sellers": cover, avatar, numbers, products. */
export function SellerCard({ seller }: { seller: SellerSummary }) {
	const theme = STORE_THEME_INFO[seller.theme];
	return (
		<article className={styles.sellerCard} style={sellerStyle(seller)}>
			<Link aria-label={`${seller.name} profile`} className={styles.cardCover} href={sellerPath(seller.handle)}>
				{seller.bannerUrl ? <Image alt="" fill sizes="(min-width: 992px) 25vw, (min-width: 576px) 50vw, 100vw" src={seller.bannerUrl} style={{ objectFit: "cover" }} /> : null}
				<span className={styles.cardTheme}>{theme.label} theme</span>
			</Link>
			<div className={styles.cardBody}>
				<div className={styles.cardIdentity}>
					<span className={styles.cardAvatar}><SellerAvatar seller={seller} size={58} /></span>
					<div className={styles.cardName}>
						<h3>
							<Link href={sellerPath(seller.handle)}>{seller.name}</Link>
							<BadgeCheck aria-label="Avokarto partner" className={styles.verified} size={16} />
						</h3>
						<span className={styles.muted}>@{seller.handle}</span>
					</div>
				</div>
				{seller.tagline ? <p className={styles.cardTagline}>{seller.tagline}</p> : null}
				<dl className={styles.cardStats}>
					<div><dt>Followers</dt><dd>{compactNumber(seller.followers)}</dd></div>
					<div><dt>Products</dt><dd>{compactNumber(seller.products)}</dd></div>
					<div><dt>Rating</dt><dd>{seller.rating === null ? "–" : `${seller.rating.toFixed(1)}★`}</dd></div>
				</dl>
				{seller.previewImages.length ? (
					<div aria-hidden="true" className={styles.cardProducts}>
						{seller.previewImages.slice(0, 4).map((src) => (
							<span key={src}><ProductImage alt="" sizes="80px" src={src} /></span>
						))}
					</div>
				) : null}
				<div className={styles.cardActions}>
					<Link className={styles.btnGhost} href={sellerPath(seller.handle)}>View profile</Link>
					<a className={styles.btnSeller} href={seller.storeUrl} rel="noopener" target="_blank">
						<Store aria-hidden="true" size={15} /> Store <ArrowUpRight aria-hidden="true" size={14} />
					</a>
				</div>
			</div>
		</article>
	);
}
