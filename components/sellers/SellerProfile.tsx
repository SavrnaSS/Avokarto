import { ArrowUpRight, BadgeCheck, CalendarDays, Megaphone, MessageCircle, Palette, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SellerProfile as Profile } from "@/lib/backend/seller-profiles";
import { STORE_THEME_INFO } from "@/lib/storeThemes";
import { FollowButton, ShareProfileButton } from "./SellerActions";
import { RatingInline, SellerAvatar, SellerBadges, SellerCard, StoreThemePreview, sellerStyle } from "./SellerBits";
import SellerProfileTabs from "./SellerProfileTabs";
import { compactNumber, joinedLabel, sellerPath } from "./sellerFormat";
import styles from "./sellers.module.css";

/**
 * A seller's Avokarto profile, laid out like a social profile: cover and
 * avatar, follow/share, headline numbers, badges, then their products,
 * reels and story - with their own themed store one click away.
 */
export default function SellerProfile({ profile, signedIn }: { profile: Profile; signedIn: boolean }) {
	const theme = STORE_THEME_INFO[profile.theme];
	const digits = profile.whatsapp.replace(/[^0-9]/g, "");
	const stats = [
		{ label: "Products", value: compactNumber(profile.products) },
		{ label: "Followers", value: compactNumber(profile.followers) },
		{ label: "Orders", value: compactNumber(profile.orders) },
		{ label: "Rating", value: profile.rating === null ? "New" : `${profile.rating.toFixed(1)}★` },
	];

	return (
		<div className={styles.page} style={sellerStyle(profile)}>
			<div className={styles.container}>
				<nav aria-label="Breadcrumb" className={styles.crumbs}>
					<Link href="/">Home</Link>
					<span aria-hidden="true">/</span>
					<Link href="/sellers">Sellers</Link>
					<span aria-hidden="true">/</span>
					<span aria-current="page">{profile.name}</span>
				</nav>

				<header className={styles.profileHeader}>
					<div className={styles.cover}>
						{profile.bannerUrl ? (
							<Image alt="" fetchPriority="high" fill loading="eager" sizes="(min-width: 1320px) 1290px, 100vw" src={profile.bannerUrl} style={{ objectFit: "cover" }} />
						) : null}
						{profile.announcement ? (
							<p className={styles.coverNote}><Megaphone aria-hidden="true" size={15} /> {profile.announcement}</p>
						) : null}
					</div>

					<div className={styles.identity}>
						<span className={styles.profileAvatar}>
							<SellerAvatar priority seller={profile} size={128} />
							<span aria-hidden="true" className={styles.avatarBadge}><BadgeCheck size={20} /></span>
						</span>

						<div className={styles.identityText}>
							<h1 className={styles.profileName}>
								{profile.name}
								<BadgeCheck aria-label="Verified Avokarto partner" className={styles.verified} size={24} />
							</h1>
							<p className={styles.handleLine}>
								<span>@{profile.handle}</span>
								<span aria-hidden="true">·</span>
								<RatingInline rating={profile.rating} reviews={profile.reviews} />
								<span aria-hidden="true">·</span>
								<span className={styles.muted}><CalendarDays aria-hidden="true" size={14} /> {joinedLabel(profile.since)}</span>
							</p>
							{profile.tagline ? <p className={styles.tagline}>{profile.tagline}</p> : null}
						</div>

						<div className={styles.identityActions}>
							<FollowButton followers={profile.followers} following={profile.isFollowing} handle={profile.handle} name={profile.name} />
							<a className={styles.btnSeller} href={profile.storeUrl} rel="noopener">
								<Store aria-hidden="true" size={17} /> Visit store <ArrowUpRight aria-hidden="true" size={15} />
							</a>
							{digits ? (
								<a
									aria-label={`Message ${profile.name} on WhatsApp`}
									className={styles.iconBtn}
									href={`https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${profile.name}! I found you on Avokarto.`)}`}
									rel="noopener noreferrer"
									target="_blank"
									title="Message on WhatsApp"
								>
									<MessageCircle aria-hidden="true" size={18} />
									<span className={styles.iconBtnText}>Message</span>
								</a>
							) : null}
							<ShareProfileButton name={profile.name} path={sellerPath(profile.handle)} />
						</div>
					</div>

					<dl className={styles.statStrip}>
						{stats.map((stat) => (
							<div key={stat.label}>
								<dd>{stat.value}</dd>
								<dt>{stat.label}</dt>
							</div>
						))}
					</dl>

					<SellerBadges badges={profile.badges} />
					{!signedIn ? (
						<p className={styles.signinHint}>
							<Link href="/signin">Sign in</Link> to follow {profile.name} and keep up with new drops.
						</p>
					) : null}
				</header>

				<div className={styles.layout}>
					<div className={styles.mainCol}>
						<SellerProfileTabs
							about={profile.about}
							categories={profile.categories}
							contactEmail={profile.contactEmail}
							listings={profile.listings}
							name={profile.name}
							orders={profile.orders}
							reels={profile.reels}
							since={profile.since}
							socials={profile.socials}
							storeUrl={profile.storeUrl}
							whatsapp={profile.whatsapp}
						/>
					</div>

					<aside className={styles.sideCol}>
						<section className={styles.sideCard}>
							<p className={styles.eyebrow}><Palette aria-hidden="true" size={14} /> Independent store</p>
							<h2 className={styles.sideTitle}>{profile.name}&apos;s own shop</h2>
							<a aria-label={`Open ${profile.name}'s store`} className={styles.previewLink} href={profile.storeUrl} rel="noopener">
								<StoreThemePreview seller={profile} />
							</a>
							<dl className={styles.themeFacts}>
								<div><dt>Theme</dt><dd>{theme.label} <span className={styles.moodTag}>{theme.mood}</span></dd></div>
								<div><dt>Style</dt><dd>{theme.description}</dd></div>
								<div>
									<dt>Address</dt>
									<dd className={styles.addressText}>{profile.domain ?? `/store/${profile.handle}`}</dd>
								</div>
								<div>
									<dt>Brand colour</dt>
									<dd><span aria-hidden="true" className={styles.swatch} /> {profile.accentColor.toUpperCase()}</dd>
								</div>
							</dl>
							<a className={`${styles.btnSeller} ${styles.btnBlock}`} href={profile.storeUrl} rel="noopener">
								Shop the full store <ArrowUpRight aria-hidden="true" size={15} />
							</a>
							<p className={styles.sideNote}>Same Avokarto checkout, delivery and returns - in the seller&apos;s own look.</p>
						</section>

						<section className={`${styles.sideCard} ${styles.sellCta}`}>
							<h2 className={styles.sideTitle}>Start your own store</h2>
							<p>Pick products, choose a theme and share your shop. Avokarto handles shipping.</p>
							<Link className={styles.btnGhost} href="/">Open a free store</Link>
						</section>
					</aside>
				</div>

				{profile.similar.length ? (
					<section className={styles.similar}>
						<div className={styles.sectionHead}>
							<h2>Similar sellers</h2>
							<Link href="/sellers">See all sellers <ArrowUpRight aria-hidden="true" size={15} /></Link>
						</div>
						<div className={styles.cardGrid}>
							{profile.similar.map((seller) => <SellerCard key={seller.id} seller={seller} />)}
						</div>
					</section>
				) : null}
			</div>
		</div>
	);
}
