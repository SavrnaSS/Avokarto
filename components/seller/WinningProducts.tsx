"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SellLandingData } from "@/lib/backend/sell-landing";
import { resellerPrice } from "@/lib/resellerPricing";
import ProductImage from "./ProductImage";
import { money } from "./sellerApi";
import p from "./profit-panel.module.css";

/**
 * The top four products, sold to dropshippers: one dark panel makes the offer
 * with real figures at the top margin, then four plain cards each say one
 * thing, the profit. Photos are never cropped, and a tap shows one full size.
 */
export default function WinningProducts({ basis, hasStore, maxMargin, onClaim, platformFeePercent, products, topPrice }: {
	basis: SellLandingData["basis"];
	hasStore: boolean;
	maxMargin: number;
	onClaim?: () => void;
	platformFeePercent: number;
	products: SellLandingData["products"];
	/** The catalog's highest price; the panel's figures come from it when it tops these four. */
	topPrice?: SellLandingData["topPrice"];
}) {
	// Always the top margin, the most a seller can earn.
	const margin = maxMargin;
	const [viewing, setViewing] = useState<SellLandingData["products"][number] | null>(null);
	const viewer = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = viewer.current;
		if (viewing && dialog && !dialog.open) dialog.showModal();
	}, [viewing]);

	const quoteFor = (price: number) => resellerPrice(price, "percent", margin, { maxMarginPercent: maxMargin, platformFeePercent });
	// The most a seller can earn on one sale, from the whole catalog.
	const bestProfit = Math.max(0, ...[topPrice ?? 0, ...products.map((product) => product.price)].map((price) => quoteFor(price).net));
	// What a seller earns on each dollar of product cost, after any platform fee.
	const centsPerDollar = Math.round(margin * (1 - platformFeePercent / 100));

	return (
		<div className={p.sheet}>
			<div className={p.offer}>
				<div className={p.pitch}>
					<p className={p.margin}>{margin}% margin on every product</p>
					<p className={p.lead}>Earn {centsPerDollar}¢ on every $1 of product cost</p>
				</div>
				<dl className={p.stats}>
					<div data-main=""><dt>Top profit per sale</dt><dd>{money(bestProfit)}</dd></div>
					<div><dt>On 10 sales</dt><dd>{money(bestProfit * 10)}</dd></div>
					<div><dt>You pay for stock</dt><dd>$0</dd></div>
				</dl>
			</div>
			<ul className={p.grid}>
				{products.map((product, index) => {
					const quote = quoteFor(product.price);
					return (
						<li className={p.card} data-product="" key={product.id}>
							<button aria-haspopup="dialog" aria-label={`See the full image of ${product.title}`} className={p.photo} onClick={() => setViewing(product)} type="button">
								<ProductImage alt="" fit="contain" sizes="(min-width: 992px) 300px, 50vw" src={product.imgSrc} />
							</button>
							<div className={p.body}>
								<p className={p.tag}>{basis === "sales" && product.unitsSold > 0 && index < 3 ? `#${index + 1} best seller` : product.category}</p>
								<p className={p.name}>{product.title}</p>
								<p className={p.profit} data-keep=""><strong>+{money(quote.net)}</strong> <span>profit per sale</span></p>
								<dl className={p.lines}>
									<div><dt>You sell at</dt><dd>{money(quote.salePrice)}</dd></div>
									<div><dt>Product + fulfilment</dt><dd>{money(product.price)}</dd></div>
									{quote.platformFee > 0 ? <div><dt>Platform fee</dt><dd>{money(quote.platformFee)}</dd></div> : null}
								</dl>
								<Link aria-label={`Add ${product.title} to my store - your profit is ${money(quote.net)} on every sale`} className={p.add} href={hasStore ? "/seller?tab=catalog" : "/start"} onClick={hasStore ? undefined : onClaim}><Plus aria-hidden="true" size={16} />Add to store</Link>
							</div>
						</li>
					);
				})}
			</ul>
			<p className={p.note}>Any delivery charge at checkout is paid by the shopper, never out of your profit.</p>
			<dialog aria-label={viewing ? `Full image of ${viewing.title}` : "Full image"} className={p.viewer} onClick={(event) => { if (event.target === event.currentTarget) viewer.current?.close(); }} onClose={() => setViewing(null)} ref={viewer}>
				{viewing ? (
					<div className={p.viewerBody}>
						<div className={p.viewerBar}><p>{viewing.title}</p><button aria-label="Close" onClick={() => viewer.current?.close()} type="button"><X size={20} /></button></div>
						<div className={p.viewerImage}><ProductImage alt={viewing.title} fit="contain" sizes="100vw" src={viewing.imgSrc} /></div>
					</div>
				) : null}
			</dialog>
		</div>
	);
}
