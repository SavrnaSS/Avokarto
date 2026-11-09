"use client";

import { Clapperboard, Globe, Info, LayoutGrid, Mail, MessageCircle, PackageCheck, Play, Search, ShieldCheck, Star, Truck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import ProductImage from "@/components/seller/ProductImage";
import type { SellerProduct, SellerReel } from "@/lib/backend/seller-profiles";
import type { StoreSocials } from "@/lib/backend/resellers";
import { formatCurrency } from "@/lib/price";
import { compactNumber, joinedLabel, sellerProductUrl } from "./sellerFormat";
import styles from "./sellers.module.css";

type Tab = "products" | "reels" | "about";
type Sort = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

const PAGE = 24;
const SOCIAL_LABELS: Record<keyof StoreSocials, string> = {
	facebook: "Facebook",
	instagram: "Instagram",
	website: "Website",
	youtube: "YouTube",
};

const money = (value: number) => formatCurrency(value, "USD");

function sortProducts(products: SellerProduct[], sort: Sort) {
	const list = [...products];
	switch (sort) {
		case "newest": return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		case "price-asc": return list.sort((a, b) => a.price - b.price);
		case "price-desc": return list.sort((a, b) => b.price - a.price);
		case "rating": return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
		default: return list; // the seller's own order: featured first, then newest
	}
}

export default function SellerProfileTabs({
	about,
	categories,
	contactEmail,
	listings,
	name,
	orders,
	reels,
	since,
	socials,
	storeUrl,
	whatsapp,
}: {
	about: string;
	categories: { count: number; name: string }[];
	contactEmail: string;
	listings: SellerProduct[];
	name: string;
	orders: number;
	reels: SellerReel[];
	since: string;
	socials: StoreSocials;
	storeUrl: string;
	whatsapp: string;
}) {
	const tabs: { count?: number; icon: typeof Info; id: Tab; label: string }[] = [
		{ count: listings.length, icon: LayoutGrid, id: "products", label: "Products" },
		...(reels.length ? [{ count: reels.length, icon: Clapperboard, id: "reels" as Tab, label: "Reels" }] : []),
		{ icon: Info, id: "about", label: "About" },
	];
	const [tab, setTab] = useState<Tab>("products");
	const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

	// Deep links (#reels, #about) open that tab.
	useEffect(() => {
		const fromHash = window.location.hash.slice(1) as Tab;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (tabs.some((entry) => entry.id === fromHash)) setTab(fromHash);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const select = (next: Tab) => {
		setTab(next);
		window.history.replaceState(null, "", next === "products" ? window.location.pathname + window.location.search : `#${next}`);
	};

	const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
		event.preventDefault();
		const index = tabs.findIndex((entry) => entry.id === tab);
		const nextIndex = event.key === "Home" ? 0
			: event.key === "End" ? tabs.length - 1
				: (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
		const next = tabs[nextIndex].id;
		select(next);
		tabRefs.current[next]?.focus();
	};

	return (
		<section className={styles.tabsSection}>
			<div aria-label={`${name} profile sections`} className={styles.tabList} role="tablist">
				{tabs.map(({ count, icon: Icon, id, label }) => (
					<button
						aria-controls={`seller-panel-${id}`}
						aria-selected={tab === id}
						className={styles.tab}
						id={`seller-tab-${id}`}
						key={id}
						onClick={() => select(id)}
						onKeyDown={onTabKey}
						ref={(node) => { tabRefs.current[id] = node; }}
						role="tab"
						tabIndex={tab === id ? 0 : -1}
						type="button"
					>
						<Icon aria-hidden="true" size={17} />
						{label}
						{count !== undefined ? <span className={styles.tabCount}>{compactNumber(count)}</span> : null}
					</button>
				))}
			</div>

			<div aria-labelledby={`seller-tab-${tab}`} className={styles.tabPanel} id={`seller-panel-${tab}`} role="tabpanel">
				{tab === "products" ? <ProductsPanel categories={categories} listings={listings} storeUrl={storeUrl} /> : null}
				{tab === "reels" ? <ReelsPanel reels={reels} storeUrl={storeUrl} /> : null}
				{tab === "about" ? (
					<AboutPanel
						about={about}
						categories={categories}
						contactEmail={contactEmail}
						name={name}
						orders={orders}
						since={since}
						socials={socials}
						whatsapp={whatsapp}
					/>
				) : null}
			</div>
		</section>
	);
}

function ProductsPanel({ categories, listings, storeUrl }: { categories: { count: number; name: string }[]; listings: SellerProduct[]; storeUrl: string }) {
	const [category, setCategory] = useState("");
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<Sort>("featured");
	const [shown, setShown] = useState(PAGE);

	const visible = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const filtered = listings.filter((product) =>
			(!category || product.category === category) &&
			(!needle || product.name.toLowerCase().includes(needle) || product.category.toLowerCase().includes(needle)),
		);
		return sortProducts(filtered, sort);
	}, [category, listings, query, sort]);

	if (!listings.length) {
		return <EmptyState icon={LayoutGrid} text="This seller hasn't listed any products yet. Follow them to hear when they do." title="No products yet" />;
	}

	return (
		<>
			<div className={styles.toolbar}>
				<label className={styles.searchBox}>
					<Search aria-hidden="true" size={17} />
					<span className="visually-hidden">Search this seller&apos;s products</span>
					<input
						onChange={(event) => { setQuery(event.target.value); setShown(PAGE); }}
						placeholder="Search products"
						type="search"
						value={query}
					/>
					{query ? (
						<button aria-label="Clear search" onClick={() => setQuery("")} type="button"><X size={15} /></button>
					) : null}
				</label>
				<label className={styles.sortBox}>
					<span>Sort</span>
					<select onChange={(event) => setSort(event.target.value as Sort)} value={sort}>
						<option value="featured">Featured</option>
						<option value="newest">Newest</option>
						<option value="price-asc">Price: low to high</option>
						<option value="price-desc">Price: high to low</option>
						<option value="rating">Top rated</option>
					</select>
				</label>
			</div>

			{categories.length > 1 ? (
				<div aria-label="Filter by category" className={styles.chips} role="group">
					<button aria-pressed={!category} className={styles.chip} onClick={() => { setCategory(""); setShown(PAGE); }} type="button">
						All <span>{listings.length}</span>
					</button>
					{categories.map((entry) => (
						<button
							aria-pressed={category === entry.name}
							className={styles.chip}
							key={entry.name}
							onClick={() => { setCategory(entry.name); setShown(PAGE); }}
							type="button"
						>
							{entry.name} <span>{entry.count}</span>
						</button>
					))}
				</div>
			) : null}

			<p aria-live="polite" className={styles.resultCount}>
				{visible.length === listings.length ? `${listings.length} products` : `${visible.length} of ${listings.length} products`}
			</p>

			{visible.length ? (
				<ul className={styles.productGrid}>
					{visible.slice(0, shown).map((product, index) => (
						<li key={product.id}>
							<a className={styles.productCard} href={sellerProductUrl(storeUrl, product.slug)}>
								<span className={styles.productImage}>
									<ProductImage alt={product.name} priority={index < 4} sizes="(min-width: 1200px) 220px, (min-width: 768px) 30vw, 46vw" src={product.imageUrl} />
									{product.featured ? <span className={styles.productFlag}>Featured</span> : null}
									{product.oldPrice ? (
										<span className={styles.productSale}>-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>
									) : null}
									{!product.inStock ? <span className={styles.productSoldOut}>Sold out</span> : null}
								</span>
								<span className={styles.productInfo}>
									{product.category ? <span className={styles.productCategory}>{product.category}</span> : null}
									<span className={styles.productName}>{product.name}</span>
									{product.reviewCount ? (
										<span className={styles.productRating}>
											<Star aria-hidden="true" fill="currentColor" size={13} /> {product.rating.toFixed(1)}
											<span className={styles.muted}> ({compactNumber(product.reviewCount)})</span>
										</span>
									) : null}
									<span className={styles.productPrice}>
										<strong>{money(product.price)}</strong>
										{product.oldPrice ? <s>{money(product.oldPrice)}</s> : null}
									</span>
								</span>
							</a>
						</li>
					))}
				</ul>
			) : (
				<EmptyState icon={Search} text="Try another word or category." title="No matching products" />
			)}

			{visible.length > shown ? (
				<div className={styles.moreRow}>
					<button className={styles.btnGhost} onClick={() => setShown((value) => value + PAGE)} type="button">
						Show more ({visible.length - shown} left)
					</button>
				</div>
			) : null}
		</>
	);
}

function ReelsPanel({ reels, storeUrl }: { reels: SellerReel[]; storeUrl: string }) {
	const [playing, setPlaying] = useState<string | null>(null);
	return (
		<ul className={styles.reelGrid}>
			{reels.map((reel) => (
				<li className={styles.reel} key={reel.id}>
					<div className={styles.reelMedia}>
						{playing === reel.id ? (
							<video autoPlay controls playsInline poster={reel.posterUrl || undefined} src={reel.videoUrl} />
						) : (
							<button aria-label={`Play ${reel.title}`} className={styles.reelPoster} onClick={() => setPlaying(reel.id)} type="button">
								{reel.posterUrl ? <ProductImage alt="" sizes="(min-width: 992px) 220px, 46vw" src={reel.posterUrl} /> : null}
								<span className={styles.reelPlay}><Play aria-hidden="true" fill="currentColor" size={22} /></span>
								{reel.durationSeconds ? <span className={styles.reelDuration}>{Math.round(reel.durationSeconds)}s</span> : null}
							</button>
						)}
					</div>
					<a className={styles.reelProduct} href={sellerProductUrl(storeUrl, reel.product.slug)}>
						<span className={styles.reelThumb}><ProductImage alt="" sizes="40px" src={reel.product.imageUrl} /></span>
						<span>
							<span className={styles.reelName}>{reel.product.name}</span>
							<strong>{money(reel.product.price)}</strong>
						</span>
					</a>
				</li>
			))}
		</ul>
	);
}

function AboutPanel({
	about,
	categories,
	contactEmail,
	name,
	orders,
	since,
	socials,
	whatsapp,
}: {
	about: string;
	categories: { count: number; name: string }[];
	contactEmail: string;
	name: string;
	orders: number;
	since: string;
	socials: StoreSocials;
	whatsapp: string;
}) {
	const top = categories.slice(0, 6);
	const max = Math.max(1, ...top.map((entry) => entry.count));
	const socialLinks = (Object.keys(SOCIAL_LABELS) as (keyof StoreSocials)[]).filter((key) => socials[key]);
	const digits = whatsapp.replace(/[^0-9]/g, "");
	return (
		<div className={styles.aboutGrid}>
			<div className={styles.aboutCard}>
				<h2>About {name}</h2>
				{about ? <p className={styles.aboutText}>{about}</p> : <p className={styles.muted}>This seller hasn&apos;t written an introduction yet.</p>}
				<ul className={styles.factList}>
					<li><Info aria-hidden="true" size={16} /> {joinedLabel(since)}</li>
					<li><PackageCheck aria-hidden="true" size={16} /> {compactNumber(orders)} orders delivered through Avokarto</li>
				</ul>
				{socialLinks.length || digits || contactEmail ? (
					<div className={styles.contactRow}>
						{digits ? (
							<a className={styles.pill} href={`https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${name}!`)}`} rel="noopener noreferrer" target="_blank">
								<MessageCircle aria-hidden="true" size={15} /> WhatsApp
							</a>
						) : null}
						{contactEmail ? <a className={styles.pill} href={`mailto:${contactEmail}`}><Mail aria-hidden="true" size={15} /> Email</a> : null}
						{socialLinks.map((key) => (
							<a className={styles.pill} href={socials[key]} key={key} rel="noopener noreferrer nofollow" target="_blank">
								<Globe aria-hidden="true" size={15} /> {SOCIAL_LABELS[key]}
							</a>
						))}
					</div>
				) : null}
			</div>

			{top.length ? (
				<div className={styles.aboutCard}>
					<h2>What they sell</h2>
					<ul className={styles.categoryBars}>
						{top.map((entry) => (
							<li key={entry.name}>
								<span className={styles.categoryLabel}>{entry.name}<span>{entry.count}</span></span>
								<span aria-hidden="true" className={styles.categoryTrack}><span style={{ width: `${(entry.count / max) * 100}%` }} /></span>
							</li>
						))}
					</ul>
				</div>
			) : null}

			<div className={`${styles.aboutCard} ${styles.trustCard}`}>
				<h2>Buying from this seller</h2>
				<ul className={styles.factList}>
					<li><ShieldCheck aria-hidden="true" size={16} /> Secure checkout and payment protection by Avokarto</li>
					<li><Truck aria-hidden="true" size={16} /> Every order is packed, shipped and tracked by Avokarto</li>
					<li><PackageCheck aria-hidden="true" size={16} /> Avokarto&apos;s return policy applies to every purchase</li>
				</ul>
			</div>
		</div>
	);
}

function EmptyState({ icon: Icon, text, title }: { icon: typeof Info; text: string; title: string }) {
	return (
		<div className={styles.empty}>
			<span className={styles.emptyIcon}><Icon aria-hidden="true" size={26} /></span>
			<h3>{title}</h3>
			<p>{text}</p>
		</div>
	);
}
