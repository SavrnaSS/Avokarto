"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { AppSelect } from "@/admin/components/ui/app-select";
import { cn } from "@/admin/utils/cn";

export type EntityColumn<T> = {
	hideable?: boolean;
	key: string;
	label: string;
	render: (row: T) => React.ReactNode;
	sortValue?: (row: T) => number | string;
};

type FilterOption<T> = {
	label: string;
	match: (row: T) => boolean;
	value: string;
};

type EntityTableProps<T extends { id: string }> = {
	columns: EntityColumn<T>[];
	deleteMessage: string;
	editHref: string | ((row: T) => string);
	filterOptions?: FilterOption<T>[];
	items: T[];
	onDelete?: (ids: string[]) => Promise<void> | void;
	searchLabel: string;
	searchPlaceholder: string;
	searchText: (row: T) => string;
	singularName: string;
};

type SortState = {
	direction: "asc" | "desc";
	key: string;
};

export function EntityTable<T extends { id: string }>({
	columns,
	deleteMessage,
	editHref,
	filterOptions,
	items,
	onDelete,
	searchLabel,
	searchPlaceholder,
	searchText,
	singularName,
}: EntityTableProps<T>) {
	const sortableColumns = columns.filter((column) => column.sortValue);
	const hideableColumns = columns.filter((column) => column.hideable);
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState(filterOptions?.[0]?.value ?? "all");
	const [rows, setRows] = useState(items);
	// `items` is a fresh array every time the realtime hook refetches (see
	// useRealtimeResource). Comparing during render (rather than in an
	// effect) applies the update immediately, without a stale-content flash
	// or an extra render pass - see https://react.dev/learn/you-might-not-need-an-effect.
	// onDelete's optimistic setRows below still fires first for instant
	// feedback; this just keeps rows honest once the refetch lands.
	const [prevItems, setPrevItems] = useState(items);
	if (items !== prevItems) {
		setPrevItems(items);
		setRows(items);
	}
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [columnsOpen, setColumnsOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [sort, setSort] = useState<SortState>({
		direction: "asc",
		key: sortableColumns[0]?.key ?? columns[0]?.key ?? "",
	});
	const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
		new Set(hideableColumns.map((column) => column.key)),
	);

	const filteredRows = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const activeFilter = filterOptions?.find(
			(option) => option.value === filter,
		);
		const sortColumn = columns.find((column) => column.key === sort.key);

		const next = rows.filter((row) => {
			const matchesQuery =
				!normalizedQuery ||
				searchText(row).toLowerCase().includes(normalizedQuery);
			const matchesFilter = !activeFilter || activeFilter.match(row);
			return matchesQuery && matchesFilter;
		});

		if (!sortColumn?.sortValue) {
			return next;
		}

		return [...next].sort((a, b) => {
			const direction = sort.direction === "asc" ? 1 : -1;
			const aValue = sortColumn.sortValue?.(a) ?? "";
			const bValue = sortColumn.sortValue?.(b) ?? "";

			if (typeof aValue === "number" && typeof bValue === "number") {
				return (aValue - bValue) * direction;
			}

			return String(aValue).localeCompare(String(bValue)) * direction;
		});
	}, [columns, filter, filterOptions, query, rows, searchText, sort]);

	const allVisibleSelected =
		filteredRows.length > 0 &&
		filteredRows.every((row) => selected.has(row.id));

	function toggleSort(key: string) {
		setSort((current) => ({
			direction:
				current.key === key && current.direction === "asc" ? "desc" : "asc",
			key,
		}));
	}

	function toggleSelected(id: string, checked: boolean) {
		setSelected((current) => {
			const next = new Set(current);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}

	function toggleAllVisible(checked: boolean) {
		setSelected((current) => {
			const next = new Set(current);
			for (const row of filteredRows) {
				if (checked) {
					next.add(row.id);
				} else {
					next.delete(row.id);
				}
			}
			return next;
		});
	}

	async function confirmDelete() {
		const ids = [...selected];

		setDeleting(true);
		setDeleteError(null);

		try {
			await onDelete?.(ids);
			setRows((current) => current.filter((row) => !selected.has(row.id)));
			setSelected(new Set());
			setConfirmOpen(false);
		} catch (error) {
			setDeleteError(
				error instanceof Error ? error.message : `Unable to delete ${singularName}s.`,
			);
		} finally {
			setDeleting(false);
		}
	}

	return (
		<section className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card">
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<label className="relative block min-w-[200px] flex-1">
					<span className="sr-only">{searchLabel}</span>
					<Icon
						className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
						name="search"
					/>
					<input
						className="h-11 w-full rounded-base border border-surface-line bg-surface-body pl-11 pr-4 text-[14px] focus:border-brand-600"
						onChange={(event) => setQuery(event.target.value)}
						placeholder={searchPlaceholder}
						type="search"
						value={query}
					/>
				</label>
				{filterOptions ? (
					<AppSelect
						className="w-[180px]"
						onValueChange={setFilter}
						options={filterOptions}
						size="lg"
						value={filter}
					/>
				) : null}
				{hideableColumns.length ? (
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
								{hideableColumns.map((column) => (
									<label
										className="flex items-center gap-2 rounded px-2 py-1.5 text-[14px] text-ink-700 hover:bg-surface-muted"
										key={column.key}
									>
										<input
											aria-label={`Toggle ${column.label} column`}
											checked={visibleColumns.has(column.key)}
											onChange={(event) => {
												setVisibleColumns((current) => {
													const next = new Set(current);
													if (event.target.checked) {
														next.add(column.key);
													} else {
														next.delete(column.key);
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
				) : null}
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
				<table className="w-full min-w-[820px] text-left">
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
							{columns.map((column) => {
								const hidden =
									column.hideable && !visibleColumns.has(column.key);
								return (
									<th
										className={cn(
											"pb-3 pr-4 font-semibold",
											hidden ? "hidden" : "",
										)}
										key={column.key}
									>
										{column.sortValue ? (
											<button
												className="inline-flex items-center gap-1 uppercase hover:text-ink-700"
												onClick={() => toggleSort(column.key)}
												type="button"
											>
												{column.label}
												<Icon className="h-3.5 w-3.5" name="chevrons-up-down" />
											</button>
										) : (
											column.label
										)}
									</th>
								);
							})}
							<th className="pb-3 text-right font-semibold">Action</th>
						</tr>
					</thead>
					<tbody className="text-[14px]">
						{filteredRows.map((row) => (
							<tr
								className="border-b border-surface-line hover:bg-surface-body/70"
								key={row.id}
							>
								<td className="py-4 pr-3">
									<input
										aria-label={`Select ${row.id}`}
										checked={selected.has(row.id)}
										className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
										onChange={(event) =>
											toggleSelected(row.id, event.target.checked)
										}
										type="checkbox"
									/>
								</td>
								{columns.map((column) => {
									const hidden =
										column.hideable && !visibleColumns.has(column.key);
									return (
										<td
											className={cn(
												"py-4 pr-4 text-ink-700",
												hidden ? "hidden" : "",
											)}
											key={column.key}
										>
											{column.render(row)}
										</td>
									);
								})}
								<td className="py-4 text-right">
									<div className="inline-flex items-center gap-1">
										<Link
											aria-label={`View ${singularName}`}
											className="icon-button hover:bg-brand-50 hover:text-brand-600"
											href={
												typeof editHref === "function" ? editHref(row) : editHref
											}
										>
											<Icon className="h-4 w-4" name="eye" />
										</Link>
										<Link
											aria-label={`Edit ${singularName}`}
											className="icon-button hover:bg-brand-50 hover:text-brand-600"
											href={
												typeof editHref === "function" ? editHref(row) : editHref
											}
										>
											<Icon className="h-4 w-4" name="pencil" />
										</Link>
										<button
											aria-label={`Delete ${singularName}`}
											className="icon-button hover:bg-danger-50 hover:text-danger-500"
											onClick={() => {
												setSelected(new Set([row.id]));
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

			{filteredRows.length === 0 ? (
				<p className="py-10 text-center text-[14px] text-ink-400">
					No {singularName}s match your search.
				</p>
			) : null}

			<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
				<p className="text-[13px] text-ink-500">
					Showing {filteredRows.length} of {rows.length} {singularName}s
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
							{deleteMessage}
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
		</section>
	);
}
