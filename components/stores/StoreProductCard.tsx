"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import ProductImage from "@/components/seller/ProductImage";
import { money } from "@/components/seller/sellerApi";
import type { PublicStore } from "@/lib/backend/resellers";
import type { PublicListing } from "./StoreHome";
import { useStoreCart } from "./useStoreCart";
import styles from "./storefront.module.css";

/** The cart line for a store listing. */
export function toCartItem(listing: PublicListing, store: Pick<PublicStore, "handle" | "name">) {
	return {
		cartId: listing.cartId,
		imageUrl: listing.imageUrl,
		listingId: listing.id,
		name: listing.productName,
		price: listing.price,
		productId: listing.productId,
		slug: listing.productSlug,
		stock: listing.stock,
		store: { handle: store.handle, name: store.name },
	};
}

// At or below this many in stock, the card nudges shoppers with "Only N left".
const LOW_STOCK = 5;

/** One product tile in a store: photo, name, price and a quick add-to-cart. */
export default function StoreProductCard({
	basePath,
	listing,
	priority = false,
	sizes = "(min-width: 1100px) 290px, (min-width: 768px) 32vw, 48vw",
	store,
}: {
	basePath: string;
	listing: PublicListing;
	priority?: boolean;
	sizes?: string;
	store: Pick<PublicStore, "handle" | "name">;
}) {
	const { addToCart } = useStoreCart();
	const href = `${basePath}/${listing.productSlug}`;
	const lowStock = listing.inStock && listing.stock > 0 && listing.stock <= LOW_STOCK;
	return (
		<article className={styles.card} data-st="product-card">
			{/* The title is the card's link for keyboards and screen readers; the photo is a mouse/touch shortcut. */}
			<Link aria-hidden="true" className={styles.cardImage} href={href} tabIndex={-1}>
				<ProductImage alt="" priority={priority} sizes={sizes} src={listing.imageUrl} />
				{!listing.inStock ? <span className={styles.badgeSold}>Sold out</span> : listing.featured ? <span className={styles.badge}>Featured</span> : null}
				{lowStock ? <span className={styles.badgeLow}>Only {listing.stock} left</span> : null}
			</Link>
			<div className={styles.cardBody}>
				{listing.category ? <p className={styles.cardCategory}>{listing.category}</p> : null}
				<Link className={styles.cardLink} href={href}>
					<h3 className={styles.cardTitle}>{listing.productName}</h3>
				</Link>
				<p className={styles.price}>{money(listing.price)}</p>
				<div className={styles.cardAction}>
					<button
						aria-label={listing.inStock ? `Add ${listing.productName} to cart` : `${listing.productName} is sold out`}
						className={`${styles.button} ${styles.buttonSm}`}
						disabled={!listing.inStock}
						onClick={() =>
							addToCart(toCartItem(listing, store))
						}
						type="button"
					>
						<ShoppingBag aria-hidden="true" size={16} />
						{listing.inStock ? (
							<>
								<span className={styles.addLong}>Add to cart</span>
								<span className={styles.addShort}>Add</span>
							</>
						) : "Sold out"}
					</button>
				</div>
			</div>
		</article>
	);
}

/** A row of product cards: swipeable on phones, a grid on larger screens. */
export function ProductRail({
	basePath,
	eyebrow,
	listings,
	store,
	title,
}: {
	basePath: string;
	eyebrow: string;
	listings: PublicListing[];
	store: Pick<PublicStore, "handle" | "name">;
	title: string;
}) {
	return (
		<section aria-label={title} className={styles.section} style={{ paddingBottom: 0 }}>
			<div className={styles.container}>
				<div className={styles.sectionHead}>
					<div>
						<p className={styles.eyebrow}>{eyebrow}</p>
						<h2 className={styles.sectionTitle}>{title}</h2>
					</div>
				</div>
				<div className={styles.rail}>
					{listings.map((listing) => (
						<StoreProductCard basePath={basePath} key={listing.id} listing={listing} sizes="(min-width: 1100px) 290px, (min-width: 768px) 32vw, 44vw" store={store} />
					))}
				</div>
			</div>
		</section>
	);
}
