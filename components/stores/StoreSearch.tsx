"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import ProductImage from "@/components/seller/ProductImage";
import { money } from "@/components/seller/sellerApi";
import styles from "./storefront.module.css";

export type StoreSearchItem = {
	cartId: number | string;
	category: string;
	imageUrl: string;
	inStock: boolean;
	listingId: string;
	name: string;
	price: number;
	productId: string;
	slug: string;
	stock: number;
};

const MAX_RESULTS = 6;

/** Best matches first: name starts with the query, then a word in it does, then anywhere (name or category). */
function rank(items: StoreSearchItem[], query: string) {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];
	const scored: { item: StoreSearchItem; score: number }[] = [];
	for (const item of items) {
		const name = item.name.toLowerCase();
		const score = name.startsWith(needle) ? 0 : name.includes(` ${needle}`) ? 1 : name.includes(needle) ? 2 : item.category.toLowerCase().includes(needle) ? 3 : -1;
		if (score >= 0) scored.push({ item, score: score + (item.inStock ? 0 : 0.5) });
	}
	return scored.sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name)).slice(0, MAX_RESULTS).map((entry) => entry.item);
}

/** The product name with the matched part emphasised. */
function Highlight({ query, text }: { query: string; text: string }) {
	const index = text.toLowerCase().indexOf(query.trim().toLowerCase());
	if (!query.trim() || index < 0) return <>{text}</>;
	const end = index + query.trim().length;
	return <>{text.slice(0, index)}<mark>{text.slice(index, end)}</mark>{text.slice(end)}</>;
}

/**
 * Store search with live product suggestions (photo, name, price) as you
 * type - an ARIA combobox: ↑/↓ move, Enter opens the highlighted product or
 * searches the whole store, Esc closes. `variant="menu"` shows suggestions
 * inline (inside the phone menu) instead of as a floating panel.
 */
const StoreSearch = forwardRef<HTMLInputElement, {
	basePath: string;
	index: StoreSearchItem[];
	onNavigate?: () => void;
	onSearch: (query: string) => void;
	placeholder: string;
	variant: "header" | "menu";
}>(function StoreSearch({ basePath, index, onNavigate, onSearch, placeholder, variant }, inputRef) {
	const router = useRouter();
	const id = useId();
	const root = useRef<HTMLFormElement>(null);
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const results = useMemo(() => rank(index, query), [index, query]);
	// Products, then a "search everything" row.
	const optionCount = query.trim() ? results.length + 1 : 0;
	const showPanel = open && optionCount > 0;

	// Clicking anywhere else closes the suggestions.
	useEffect(() => {
		if (!open) return;
		const onPointer = (event: PointerEvent) => {
			if (!root.current?.contains(event.target as Node)) setOpen(false);
		};
		window.addEventListener("pointerdown", onPointer);
		return () => window.removeEventListener("pointerdown", onPointer);
	}, [open]);

	const searchAll = () => {
		setOpen(false);
		onSearch(query.trim());
	};
	const openProduct = (item: StoreSearchItem) => {
		setOpen(false);
		setQuery("");
		onNavigate?.();
		router.push(`${basePath}/${item.slug}`);
	};
	const onSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (active >= 0 && active < results.length) openProduct(results[active]);
		else searchAll();
	};
	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Escape") {
			if (open) {
				event.stopPropagation(); // don't also close the menu panel
				setOpen(false);
			}
			return;
		}
		if (!optionCount || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
		event.preventDefault();
		setOpen(true);
		setActive((current) => (event.key === "ArrowDown" ? (current + 1) % optionCount : (current - 1 + optionCount) % optionCount));
	};
	const optionId = (position: number) => `${id}-option-${position}`;

	return (
		<form className={variant === "menu" ? styles.menuSearch : styles.headerSearch} data-open={showPanel || undefined} onSubmit={onSubmit} ref={root} role="search">
			<Search aria-hidden="true" size={18} />
			<label className="visually-hidden" htmlFor={`${id}-input`}>{placeholder}</label>
			<input
				aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
				aria-autocomplete="list"
				aria-controls={`${id}-list`}
				aria-expanded={showPanel}
				autoComplete="off"
				enterKeyHint="search"
				id={`${id}-input`}
				onChange={(event) => {
					setQuery(event.target.value);
					setActive(-1);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
				ref={inputRef}
				role="combobox"
				type="search"
				value={query}
			/>
			{variant === "header" ? <kbd aria-hidden="true" className={styles.searchKey}>/</kbd> : null}

			<div className={styles.suggestPanel} hidden={!showPanel}>
				<ul aria-label="Suggestions" className={styles.suggestList} id={`${id}-list`} role="listbox">
					{results.map((item, position) => (
						<li aria-selected={active === position} id={optionId(position)} key={item.slug} role="option">
							<Link
								className={styles.suggestItem}
								href={`${basePath}/${item.slug}`}
								onClick={() => {
									setOpen(false);
									setQuery("");
									onNavigate?.();
								}}
								onMouseEnter={() => setActive(position)}
								tabIndex={-1}
							>
								<span className={styles.suggestThumb}>{item.imageUrl ? <ProductImage alt="" sizes="48px" src={item.imageUrl} /> : null}</span>
								<span className={styles.suggestText}>
									<strong><Highlight query={query} text={item.name} /></strong>
									<small>{item.category || "Product"}{item.inStock ? "" : " · Sold out"}</small>
								</span>
								<span className={styles.suggestPrice}>{money(item.price)}</span>
							</Link>
						</li>
					))}
					{query.trim() ? (
						<li aria-selected={active === results.length} id={optionId(results.length)} role="option">
							<button className={styles.suggestAll} onClick={searchAll} onMouseEnter={() => setActive(results.length)} tabIndex={-1} type="button">
								{results.length ? <>See all results for “{query.trim()}”</> : <>No quick matches - search the store for “{query.trim()}”</>}
								<ArrowRight aria-hidden="true" size={16} />
							</button>
						</li>
					) : null}
				</ul>
			</div>
		</form>
	);
});

export default StoreSearch;
