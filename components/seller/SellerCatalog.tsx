"use client";

import { Check, ExternalLink, Loader2, Percent, Plus, Search, SlidersHorizontal, Star, Store, TrendingUp, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import MarginSheet from "./MarginSheet";
import ProductImage from "./ProductImage";
import { money, sellerRequest, type SellerSettings, type SellerStore } from "./sellerApi";
import styles from "./seller.module.css";

type CatalogItem = {
	basePrice: number;
	category: string;
	id: string;
	imageUrl: string;
	inStore: boolean;
	isNew: boolean;
	listingId: string | null;
	maxNet: number;
	name: string;
	oldPrice: number | null;
	otherStores: number;
	rating: number;
	reviewCount: number;
	slug: string;
	stock: number;
	suggested: { margin: number; net: number; platformFee: number; salePrice: number };
	trending: boolean;
	unitsSold30: number;
};
type Category = { id: string; name: string };
type CatalogPage = { hasMore: boolean; items: CatalogItem[] };
const EMPTY_PAGE: CatalogPage = { hasMore: false, items: [] };
const PAGE = 24;

const SORTS = [
	["winning", "Winning products"],
	["profit", "Highest profit"],
	["newest", "Newest"],
	["rating", "Top rated"],
	["price-low", "Lowest price"],
] as const;
type Sort = (typeof SORTS)[number][0];

/**
 * Product research for dropshipping: what's selling across Avokarto, what
 * each product earns, and how many other stores already sell it - then
 * add one, or several at once, to the store.
 */
export default function SellerCatalog({
	onToast,
	settings,
	store,
}: {
	onToast: (message: string) => void;
	settings: SellerSettings;
	store: SellerStore;
}) {
	const [query, setQuery] = useState("");
	const [debounced, setDebounced] = useState("");
	const [category, setCategory] = useState<string>("");
	const [sort, setSort] = useState<Sort>("winning");
	const [hideAdded, setHideAdded] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [customizing, setCustomizing] = useState<CatalogItem | null>(null);
	// Bulk add: products picked on this filter set.
	const [selected, setSelected] = useState<Map<string, CatalogItem>>(() => new Map());
	const [bulkBusy, setBulkBusy] = useState(false);
	const defaultMargin = Math.min(store.defaultMarginPercent, settings.maxMarginPercent);
	const canSell = store.status !== "suspended";

	useEffect(() => {
		const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
		return () => window.clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		fetch("/api/categories", { credentials: "same-origin" })
			.then((response) => response.json())
			.then((payload: { data?: { id: string; name: string }[] }) =>
				setCategories((payload.data ?? []).map(({ id, name }) => ({ id, name }))),
			)
			.catch(() => undefined);
	}, []);

	const params = new URLSearchParams({ limit: String(PAGE), sort });
	if (debounced) params.set("q", debounced);
	if (category) params.set("category", category);
	if (hideAdded) params.set("hideAdded", "1");
	const filtersKey = params.toString();
	// First page is live: stock-outs and price changes elsewhere reflow it.
	const firstPage = useLiveResource<CatalogPage>({
		dataKey: filtersKey,
		endpoint: `/api/seller/catalog?${filtersKey}`,
		initialData: EMPTY_PAGE,
		topics: ["products", "resellers"],
	});
	// "Load more" pages, remembered per filter set.
	const [more, setMore] = useState<{ hasMore: boolean; items: CatalogItem[]; key: string } | null>(null);
	const [loadingMore, setLoadingMore] = useState(false);
	const [moreError, setMoreError] = useState<string | null>(null);
	// Products added in this session, shown as "In your store" right away.
	const [added, setAdded] = useState<Set<string>>(() => new Set());

	const extra = more?.key === filtersKey ? more : null;
	const items = [...firstPage.data.items, ...(extra?.items ?? [])].map((item) =>
		added.has(item.id) ? { ...item, inStore: true } : item,
	);
	const hasMore = extra ? extra.hasMore : firstPage.data.hasMore;
	const error = firstPage.error ?? moreError;
	const loading = firstPage.loading || loadingMore;
	const picked = [...selected.values()].filter((item) => !added.has(item.id));
	const pickedProfit = picked.reduce((sum, item) => sum + item.suggested.net, 0);
	const addable = items.filter((item) => !item.inStore);
	const allPicked = addable.length > 0 && addable.every((item) => selected.has(item.id));

	async function loadMore() {
		setLoadingMore(true);
		setMoreError(null);
		const next = new URLSearchParams(filtersKey);
		next.set("offset", String(items.length));
		try {
			const page = await sellerRequest<CatalogPage>("GET", `/api/seller/catalog?${next}`);
			setMore({ hasMore: page.hasMore, items: [...(extra?.items ?? []), ...page.items], key: filtersKey });
		} catch (caught) {
			setMoreError((caught as Error).message);
		} finally {
			setLoadingMore(false);
		}
	}

	async function add(item: CatalogItem, marginType: "fixed" | "percent", marginValue: number) {
		await sellerRequest("POST", "/api/seller/listings", {
			marginType,
			marginValue,
			productId: item.id,
		});
		setAdded((current) => new Set(current).add(item.id));
	}

	async function quickAdd(item: CatalogItem) {
		setBusyId(item.id);
		try {
			await add(item, "percent", defaultMargin);
			onToast(`Added to ${store.name}`);
		} catch (caught) {
			onToast((caught as Error).message);
		} finally {
			setBusyId(null);
		}
	}

	async function addPicked() {
		setBulkBusy(true);
		const results = await Promise.allSettled(picked.map((item) => add(item, "percent", defaultMargin)));
		const failed = results.filter((result) => result.status === "rejected").length;
		const done = results.length - failed;
		setBulkBusy(false);
		// Failed ones stay selected so they can be retried.
		setSelected((current) => {
			const next = new Map(current);
			picked.forEach((item, index) => {
				if (results[index].status === "fulfilled") next.delete(item.id);
			});
			return next;
		});
		onToast(
			failed
				? `Added ${done} of ${results.length} - ${failed} couldn't be added. Try again.`
				: `Added ${done} product${done === 1 ? "" : "s"} to ${store.name}`,
		);
	}

	function toggle(item: CatalogItem) {
		setSelected((current) => {
			const next = new Map(current);
			if (next.has(item.id)) next.delete(item.id);
			else next.set(item.id, item);
			return next;
		});
	}

	function changeFilters(apply: () => void) {
		apply();
		setSelected(new Map());
	}

	return (
		<section className={styles.stack}>
			<div className={`${styles.card} ${styles.catalogHead}`}>
				<div className={styles.cardHead}>
					<div>
						<h2 className={styles.cardTitle}>Find winning products</h2>
						<p className={styles.muted}>
							What&apos;s selling across Avokarto, what it earns you and how many stores already sell it. We stock, pack and ship every order.
						</p>
					</div>
					<div className={styles.catalogPerks}>
						<span><Truck size={14} /> We ship</span>
						<span><Percent size={14} /> Default margin {defaultMargin}%</span>
					</div>
				</div>
				<div className={styles.catalogTools}>
					<div className={styles.searchBar}>
						<Search aria-hidden="true" />
						<input
							aria-label="Search the catalog"
							className={styles.input}
							onChange={(event) => changeFilters(() => setQuery(event.target.value))}
							placeholder="Search products, categories or brands"
							type="search"
							value={query}
						/>
					</div>
					<label className={styles.sortSelect}>
						<span className="visually-hidden">Sort by</span>
						<select className={styles.input} onChange={(event) => changeFilters(() => setSort(event.target.value as Sort))} value={sort}>
							{SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
						</select>
					</label>
					<label className={styles.switch}>
						<input checked={hideAdded} onChange={(event) => changeFilters(() => setHideAdded(event.target.checked))} type="checkbox" />
						<span aria-hidden="true" />
						Hide products in my store
					</label>
				</div>
				{categories.length ? (
					<div aria-label="Filter by category" className={styles.chips} role="group" style={{ marginTop: 12 }}>
						<button aria-pressed={!category} className={styles.chip} onClick={() => changeFilters(() => setCategory(""))} type="button">All</button>
						{categories.map((entry) => (
							<button aria-pressed={category === entry.id} className={styles.chip} key={entry.id} onClick={() => changeFilters(() => setCategory(entry.id))} type="button">
								{entry.name}
							</button>
						))}
					</div>
				) : null}
			</div>

			{error ? <p className={styles.alert} role="alert">{error}</p> : null}

			{addable.length && canSell ? (
				<div className={styles.catalogMeta}>
					<p className={styles.muted}>
						{sort === "winning" ? "Ranked by sales across Avokarto in the last 30 days." : `Sorted by ${SORTS.find(([value]) => value === sort)?.[1].toLowerCase()}.`}
					</p>
					<button
						className={`${styles.ghost} ${styles.btnSm}`}
						onClick={() => setSelected(allPicked ? new Map() : new Map(addable.map((item) => [item.id, item])))}
						type="button"
					>
						{allPicked ? "Clear selection" : `Select all ${addable.length}`}
					</button>
				</div>
			) : null}

			{!loading && !items.length && !error ? (
				<div className={`${styles.card} ${styles.empty}`}>
					<span className={styles.emptyIcon}><Search /></span>
					<p className={styles.cardTitle}>{hideAdded && !debounced && !category ? "You've added everything" : "No products match"}</p>
					<p className={styles.muted}>{hideAdded ? "Turn off “Hide products in my store” to see them all." : "Try another search or category."}</p>
				</div>
			) : null}

			<div className={styles.products}>
				{items.map((item) => {
					const isPicked = selected.has(item.id) && !item.inStore;
					return (
						<article className={`${styles.productCard} ${styles.dropCard}`} data-picked={isPicked || undefined} data-added={item.inStore || undefined} key={item.id}>
							<div className={styles.productImage}>
								<ProductImage alt="" sizes="(min-width: 1100px) 230px, (min-width: 640px) 30vw, 48vw" src={item.imageUrl} />
								<div className={styles.dropBadges}>
									{item.trending ? <span className={styles.badgeHot}><TrendingUp size={12} /> Trending</span> : null}
									{item.isNew ? <span className={styles.badgeNew}>New</span> : null}
									{item.stock <= 5 ? <span className={styles.badgeAmber}>Only {item.stock} left</span> : null}
								</div>
								{!item.inStore && canSell ? (
									<label className={styles.pick} title="Select for bulk add">
										<input aria-label={`Select ${item.name}`} checked={isPicked} onChange={() => toggle(item)} type="checkbox" />
										<span aria-hidden="true"><Check size={14} /></span>
									</label>
								) : null}
								{/* The number a dropshipper scans for first, as on the homepage cards. */}
								{item.inStore ? (
									<span className={styles.addedFlag}><Check size={13} /> In your store</span>
								) : (
									<span className={styles.dropProfit}>+{money(item.suggested.net)} <small>profit</small></span>
								)}
							</div>
							<div className={styles.productBody}>
								<p className={styles.dropMeta}>
									{item.category ? <span>{item.category}</span> : null}
									{item.reviewCount > 0 ? <span className={styles.dropRating}><Star size={12} /> {item.rating.toFixed(1)} ({item.reviewCount})</span> : null}
								</p>
								<p className={styles.productName} title={item.name}>{item.name}</p>
								<ul className={styles.signals}>
									<li data-strong={item.unitsSold30 > 0 || undefined}>
										<TrendingUp size={13} /> {item.unitsSold30 > 0 ? `${item.unitsSold30} sold / 30 days` : "No sales yet"}
									</li>
									<li data-strong={item.otherStores === 0 || undefined}>
										<Store size={13} /> {item.otherStores === 0 ? "No other sellers yet" : `${item.otherStores} other store${item.otherStores === 1 ? "" : "s"}`}
									</li>
								</ul>
								<dl className={styles.profitBox}>
									<div><dt>Cost</dt><dd>{money(item.basePrice)}</dd></div>
									<div data-sell=""><dt>{item.inStore ? "Your price" : "You sell"}</dt><dd>{money(item.suggested.salePrice)}</dd></div>
									{item.inStore ? <div data-profit=""><dt>Profit</dt><dd>{money(item.suggested.net)}</dd></div> : null}
								</dl>
								{!item.inStore && item.maxNet > item.suggested.net ? (
									<p className={styles.hint}>Up to {money(item.maxNet)} at {settings.maxMarginPercent}% margin</p>
								) : null}
								{item.inStore ? (
									<a className={styles.dropView} href={`/product/${item.slug}`} rel="noopener" target="_blank">
										<ExternalLink size={14} /> View product
									</a>
								) : (
									<div className={styles.dropActions}>
										<button
											aria-busy={busyId === item.id || undefined}
											className={styles.trendAdd}
											disabled={busyId === item.id || bulkBusy || !canSell}
											onClick={() => void quickAdd(item)}
											type="button"
										>
											<span className={styles.trendAddLabel}>Add to store</span>
											<span aria-hidden="true" className={styles.trendAddDot}>
												{busyId === item.id ? <Loader2 className={styles.spin} size={14} /> : <Plus size={14} />}
											</span>
										</button>
										<button
											aria-label={`Set margin for ${item.name}`}
											className={styles.dropIcon}
											disabled={!canSell || bulkBusy}
											onClick={() => setCustomizing(item)}
											title="Set your own margin"
											type="button"
										>
											<SlidersHorizontal size={15} />
										</button>
										<a
											aria-label={`Preview ${item.name}`}
											className={styles.dropIcon}
											href={`/product/${item.slug}`}
											rel="noopener"
											target="_blank"
											title="Preview product"
										>
											<ExternalLink size={15} />
										</a>
									</div>
								)}
							</div>
						</article>
					);
				})}
				{loading ? Array.from({ length: items.length ? 4 : 8 }, (_, index) => (
					<div className={styles.skeleton} key={`s${index}`} style={{ aspectRatio: "0.6" }} />
				)) : null}
			</div>

			{hasMore && !loading ? (
				<button className={`${styles.ghost} ${styles.btnBlock}`} onClick={() => void loadMore()} type="button">
					Load more products
				</button>
			) : null}

			{picked.length ? (
				<div aria-live="polite" className={styles.bulkBar} role="region" aria-label="Bulk add">
					<div style={{ minWidth: 0 }}>
						<p className={styles.bulkTitle}>{picked.length} selected</p>
						<p className={styles.bulkSub}>~{money(pickedProfit)} profit if each sells once</p>
					</div>
					<button aria-label="Clear selection" className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`} disabled={bulkBusy} onClick={() => setSelected(new Map())} type="button">
						<X size={15} />
					</button>
					<button className={styles.btn} disabled={bulkBusy || !canSell} onClick={() => void addPicked()} type="button">
						{bulkBusy ? <Loader2 className={styles.spin} size={16} /> : <Plus size={16} />}
						Add {picked.length} at {defaultMargin}%
					</button>
				</div>
			) : null}

			{customizing ? (
				<MarginSheet
					basePrice={customizing.basePrice}
					initialValue={defaultMargin}
					onClose={() => setCustomizing(null)}
					onSave={async (marginType, marginValue) => {
						await add(customizing, marginType, marginValue);
						onToast(`Added to ${store.name}`);
						setCustomizing(null);
					}}
					productName={customizing.name}
					saveLabel="Add to my store"
					settings={settings}
				/>
			) : null}
		</section>
	);
}
