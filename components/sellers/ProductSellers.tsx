import { ArrowUpRight, BadgeCheck, ShieldCheck, Store, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { listProductSellers } from "@/lib/backend/seller-profiles";
import { formatCurrency } from "@/lib/price";
import { RatingInline, SellerAvatar, SellerBadges, sellerStyle } from "./SellerBits";
import { compactNumber, sellerPath, sellerProductUrl } from "./sellerFormat";
import styles from "./sellers.module.css";

/**
 * "Sold by" on the product page: Avokarto's own offer, then the independent
 * sellers who carry this product in their stores - each with their profile,
 * numbers and their price - plus an invite to start selling it.
 * Renders nothing when the seller lookup fails, so the product page never
 * breaks because of it.
 */
export default async function ProductSellers({ productId, productSlug, price }: { price: number; productId?: string; productSlug?: string }) {
	if (!productId) return null;
	let data: Awaited<ReturnType<typeof listProductSellers>>;
	try {
		data = await listProductSellers(productId);
	} catch (error) {
		console.error("Unable to load product sellers.", error);
		return null;
	}
	const { sellers, total } = data;

	return (
		<section aria-labelledby="product-sellers-title" className={styles.productSellers} id="product-sellers">
			<div className={styles.container}>
				<div className={styles.sectionHead}>
					<div>
						<p className={styles.eyebrow}><Users aria-hidden="true" size={14} /> Sellers</p>
						<h2 id="product-sellers-title">
							{total ? `Available from ${total + 1} sellers` : "Sold by Avokarto"}
						</h2>
					</div>
					<Link href="/sellers">Browse all sellers <ArrowUpRight aria-hidden="true" size={15} /></Link>
				</div>

				<ul className={styles.offerList}>
					<li className={`${styles.offer} ${styles.offerOfficial}`}>
						<span className={styles.officialMark}>
							<Image alt="" height={44} src="/assets/images/logo/avokarto-logo-mark.webp" width={44} />
						</span>
						<div className={styles.offerWho}>
							<p className={styles.offerName}>Avokarto <BadgeCheck aria-label="Official" className={styles.verified} size={16} /></p>
							<p className={styles.muted}><ShieldCheck aria-hidden="true" size={14} /> Sold &amp; shipped by Avokarto</p>
						</div>
						<div className={styles.offerPrice}>
							<strong>{formatCurrency(price, "USD")}</strong>
							<span className={styles.muted}>This page</span>
						</div>
					</li>

					{sellers.map((seller) => (
						<li className={styles.offer} key={seller.id} style={sellerStyle(seller)}>
							<Link aria-label={`${seller.name} profile`} className={styles.offerAvatar} href={sellerPath(seller.handle)}>
								<SellerAvatar seller={seller} size={48} />
							</Link>
							<div className={styles.offerWho}>
								<p className={styles.offerName}>
									<Link href={sellerPath(seller.handle)}>{seller.name}</Link>
									<BadgeCheck aria-label="Avokarto partner" className={styles.verified} size={16} />
								</p>
								<p className={styles.offerMeta}>
									<RatingInline rating={seller.rating} reviews={seller.reviews} />
									<span>{compactNumber(seller.followers)} followers</span>
									<span>{compactNumber(seller.products)} products</span>
								</p>
								<SellerBadges badges={seller.badges.filter((badge) => badge !== "partner").slice(0, 2)} compact />
							</div>
							<div className={styles.offerPrice}>
								<strong>{formatCurrency(seller.price, "USD")}</strong>
								<span className={styles.muted}>{seller.inStock ? "In stock" : "Sold out"}</span>
							</div>
							<div className={styles.offerActions}>
								<Link className={styles.btnGhost} href={sellerPath(seller.handle)}>Profile</Link>
								{productSlug ? (
									<a className={styles.btnSeller} href={sellerProductUrl(seller.storeUrl, productSlug)} rel="noopener">
										<Store aria-hidden="true" size={15} /> Shop
									</a>
								) : null}
							</div>
						</li>
					))}
				</ul>

				<p className={styles.offerFoot}>
					{total > sellers.length ? <>Showing the {sellers.length} most-followed sellers. </> : null}
					Every seller&apos;s order is fulfilled by Avokarto. <Link href="/">Sell this product in your own store →</Link>
				</p>
			</div>
		</section>
	);
}
