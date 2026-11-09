"use client";

import { Eye, EyeOff, ImageDown, Link2, PackagePlus, Pencil, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import type { MarginType } from "@/lib/resellerPricing";
import MarginSheet from "./MarginSheet";
import ProductImage from "./ProductImage";
import { withShareRef } from "@/lib/storeTraffic";
import { money, sellerRequest, whatsappShareUrl, type SellerSettings } from "./sellerApi";
import styles from "./seller.module.css";

type Listing = {
	basePrice: number;
	category: string;
	featured: boolean;
	id: string;
	imageUrl: string;
	isActive: boolean;
	margin: number;
	marginType: MarginType;
	marginValue: number;
	net: number;
	productId: string;
	productName: string;
	productSlug: string;
	purchasable: boolean;
	salePrice: number;
	stock: number;
};
const EMPTY: Listing[] = [];

/** The seller's own products: prices, earnings, visibility and sharing. */
export default function SellerListings({
	handle,
	initialQuery = "",
	linkBase,
	onBrowse,
	onToast,
	settings,
}: {
	handle: string;
	/** From the admin top bar's search (?q=). */
	initialQuery?: string;
	/** The store's public address (custom domain when live). */
	linkBase: string;
	onBrowse: () => void;
	onToast: (message: string) => void;
	settings: SellerSettings;
}) {
	// Live: a catalog price change or stock-out reflows margins and badges.
	const listings = useLiveResource<Listing[]>({
		endpoint: "/api/seller/listings",
		initialData: EMPTY,
		topics: ["resellers", "products"],
	});
	const [query, setQuery] = useState(initialQuery);
	const [editing, setEditing] = useState<Listing | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	const visible = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return needle
			? listings.data.filter((listing) => listing.productName.toLowerCase().includes(needle) || listing.category.toLowerCase().includes(needle))
			: listings.data;
	}, [listings.data, query]);

	async function patch(listing: Listing, body: Record<string, unknown>, message: string) {
		setBusyId(listing.id);
		try {
			await sellerRequest("PATCH", `/api/seller/listings/${listing.id}`, body);
			await listings.refresh();
			onToast(message);
		} catch (caught) {
			onToast((caught as Error).message);
		} finally {
			setBusyId(null);
		}
	}

	async function remove(listing: Listing) {
		if (!window.confirm(`Remove "${listing.productName}" from your store?`)) return;
		setBusyId(listing.id);
		try {
			await sellerRequest("DELETE", `/api/seller/listings/${listing.id}`);
			await listings.refresh();
			onToast("Removed from your store");
		} catch (caught) {
			onToast((caught as Error).message);
		} finally {
			setBusyId(null);
		}
	}

	if (listings.loading && !listings.hasData) {
		return <div className={styles.skeleton} style={{ height: 320 }} />;
	}

	if (!listings.data.length) {
		return (
			<section className={`${styles.card} ${styles.empty}`}>
				<span className={styles.emptyIcon}><PackagePlus /></span>
				<p className={styles.cardTitle}>Your store has no products yet</p>
				<p className={styles.muted}>Pick products from Avokarto&apos;s catalog - we handle stock and shipping.</p>
				<button className={styles.btn} onClick={onBrowse} type="button">Browse the catalog</button>
			</section>
		);
	}

	return (
		<section className={styles.stack}>
			<div className={styles.card}>
				<div className={styles.cardHead}>
					<div>
						<h2 className={styles.cardTitle}>My products</h2>
						<p className={styles.muted}>
							{listings.data.filter((listing) => listing.isActive).length} live of {listings.data.length}. Featured products appear first in your store.
						</p>
					</div>
				</div>
				<div className={styles.searchBar}>
					<Search aria-hidden="true" />
					<input aria-label="Search your products" className={styles.input} onChange={(event) => setQuery(event.target.value)} placeholder="Search your products" type="search" value={query} />
				</div>
			</div>
			{listings.error ? <p className={styles.alert} role="alert">{listings.error}</p> : null}

			{visible.map((listing) => {
				const link = `${linkBase}/${listing.productSlug}`;
				return (
					<article className={styles.listing} key={listing.id} style={{ opacity: listing.isActive ? 1 : 0.7 }}>
						<div className={styles.listingThumb}>
							<ProductImage alt="" sizes="72px" src={listing.imageUrl} />
						</div>
						<div className={styles.stack} style={{ gap: 6 }}>
							<div className={styles.row} style={{ gap: 6 }}>
								<p className={styles.productName} style={{ flex: "1 1 160px" }}>{listing.productName}</p>
								{listing.featured ? <span className={styles.badgeGreen}><Star size={12} /> Featured</span> : null}
								{!listing.isActive ? <span className={styles.badge}>Hidden</span> : null}
								{!listing.purchasable ? <span className={styles.badgeRed}>Out of stock</span> : null}
							</div>
							<div className={styles.priceLine}>
								<span>Customer pays <strong>{money(listing.salePrice)}</strong></span>
								<span>Avokarto price <strong>{money(listing.basePrice)}</strong></span>
								<span style={{ color: "var(--s-brand)", fontWeight: 700 }}>You earn {money(listing.net)}</span>
							</div>
						</div>
						<div className={styles.listingActions}>
							<button aria-label={`Edit margin for ${listing.productName}`} className={`${styles.ghost} ${styles.btnSm}`} disabled={busyId === listing.id} onClick={() => setEditing(listing)} type="button">
								<Pencil size={14} /> {listing.marginType === "percent" ? `${listing.marginValue}%` : money(listing.marginValue)}
							</button>
							<a
								aria-label={`Share ${listing.productName} on WhatsApp`}
								className={`${styles.whatsapp} ${styles.btnSm}`}
								href={whatsappShareUrl(`${listing.productName} - just ${money(listing.salePrice)} 🛍️ ${withShareRef(link, "whatsapp")}`)}
								rel="noopener"
								target="_blank"
							>
								Share
							</a>
							<button
								aria-label={`Copy link to ${listing.productName}`}
								className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`}
								onClick={async () => {
									await navigator.clipboard?.writeText(link);
									onToast("Product link copied");
								}}
								type="button"
							>
								<Link2 size={14} />
							</button>
							<a
								aria-label={`Download a story image for ${listing.productName}`}
								className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`}
								download={`${listing.productSlug}-story.png`}
								href={`/api/stores/share-image?handle=${encodeURIComponent(handle)}&product=${encodeURIComponent(listing.productSlug)}&format=story`}
								title="Story image for WhatsApp Status & Instagram"
							>
								<ImageDown size={14} />
							</a>
							<button
								aria-label={listing.featured ? "Unfeature" : "Feature"}
								aria-pressed={listing.featured}
								className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`}
								disabled={busyId === listing.id}
								onClick={() => void patch(listing, { featured: !listing.featured }, listing.featured ? "No longer featured" : "Featured in your store")}
								type="button"
							>
								<Star size={14} fill={listing.featured ? "currentColor" : "none"} />
							</button>
							<button
								aria-label={listing.isActive ? "Hide from store" : "Show in store"}
								className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`}
								disabled={busyId === listing.id}
								onClick={() => void patch(listing, { isActive: !listing.isActive }, listing.isActive ? "Hidden from your store" : "Visible in your store")}
								type="button"
							>
								{listing.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
							</button>
							<button aria-label={`Remove ${listing.productName}`} className={`${styles.danger} ${styles.btnSm} ${styles.iconBtn}`} disabled={busyId === listing.id} onClick={() => void remove(listing)} type="button">
								<Trash2 size={14} />
							</button>
						</div>
					</article>
				);
			})}

			{editing ? (
				<MarginSheet
					basePrice={editing.basePrice}
					initialType={editing.marginType}
					initialValue={editing.marginValue}
					onClose={() => setEditing(null)}
					onSave={async (marginType, marginValue) => {
						await sellerRequest("PATCH", `/api/seller/listings/${editing.id}`, { marginType, marginValue });
						await listings.refresh();
						setEditing(null);
						onToast("Price updated");
					}}
					productName={editing.productName}
					saveLabel="Save margin"
					settings={settings}
				/>
			) : null}
		</section>
	);
}
