"use client";

import { ArrowRight, Check, Clapperboard, Loader2, Play, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import ProductImage from "./ProductImage";
import { money, sellerRequest, type SellerSettings, type SellerStore } from "./sellerApi";
import styles from "./seller.module.css";
import h from "./studio-home.module.css";

type Pick = {
	basePrice: number;
	category: string;
	id: string;
	imageUrl: string;
	name: string;
	rating: number;
	reviewCount: number;
	suggested: { net: number; salePrice: number };
	trending: boolean;
	unitsSold30: number;
};

/**
 * Home → "Trending to add": the catalog's winning products this store
 * doesn't sell yet, each one tap from being added at the default margin.
 */
export function TrendingPicks({
	className,
	onSeeAll,
	onToast,
	settings,
	store,
}: {
	className: string;
	onSeeAll: () => void;
	onToast: (message: string) => void;
	settings: SellerSettings;
	store: SellerStore;
}) {
	const [picks, setPicks] = useState<Pick[] | null>(null);
	const [failed, setFailed] = useState(false);
	const [added, setAdded] = useState<Set<string>>(() => new Set());
	const [busy, setBusy] = useState<string | null>(null);
	const margin = Math.min(store.defaultMarginPercent, settings.maxMarginPercent);

	useEffect(() => {
		let active = true;
		sellerRequest<{ items: Pick[] }>("GET", "/api/seller/catalog?sort=winning&hideAdded=1&limit=4")
			.then((page) => {
				if (active) setPicks(page.items);
			})
			.catch(() => {
				if (active) setFailed(true);
			});
		return () => {
			active = false;
		};
	}, []);

	async function add(pick: Pick) {
		setBusy(pick.id);
		try {
			await sellerRequest("POST", "/api/seller/listings", { marginType: "percent", marginValue: margin, productId: pick.id });
			setAdded((current) => new Set(current).add(pick.id));
			onToast(`Added to ${store.name}`);
		} catch (caught) {
			onToast((caught as Error).message);
		} finally {
			setBusy(null);
		}
	}

	if (failed || (picks && !picks.length)) return null;

	return (
		<section aria-labelledby="home-trending" className={`${h.panel} ${className}`}>
			<div className={h.trendHead}>
				<div>
					<h2 className={h.title} id="home-trending">Trending to add</h2>
					<p className={h.sub}>Selling across Avokarto now, not in your store yet. Added at your {margin}% margin.</p>
				</div>
				<button className={h.textButton} onClick={onSeeAll} type="button">See all<ArrowRight aria-hidden="true" size={14} /></button>
			</div>
			<ul className={h.trendGrid}>
				{picks
					? picks.map((pick, index) => {
						const isAdded = added.has(pick.id);
						return (
							<li className={h.trendTile} key={pick.id}>
								<span className={h.trendPhoto}>
									<ProductImage alt="" fit="contain" sizes="(min-width: 1100px) 220px, 45vw" src={pick.imageUrl} />
									{/* "Best seller" only when it actually sold this month. */}
									<span className={h.trendRank}>#{index + 1}{pick.unitsSold30 > 0 ? " best seller" : ""}</span>
								</span>
								<span className={h.trendMeta}>
									<span>{pick.category}</span>
									{pick.reviewCount > 0 ? <span><Star aria-hidden="true" size={12} /> {pick.rating.toFixed(1)} ({pick.reviewCount})</span> : null}
								</span>
								<span className={h.trendName} title={pick.name}>{pick.name}</span>
								<span className={h.trendProfit}>+{money(pick.suggested.net)} <small>profit</small></span>
								<span className={h.trendPrices}>Cost {money(pick.basePrice)} · you sell at {money(pick.suggested.salePrice)}</span>
								<button
									aria-busy={busy === pick.id || undefined}
									aria-label={isAdded ? `${pick.name} added` : `Add ${pick.name} to your store`}
									className={h.trendAdd}
									data-done={isAdded || undefined}
									disabled={isAdded || busy === pick.id || store.status === "suspended"}
									onClick={() => void add(pick)}
									type="button"
								>
									{busy === pick.id ? <Loader2 aria-hidden="true" className={h.spin} size={16} /> : isAdded ? <Check aria-hidden="true" size={16} /> : <Plus aria-hidden="true" size={16} />}
									{isAdded ? "Added" : "Add to store"}
								</button>
							</li>
						);
					})
					: [0, 1, 2, 3].map((index) => <li className={h.trendTile} data-loading="" key={index} />)}
			</ul>
		</section>
	);
}

/** Home → a way into the video studio. */
export function VideoPromo({ className, onOpen }: { className: string; onOpen: () => void }) {
	return (
		<section aria-labelledby="home-video" className={`${h.panel} ${h.video} ${className}`}>
			{/* The three formats it makes: landscape and square behind a 9:16 phone. */}
			<div aria-hidden="true" className={h.videoStage}>
				<span />
				<span />
				<span><Play size={16} /></span>
			</div>
			<div>
				<h2 className={h.title} id="home-video">Video studio</h2>
				<p className={h.sub}>Turn any product into a Reel, TikTok or Short in seconds, with your prices and colours. Music included.</p>
			</div>
			<ul className={h.videoFormats}>
				<li>4 animated styles</li>
				<li>9:16, 1:1 and 16:9</li>
				<li>Auto captions</li>
			</ul>
			<button className={`${styles.btn} ${styles.btnBlock}`} onClick={onOpen} type="button"><Clapperboard size={16} /> Create a video</button>
		</section>
	);
}
