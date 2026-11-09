"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TypeAnimation from "@/components/common/ui/TypeAnimation";
import SearchableDropdown from "@/components/common/select/SearchableDropdown";
import { useLiveCategories } from "@/hooks/use-live-categories";
import { useLiveProducts } from "@/hooks/use-live-products";
import { useCurrency } from "@/lib/currency";
import styles from "./SearchWithCategory.module.css";

const ALL_CATEGORIES = "All Categories";
const SUGGESTION_LIMIT = 5;

export default function SearchWithCategory({
  parentClass = "rbt-search-with-category uni-header-swc-one uni-header-swc-md",
}) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { categories: liveCategories } = useLiveCategories();
  const categoryOptions = [ALL_CATEGORIES, ...liveCategories.map((c) => c.name)];

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { products: suggestions, loading } = useLiveProducts({
    limit: SUGGESTION_LIMIT,
    search: debouncedQuery || undefined,
    categories: activeCategory === ALL_CATEGORIES ? [] : [activeCategory],
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navigateToResults = () => {
    setIsFocused(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory !== ALL_CATEGORIES) params.set("category", activeCategory);
    const queryString = params.toString();
    router.push(queryString ? `/shop?${queryString}` : "/shop");
  };

  const showSuggestions = isFocused && debouncedQuery.length > 0;

  return (
    <div className={parentClass} ref={wrapperRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigateToResults();
        }}
      >
        <div className="rbt-inner-search-field border-0" style={{ position: "relative" }}>
          <div className="rbt-search-input-section has-left-catagory-section rbt-inner-search-label-animate-activation">
            <div className="filter-select rbt-modern-select search-by-category">
              <SearchableDropdown
                options={categoryOptions}
                selected={activeCategory}
                onChange={setActiveCategory}
                placeholder={ALL_CATEGORIES}
                searchPlaceholder="Search Categories"
                menuMinWidth="220px"
              />
            </div>

            <input
              type="text"
              placeholder={isFocused ? "Search products..." : ""}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              aria-label="Search products"
            />
            {!isFocused && !query && (
              <span className="cd-headline clip is-full-width">
                <TypeAnimation
                  strings={[
                    "Search dresses, denim, jackets...",
                    "Find your next wardrobe staple...",
                    "Explore bags, shoes, accessories...",
                  ]}
                />
              </span>
            )}
          </div>
          <button className="rbt-round-btn search-btn" type="submit" aria-label="Search">
            <i className="fa-sharp fa-solid fa-magnifying-glass" />
          </button>

          {showSuggestions && (
            <div className={styles.suggestions}>
              {loading ? (
                <p className={styles.emptyState}>Searching…</p>
              ) : suggestions.length ? (
                <>
                  {suggestions.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug ?? product.id}`}
                      className={styles.suggestionItem}
                      onClick={() => setIsFocused(false)}
                    >
                      <span className={styles.thumb}>
                        <Image
                          src={product.imgSrc}
                          alt={product.title}
                          fill
                          sizes="44px"
                        />
                      </span>
                      <span className={styles.info}>
                        <span className={styles.title}>{product.title}</span>
                        <span className={styles.price}>
                          {typeof product.price === "number"
                            ? formatPrice(product.price)
                            : product.price}
                        </span>
                      </span>
                    </Link>
                  ))}
                  <button
                    type="button"
                    className={styles.viewAll}
                    onClick={navigateToResults}
                  >
                    View all results for &quot;{debouncedQuery}&quot;
                  </button>
                </>
              ) : (
                <p className={styles.emptyState}>
                  No products matched &quot;{debouncedQuery}&quot;.
                </p>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
