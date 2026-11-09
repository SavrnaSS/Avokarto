import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProductSellerPreview } from "@/types/product";
import { initialsOf } from "./sellerFormat";
import styles from "./ProductSellerStack.module.css";

/**
 * Shop card add-on: overlapping avatars of the independent sellers who also
 * carry the product, linking to the product page's "Sold by" section.
 * Sits in the card's rating row so cards with and without sellers keep the
 * same height.
 */
export default function ProductSellerStack({ href, sellers }: { href: string; sellers?: ProductSellerPreview }) {
	if (!sellers?.count) return null;
	const names = sellers.top.map((seller) => seller.name);
	const label = `Also sold by ${sellers.count} independent ${sellers.count === 1 ? "seller" : "sellers"}${names.length ? `: ${names.join(", ")}` : ""}`;
	const extra = sellers.count - sellers.top.length;
	return (
		<Link aria-label={label} className={styles.stack} href={`${href}#product-sellers`} title={label}>
			<span aria-hidden="true" className={styles.faces}>
				{sellers.top.map((seller) => (
					<span className={styles.face} key={seller.handle} style={{ "--seller": seller.accentColor } as CSSProperties}>
						{seller.logoUrl ? <Image alt="" fill sizes="44px" src={seller.logoUrl} style={{ objectFit: "cover" }} /> : initialsOf(seller.name)}
					</span>
				))}
				{extra > 0 ? <span className={`${styles.face} ${styles.more}`}>+{extra}</span> : null}
			</span>
			<span aria-hidden="true" className={styles.text}>
				{sellers.count} {sellers.count === 1 ? "seller" : "sellers"}
			</span>
		</Link>
	);
}
