"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { GenerateReviewsModal } from "@/admin/components/products/generate-reviews-modal";
import { AppSelect } from "@/admin/components/ui/app-select";
import { StatusBadge } from "@/admin/components/products/status-badge";
import { routes } from "@/admin/config/routes";
import type { Product, ProductStatus } from "@/admin/data/products/data";
import { cn } from "@/admin/utils/cn";

type SortKey = "name" | "price" | "status" | "stock";
type SortDirection = "asc" | "desc";

type ProductListTableProps = {
	onDeleteProducts?: (skus: string[]) => Promise<void> | void;
	products: Product[];
};

const statusClass: Record<ProductStatus, string> = {
	draft: "bg-surface-muted text-ink-600",
	"low stock": "bg-warning-50 text-warning-600",
	published: "bg-success-50 text-success-600",
};

const statusLabel: Record<ProductStatus, string> = {
	draft: "Draft",
	"low stock": "Low stock",
	published: "Published",
};

const columns = [
	{ index: 3, key: "category", label: "Category" },
	{ index: 4, key: "price", label: "Price" },
	{ index: 5, key: "stock", label: "Stock" },
	{ index: 6, key: "status", label: "Status" },
] as const;

// A "published"/"low stock" row with zero stock still shows on the
// storefront (browsable, purchase disabled there) but its badge here would
// otherwise keep reading "Published" - which is how 13 of 16 catalog items
// went invisible-out-of-stock without a single admin noticing. Draft rows
// are excluded since they're already off the storefront for an unrelated
// reason and don't need the same alarm.
function isRowOutOfStock(product: Product) {
	return product.status !== "draft" && product.stock <= 0;
}

