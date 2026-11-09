import { ArrowUpRight, BadgeCheck } from "lucide-react";
import Image from "next/image";
import type { PublicStore } from "@/lib/backend/resellers";
import { StoreLogo } from "./StoreShell";
import styles from "./storefront.module.css";

/**
 * Avokarto co-branding for reseller stores ("<Store> × Avokarto"): a line
 * under the store's name in the header, a partner badge in the hero and a
 * partner card in the menu and footer. Links are absolute so they still
 * reach Avokarto from a seller's own domain. Each theme restyles them
 * (storefront.module.css, "Avokarto co-branding").
 */
const AVOKARTO_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
export const avokartoHref = (path = "/") => `${AVOKARTO_ORIGIN}${path}`;

export function AvokartoMark({ size = 16 }: { size?: number }) {
	return (
		<span aria-hidden="true" className={styles.avkMark} style={{ height: size, width: size }}>
			<Image alt="" height={size * 2} src="/assets/images/logo/avokarto-logo-mark.webp" width={size * 2} />
		</span>
	);
}

/** "× Avokarto" under the store's name (inside the brand link, so not a link itself). */
export function BrandCollab() {
	return (
		<span className={styles.brandCollab}>
			<span aria-hidden="true" className={styles.brandCollabX}>×</span>
			<AvokartoMark size={14} />
			<span className={styles.brandCollabName}>Avokarto</span>
		</span>
	);
}

/** The hero's partner badge. */
export function HeroPartner({ store }: { store: PublicStore }) {
	return (
		<a className={styles.heroPartner} href={avokartoHref()} rel="noopener" target="_blank">
			<AvokartoMark size={30} />
			<span className={styles.heroPartnerText}>
				<strong>{store.name} × Avokarto</strong>
				<small>
					<BadgeCheck aria-hidden="true" size={13} /> Official partner store
					<span className={styles.hideSm}> · tracked delivery &amp; secure checkout</span>
				</small>
			</span>
			<ArrowUpRight aria-hidden="true" size={16} />
		</a>
	);
}

/** Partner card: the two logos locked up, a line about the partnership and links to Avokarto. */
export function AvokartoCollabCard({ store, variant }: { store: PublicStore; variant: "footer" | "menu" }) {
	const size = variant === "menu" ? 34 : 44;
	return (
		<aside aria-label={`${store.name} × Avokarto`} className={`${styles.collabCard} ${variant === "footer" ? styles.reveal : ""}`} data-variant={variant}>
			<div aria-hidden="true" className={styles.collabLockup}>
				<StoreLogo size={size} store={store} />
				<span className={styles.collabX}>×</span>
				<AvokartoMark size={size} />
			</div>
			<div className={styles.collabBody}>
				<p className={styles.collabTitle}>
					{store.name} <span>×</span> Avokarto
				</p>
				<p className={styles.collabText}>
					{variant === "menu"
						? "An official Avokarto partner store."
						: "An official Avokarto partner store - every order is packed, shipped and protected by Avokarto."}
				</p>
			</div>
			<div className={styles.collabLinks}>
				{/* The seller's social profile on Avokarto: followers, reels, badges. */}
				<a href={avokartoHref(`/sellers/${store.handle}`)} rel="noopener" target="_blank">
					Seller profile <ArrowUpRight aria-hidden="true" size={15} />
				</a>
				<a href={avokartoHref()} rel="noopener" target="_blank">
					Discover Avokarto <ArrowUpRight aria-hidden="true" size={15} />
				</a>
				{variant === "footer" ? (
					<a href={avokartoHref("/")} rel="noopener" target="_blank">Open your own store</a>
				) : null}
			</div>
		</aside>
	);
}
