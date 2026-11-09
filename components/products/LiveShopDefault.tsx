"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import ShopDefault from "@/components/products/ShopDefault";
import { useLiveShopProducts } from "@/hooks/use-live-shop-products";
import type { Product } from "@/types/product";
import { normalizeCategoryNames } from "@/lib/storefront-categories";

type LiveShopDefaultProps = Omit<
	ComponentProps<typeof ShopDefault>,
	"products" | "searchQuery" | "onSearchQueryChange" | "onCategoriesChange" |
	"productsLoading" | "productsError" | "productsReady" | "onRetryProducts"
> & {
	// Seeds the search box and the real backend query from the header
	// search bar's "View all results" link (/shop?q=...) - see
	// SearchWithCategory.tsx.
	initialSearch?: string;
	initialProducts?: Product[];
};

export default function LiveShopDefault({
	initialSearch = "",
	initialProducts,
	...props
}: LiveShopDefaultProps) {
	const [pageCount, setPageCount] = useState(1);
	const [searchQuery, setSearchQuery] = useState(initialSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
	const initialCategoriesKey = JSON.stringify(normalizeCategoryNames(props.defaultFilterCategory));
	const [categories, setCategories] = useState(() => normalizeCategoryNames(props.defaultFilterCategory));
	const categoriesKey = JSON.stringify(categories);
	const queryKey = JSON.stringify([debouncedSearch, categoriesKey]);
	const [pagesResetFor, setPagesResetFor] = useState(queryKey);

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
		return () => clearTimeout(timeout);
	}, [searchQuery]);

	// Search and category changes start a new result set.
	if (queryKey !== pagesResetFor) {
		setPagesResetFor(queryKey);
		setPageCount(1);
	}

	const { products, hasMore, loading, refreshing, error, hasData, refresh } = useLiveShopProducts({
		pageCount,
		search: debouncedSearch || undefined,
		categories,
		initialProducts: pageCount === 1 && debouncedSearch === initialSearch && categoriesKey === initialCategoriesKey
			? initialProducts
			: undefined,
	});

	const isDebouncing = searchQuery.trim() !== debouncedSearch;

	return (
		<ShopDefault
			{...props}
			loaderType="infinite"
			products={products}
			hasMoreRemote={hasMore}
			remoteLoading={loading || refreshing}
			onLoadMore={() => {
				if (!loading && !refreshing && !error && hasMore) setPageCount((current) => current + 1);
			}}
			searchQuery={searchQuery}
			onSearchQueryChange={setSearchQuery}
			onCategoriesChange={setCategories}
			productsLoading={loading || isDebouncing}
			productsError={error}
			productsReady={hasData}
			onRetryProducts={refresh}
		/>
	);
}
