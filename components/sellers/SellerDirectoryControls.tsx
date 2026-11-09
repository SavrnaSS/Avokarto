"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./sellers.module.css";

const SORTS = [
	{ label: "Most popular", value: "popular" },
	{ label: "Top rated", value: "rating" },
	{ label: "Most products", value: "products" },
	{ label: "Newest", value: "newest" },
];

/** Search + sort for /sellers, kept in the URL so results are linkable. */
export default function SellerDirectoryControls({ q, sort }: { q: string; sort: string }) {
	const router = useRouter();
	const pathname = usePathname();
	const [query, setQuery] = useState(q);
	const [pending, startTransition] = useTransition();

	const go = (next: { q?: string; sort?: string }) => {
		const params = new URLSearchParams();
		const nextQ = (next.q ?? query).trim();
		const nextSort = next.sort ?? sort;
		if (nextQ) params.set("q", nextQ);
		if (nextSort && nextSort !== "popular") params.set("sort", nextSort);
		startTransition(() => router.push(params.size ? `${pathname}?${params}` : pathname));
	};

	return (
		<form
			aria-busy={pending}
			className={styles.dirControls}
			onSubmit={(event) => { event.preventDefault(); go({}); }}
			role="search"
		>
			<label className={styles.searchBox}>
				<Search aria-hidden="true" size={18} />
				<span className="visually-hidden">Search sellers</span>
				<input name="q" onChange={(event) => setQuery(event.target.value)} placeholder="Search sellers by name or niche" type="search" value={query} />
			</label>
			<label className={styles.sortBox}>
				<span>Sort</span>
				<select name="sort" onChange={(event) => go({ sort: event.target.value })} value={sort}>
					{SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
				</select>
			</label>
			<button className={styles.btnPrimary} disabled={pending} type="submit">Search</button>
		</form>
	);
}