export function ProductListTable({
	onDeleteProducts,
	products,
}: ProductListTableProps) {
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState<"all" | ProductStatus | "out-of-stock">(
		"all",
	);
	const [sort, setSort] = useState<{ direction: SortDirection; key: SortKey }>({
		direction: "asc",
		key: "name",
	});
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [visibleColumns, setVisibleColumns] = useState<Set<number>>(
		new Set(columns.map((column) => column.index)),
	);
	const [columnsOpen, setColumnsOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [reviewTarget, setReviewTarget] = useState<Product | null>(null);
	const [rows, setRows] = useState(products);
	// products is a fresh array every time LiveProductsTable's realtime hook
	// refetches. Comparing during render (rather than in an effect) applies
	// the update immediately, without a stale-content flash or an extra
	// render pass - see https://react.dev/learn/you-might-not-need-an-effect.
	const [prevProducts, setPrevProducts] = useState(products);
	if (products !== prevProducts) {
		setPrevProducts(products);
		setRows(products);
	}

	const filteredProducts = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const filtered = rows.filter((product) => {
			const matchesQuery =
				!normalizedQuery ||
				`${product.name} ${product.sku} ${product.category}`
					.toLowerCase()
					.includes(normalizedQuery);
			const matchesStatus =
				status === "all" ||
				(status === "out-of-stock"
					? isRowOutOfStock(product)
					: product.status === status);
			return matchesQuery && matchesStatus;
		});

		return [...filtered].sort((a, b) => {
			const direction = sort.direction === "asc" ? 1 : -1;
			if (sort.key === "price" || sort.key === "stock") {
				return (a[sort.key] - b[sort.key]) * direction;
			}

			return String(a[sort.key]).localeCompare(String(b[sort.key])) * direction;
		});
	}, [query, rows, sort, status]);

	const allVisibleSelected =
		filteredProducts.length > 0 &&
		filteredProducts.every((product) => selected.has(product.sku));

	function toggleSort(key: SortKey) {
		setSort((current) => ({
			direction:
				current.key === key && current.direction === "asc" ? "desc" : "asc",
			key,
		}));
	}

	function toggleSelected(sku: string, checked: boolean) {
		setSelected((current) => {
			const next = new Set(current);
			if (checked) {
				next.add(sku);
			} else {
				next.delete(sku);
			}
			return next;
		});
	}

	function toggleAllVisible(checked: boolean) {
		setSelected((current) => {
			const next = new Set(current);
			for (const product of filteredProducts) {
				if (checked) {
					next.add(product.sku);
				} else {
					next.delete(product.sku);
				}
			}
			return next;
		});
	}

	async function confirmDelete() {
		const skus = [...selected];

		setDeleting(true);
		setDeleteError(null);

		try {
			await onDeleteProducts?.(skus);
			setRows((current) =>
				current.filter((product) => !selected.has(product.sku)),
			);
			setSelected(new Set());
			setConfirmOpen(false);
		} catch (error) {
			setDeleteError(
				error instanceof Error ? error.message : "Unable to delete products.",
			);
		} finally {
			setDeleting(false);
		}
	}

	function isColumnVisible(index: number) {
		return visibleColumns.has(index);
	}

	return (
		<section className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card">
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<label className="relative block min-w-[200px] flex-1">
					<span className="sr-only">Search products</span>
					<Icon
						className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
						name="search"
					/>
					<input
						className="h-11 w-full rounded-base border border-surface-line bg-surface-body pl-11 pr-4 text-[14px] focus:border-brand-600"
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search products"
						type="search"
						value={query}
					/>
				</label>
				<AppSelect
					className="w-[160px]"
					onValueChange={(value) =>
						setStatus(value as "all" | ProductStatus | "out-of-stock")
					}
					options={[
						{ label: "All", value: "all" },
						{ label: "Published", value: "published" },
						{ label: "Draft", value: "draft" },
						{ label: "Low stock", value: "low stock" },
						{ label: "Out of stock", value: "out-of-stock" },
					]}
					size="lg"
					value={status}
				/>
				<div className="relative">
					<button
						aria-expanded={columnsOpen}
						aria-haspopup="true"
						className="inline-flex h-11 items-center gap-2 rounded-base border border-surface-line bg-surface-card px-4 text-[14px] font-semibold text-ink-700 transition-colors hover:bg-surface-muted"
						onClick={() => setColumnsOpen((current) => !current)}
						type="button"
					>
						<Icon className="h-4 w-4" name="sliders-horizontal" />
						Columns
					</button>
					{columnsOpen ? (
						<div className="absolute right-0 z-20 mt-2 w-48 rounded-base border border-surface-line bg-surface-card p-2 shadow-card">
							<p className="px-2 py-1 text-[12px] font-semibold uppercase text-ink-400">
								Toggle columns
							</p>
							{columns.map((column) => (
								<label
									className="flex items-center gap-2 rounded px-2 py-1.5 text-[14px] text-ink-700 hover:bg-surface-muted"
									key={column.index}
								>
									<input
										aria-label={`Toggle ${column.label} column`}
										checked={visibleColumns.has(column.index)}
										onChange={(event) => {
											setVisibleColumns((current) => {
												const next = new Set(current);
												if (event.target.checked) {
													next.add(column.index);
												} else {
													next.delete(column.index);
												}
												return next;
											});
										}}
										type="checkbox"
									/>{" "}
									{column.label}
								</label>
							))}
						</div>
					) : null}
				</div>
				<button
					className="inline-flex h-11 items-center justify-center gap-2 rounded-base bg-danger-500 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-danger-600 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={selected.size === 0 || deleting}
					onClick={() => setConfirmOpen(true)}
					type="button"
				>
					<Icon className="h-4 w-4" name="trash-2" />
					Delete Selected (<span>{selected.size}</span>)
				</button>
			</div>

			<div className="dashboard-scrollbar overflow-x-auto">
				<table className="w-full min-w-[880px] text-left">
					<thead>
						<tr className="border-b border-surface-line text-[13px] uppercase text-ink-400">
							<th className="w-10 pb-3 pr-3">
								<input
									aria-label="Select all"
									checked={allVisibleSelected}
									className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
									onChange={(event) => toggleAllVisible(event.target.checked)}
									type="checkbox"
								/>
							</th>
							<th className="pb-3 pr-4 font-semibold">
								<SortButton label="Product" name="name" onSort={toggleSort} />
							</th>
							<th
								className={cn(
									"pb-3 pr-4 font-semibold",
									isColumnVisible(3) ? "" : "hidden",
								)}
							>
								Category
							</th>
							<th
								className={cn(
									"pb-3 pr-4 font-semibold",
									isColumnVisible(4) ? "" : "hidden",
								)}
							>
								<SortButton label="Price" name="price" onSort={toggleSort} />
							</th>
							<th
								className={cn(
									"pb-3 pr-4 font-semibold",
									isColumnVisible(5) ? "" : "hidden",
								)}
							>
								<SortButton label="Stock" name="stock" onSort={toggleSort} />
							</th>
							<th
								className={cn(
									"pb-3 pr-4 font-semibold",
									isColumnVisible(6) ? "" : "hidden",
								)}
							>
								<SortButton label="Status" name="status" onSort={toggleSort} />
							</th>
							<th className="pb-3 text-right font-semibold">Action</th>
						</tr>
					</thead>
					<tbody className="text-[14px]">
						{filteredProducts.map((product) => (
							<tr
								className="border-b border-surface-line hover:bg-surface-body/70"
								key={product.sku}
							>
								<td className="py-4 pr-3">
									<input
										aria-label={`Select ${product.name}`}
										checked={selected.has(product.sku)}
										className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
										onChange={(event) =>
											toggleSelected(product.sku, event.target.checked)
										}
										type="checkbox"
									/>
								</td>
								<td className="py-4 pr-4">
									<div className="flex items-center gap-3">
										<Image
											alt={product.name}
											className="h-12 w-12 rounded-base bg-surface-body object-cover"
											height={48}
											src={product.image}
											width={48}
										/>
										<div>
											<Link
												className="font-semibold text-ink-900 hover:text-brand-600"
												href={routes.editProduct(product.sku)}
											>
												{product.name}
											</Link>
											<p className="mt-1 text-[13px] text-ink-400">
												SKU: {product.sku}
											</p>
										</div>
									</div>
								</td>
								<td
									className={cn(
										"py-4 pr-4 text-ink-700",
										isColumnVisible(3) ? "" : "hidden",
									)}
								>
									{product.category}
								</td>
								<td
									className={cn(
										"py-4 pr-4 text-ink-700",
										isColumnVisible(4) ? "" : "hidden",
									)}
								>
									${product.price.toFixed(2)}
								</td>
								<td
									className={cn(
										"py-4 pr-4",
										isRowOutOfStock(product)
											? "font-semibold text-danger-500"
											: product.status === "low stock"
												? "text-warning-600"
												: "text-ink-700",
										isColumnVisible(5) ? "" : "hidden",
									)}
								>
									{product.stock}
								</td>
								<td
									className={cn(
										"py-4 pr-4",
										isColumnVisible(6) ? "" : "hidden",
									)}
								>
									<StatusBadge
										className={
											isRowOutOfStock(product)
												? "bg-danger-50 text-danger-500"
												: statusClass[product.status]
										}
										label={
											isRowOutOfStock(product)
												? "Out of stock"
												: statusLabel[product.status]
										}
									/>
								</td>
								<td className="py-4 text-right">
									<div className="inline-flex items-center gap-1">
										<Link
											aria-label="View product"
											className="icon-button hover:bg-brand-50 hover:text-brand-600"
											href={routes.editProduct(product.sku)}
										>
											<Icon className="h-4 w-4" name="eye" />
										</Link>
										<Link
											aria-label="Edit product"
											className="icon-button hover:bg-brand-50 hover:text-brand-600"
											href={routes.editProduct(product.sku)}
										>
											<Icon className="h-4 w-4" name="pencil" />
										</Link>
										{product.id ? (
											<button
												aria-label="Generate reviews"
												className="icon-button hover:bg-brand-50 hover:text-brand-600"
												onClick={() => setReviewTarget(product)}
												title="Generate reviews"
												type="button"
											>
												<Icon className="h-4 w-4" name="sparkles" />
											</button>
										) : null}
										<button
											aria-label="Delete product"
											className="icon-button hover:bg-danger-50 hover:text-danger-500"
											onClick={() => {
												setSelected(new Set([product.sku]));
												setConfirmOpen(true);
											}}
											type="button"
										>
											<Icon className="h-4 w-4" name="trash-2" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{filteredProducts.length === 0 ? (
				<p className="py-10 text-center text-[14px] text-ink-400">
					No products match your search.
				</p>
			) : null}

			<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
				<p className="text-[13px] text-ink-500">
					Showing {filteredProducts.length} of {rows.length} products
				</p>
				<div className="flex items-center gap-2">
					<button
						className="inline-flex h-9 items-center rounded-base border border-surface-line px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
						disabled
						type="button"
					>
						Previous
					</button>
					<button
						className="inline-flex h-9 items-center rounded-base border border-surface-line px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
						disabled
						type="button"
					>
						Next
					</button>
				</div>
			</div>

			{confirmOpen ? (
				<div
					aria-labelledby="confirm-delete-title"
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					role="dialog"
				>
					<div className="absolute inset-0 bg-ink-900/50" />
					<div className="relative w-full max-w-md rounded-card bg-surface-card p-6 text-center shadow-lift">
						<button
							aria-label="Close"
							className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-base text-ink-400 transition-colors hover:bg-surface-muted hover:text-ink-700"
							onClick={() => setConfirmOpen(false)}
							type="button"
						>
							<Icon className="h-4 w-4" name="x" />
						</button>
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 text-danger-500">
							<Icon className="h-6 w-6" name="trash-2" />
						</div>
						<h3
							className="text-[20px] font-semibold text-ink-900"
							id="confirm-delete-title"
						>
							Are you sure?
						</h3>
						<p className="mx-auto mt-2 max-w-xs text-[14px] text-ink-500">
							This product will be permanently removed from your catalog. This
							action cannot be undone.
						</p>
						{deleteError ? (
							<p className="mt-3 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
								{deleteError}
							</p>
						) : null}
						<div className="mt-6 flex items-center justify-center gap-3">
							<button
								className="h-11 min-w-[88px] rounded-base border border-surface-line px-5 text-[14px] font-semibold text-ink-700 transition-colors hover:bg-surface-muted"
								disabled={deleting}
								onClick={() => setConfirmOpen(false)}
								type="button"
							>
								No
							</button>
							<button
								className="h-11 min-w-[88px] rounded-base bg-danger-500 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-danger-600"
								disabled={deleting}
								onClick={() => void confirmDelete()}
								type="button"
							>
								{deleting ? "Deleting..." : "Yes, delete"}
							</button>
						</div>
					</div>
				</div>
			) : null}

			{reviewTarget?.id ? (
				<GenerateReviewsModal
					onClose={() => setReviewTarget(null)}
					product={{ id: reviewTarget.id, name: reviewTarget.name }}
				/>
			) : null}
		</section>
	);
}

type SortButtonProps = {
	label: string;
	name: SortKey;
	onSort: (key: SortKey) => void;
};

function SortButton({ label, name, onSort }: SortButtonProps) {
	return (
		<button
			className="inline-flex items-center gap-1 uppercase hover:text-ink-700"
			onClick={() => onSort(name)}
			type="button"
		>
			{label} <Icon className="h-3.5 w-3.5" name="chevrons-up-down" />
		</button>
	);
}
