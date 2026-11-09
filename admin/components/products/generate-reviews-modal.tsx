"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import type { Product } from "@/admin/data/products/data";
import { cn } from "@/admin/utils/cn";

type ReviewProfile = "glowing" | "mixed" | "realistic";
type ReviewStatus = "approved" | "pending";

type PresetOption = {
	description: string;
	label: string;
	value: ReviewProfile;
};

const PRESETS: PresetOption[] = [
	{
		description: "Mostly 5-star, a little 4-star. Reads like a fan favorite.",
		label: "Glowing",
		value: "glowing",
	},
	{
		description: "4-5 star weighted with the occasional 3-star. Feels organic.",
		label: "Realistic",
		value: "realistic",
	},
	{
		description: "Full 1-5 star spread. Looks unmoderated and unfiltered.",
		label: "Mixed",
		value: "mixed",
	},
];

const COUNT_OPTIONS = [3, 5, 8, 15, 25];

const SPREAD_OPTIONS: { days: number; label: string }[] = [
	{ days: 7, label: "Last week" },
	{ days: 30, label: "Last month" },
	{ days: 60, label: "Last 2 months" },
	{ days: 180, label: "Last 6 months" },
];

type GeneratedSummary = {
	generated: number;
	product: { rating: number; reviewCount: number };
};

type SelectedProduct = { id: string; name: string };

export function GenerateReviewsModal({
	onClose,
	onGenerated,
	product,
}: {
	onClose: () => void;
	onGenerated?: () => void | Promise<void>;
	product?: SelectedProduct;
}) {
	const [selected, setSelected] = useState<SelectedProduct | null>(
		product ?? null,
	);

	if (!selected) {
		return (
			<ModalShell onClose={onClose} title="Generate Reviews">
				<ProductPicker onSelect={setSelected} />
			</ModalShell>
		);
	}

	return (
		<ModalShell onClose={onClose} title="Generate Reviews">
			<GenerateForm
				onBack={product ? undefined : () => setSelected(null)}
				onClose={onClose}
				onGenerated={onGenerated}
				product={selected}
			/>
		</ModalShell>
	);
}

function ModalShell({
	children,
	onClose,
	title,
}: {
	children: React.ReactNode;
	onClose: () => void;
	title: string;
}) {
	return (
		<div
			aria-labelledby="generate-reviews-title"
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
		>
			<button
				aria-label="Close"
				className="absolute inset-0 bg-ink-900/50"
				onClick={onClose}
				type="button"
			/>
			<div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card bg-surface-card shadow-lift">
				<div className="flex items-center justify-between gap-3 border-b border-surface-line px-6 py-4">
					<div className="flex items-center gap-2">
						<span className="grid h-9 w-9 place-items-center rounded-base bg-brand-50 text-brand-600">
							<Icon className="h-4 w-4" name="sparkles" />
						</span>
						<h2
							className="text-[16px] font-semibold text-ink-900"
							id="generate-reviews-title"
						>
							{title}
						</h2>
					</div>
					<button
						aria-label="Close"
						className="grid h-9 w-9 place-items-center rounded-base text-ink-400 hover:bg-surface-muted hover:text-ink-700"
						onClick={onClose}
						type="button"
					>
						<Icon className="h-4 w-4" name="x" />
					</button>
				</div>
				<div className="dashboard-scrollbar overflow-y-auto px-6 py-5">
					{children}
				</div>
			</div>
		</div>
	);
}

function ProductPicker({
	onSelect,
}: {
	onSelect: (product: SelectedProduct) => void;
}) {
	const [query, setQuery] = useState("");
	const [products, setProducts] = useState<Product[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useMemo(() => {
		if (products !== null || error) {
			return;
		}

		fetch("/api/admin/products", { cache: "no-store", credentials: "include" })
			.then((response) => response.json())
			.then((payload: { data?: Product[] }) => {
				setProducts(payload.data ?? []);
			})
			.catch(() => setError("Unable to load products."));
	}, [products, error]);

	const filtered = (products ?? []).filter(
		(item) =>
			Boolean(item.id) &&
			`${item.name} ${item.sku}`.toLowerCase().includes(query.trim().toLowerCase()),
	);

	return (
		<div>
			<p className="mb-4 text-[13px] text-ink-500">
				Pick a product to generate realistic-looking sample reviews for.
			</p>
			<label className="relative mb-3 block">
				<span className="sr-only">Search products</span>
				<Icon
					className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
					name="search"
				/>
				<input
					autoFocus
					className="h-11 w-full rounded-base border border-surface-line bg-surface-body pl-10 pr-4 text-[14px] focus:border-brand-600"
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search by product name or SKU"
					type="search"
					value={query}
				/>
			</label>

			{error ? (
				<p className="rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
					{error}
				</p>
			) : null}

			{products === null && !error ? (
				<p className="py-6 text-center text-[13px] text-ink-400">
					Loading products…
				</p>
			) : null}

			{products !== null && filtered.length === 0 ? (
				<p className="py-6 text-center text-[13px] text-ink-400">
					No products match your search.
				</p>
			) : null}

			<div className="max-h-72 space-y-1 overflow-y-auto">
				{filtered.map((item) => (
					<button
						className="flex w-full items-center gap-3 rounded-base px-2 py-2 text-left hover:bg-surface-muted"
						key={item.sku}
						onClick={() => onSelect({ id: item.id as string, name: item.name })}
						type="button"
					>
						<Image
							alt={item.name}
							className="h-10 w-10 rounded-base bg-surface-body object-cover"
							height={40}
							src={item.image}
							width={40}
						/>
						<span className="min-w-0 flex-1">
							<span className="block truncate text-[14px] font-semibold text-ink-900">
								{item.name}
							</span>
							<span className="block text-[12px] text-ink-400">
								SKU: {item.sku}
							</span>
						</span>
						<Icon className="h-4 w-4 shrink-0 text-ink-400" name="chevron-right" />
					</button>
				))}
			</div>
		</div>
	);
}

function GenerateForm({
	onBack,
	onClose,
	onGenerated,
	product,
}: {
	onBack?: () => void;
	onClose: () => void;
	onGenerated?: () => void | Promise<void>;
	product: SelectedProduct;
}) {
	const [profile, setProfile] = useState<ReviewProfile>("realistic");
	const [count, setCount] = useState(8);
	const [status, setStatus] = useState<ReviewStatus>("approved");
	const [spreadDays, setSpreadDays] = useState(60);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<GeneratedSummary | null>(null);

	async function handleGenerate() {
		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/admin/products/${product.id}/reviews/generate`,
				{
					body: JSON.stringify({ count, profile, spreadDays, status }),
					cache: "no-store",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					method: "POST",
				},
			);
			const payload = (await response.json().catch(() => ({}))) as {
				data?: GeneratedSummary;
				error?: { message?: string };
			};

			if (!response.ok || !payload.data) {
				throw new Error(payload.error?.message ?? "Unable to generate reviews.");
			}

			setResult(payload.data);
			await onGenerated?.();
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to generate reviews.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	if (result) {
		return (
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600">
					<Icon className="h-6 w-6" name="check" />
				</div>
				<h3 className="text-[18px] font-semibold text-ink-900">
					{result.generated} review{result.generated === 1 ? "" : "s"} added
				</h3>
				<p className="mx-auto mt-2 max-w-sm text-[13px] text-ink-500">
					{product.name} now shows {result.product.rating.toFixed(1)}/5 from{" "}
					{result.product.reviewCount} approved review
					{result.product.reviewCount === 1 ? "" : "s"}.
				</p>
				<div className="mt-6 flex items-center justify-center gap-3">
					<button
						className="h-11 min-w-[120px] rounded-base border border-surface-line px-5 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
						onClick={() => setResult(null)}
						type="button"
					>
						Generate more
					</button>
					<button
						className="h-11 min-w-[120px] rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
						onClick={onClose}
						type="button"
					>
						Done
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between gap-2 rounded-base bg-surface-body px-4 py-3">
				<div className="min-w-0">
					<p className="text-[12px] uppercase text-ink-400">Product</p>
					<p className="truncate text-[14px] font-semibold text-ink-900">
						{product.name}
					</p>
				</div>
				{onBack ? (
					<button
						className="shrink-0 text-[13px] font-semibold text-brand-600 hover:underline"
						onClick={onBack}
						type="button"
					>
						Change
					</button>
				) : null}
			</div>

			<div>
				<p className="mb-2 text-[13px] font-semibold text-ink-700">
					Rating mix
				</p>
				<div className="grid gap-2 sm:grid-cols-3">
					{PRESETS.map((preset) => (
						<button
							className={cn(
								"rounded-base border p-3 text-left transition-colors",
								profile === preset.value
									? "border-brand-600 bg-brand-50"
									: "border-surface-line hover:bg-surface-muted",
							)}
							key={preset.value}
							onClick={() => setProfile(preset.value)}
							type="button"
						>
							<span className="block text-[14px] font-semibold text-ink-900">
								{preset.label}
							</span>
							<span className="mt-1 block text-[12px] text-ink-500">
								{preset.description}
							</span>
						</button>
					))}
				</div>
			</div>

			<div>
				<p className="mb-2 text-[13px] font-semibold text-ink-700">
					How many reviews?
				</p>
				<div className="flex flex-wrap gap-2">
					{COUNT_OPTIONS.map((option) => (
						<button
							className={cn(
								"h-10 min-w-[52px] rounded-base border px-3 text-[14px] font-semibold transition-colors",
								count === option
									? "border-brand-600 bg-brand-50 text-brand-600"
									: "border-surface-line text-ink-700 hover:bg-surface-muted",
							)}
							key={option}
							onClick={() => setCount(option)}
							type="button"
						>
							{option}
						</button>
					))}
				</div>
			</div>

			<div>
				<button
					className="flex items-center gap-2 text-[13px] font-semibold text-ink-700"
					onClick={() => setAdvancedOpen((current) => !current)}
					type="button"
				>
					<Icon className="h-4 w-4" name="sliders-horizontal" />
					Advanced options
					<Icon
						className={cn(
							"h-4 w-4 transition-transform",
							advancedOpen ? "rotate-180" : "",
						)}
						name="chevron-down"
					/>
				</button>

				{advancedOpen ? (
					<div className="mt-3 space-y-4 rounded-base border border-surface-line p-4">
						<div>
							<p className="mb-2 text-[13px] font-semibold text-ink-700">
								Posting status
							</p>
							<div className="flex gap-2">
								<button
									className={cn(
										"h-10 flex-1 rounded-base border px-3 text-[13px] font-semibold transition-colors",
										status === "approved"
											? "border-brand-600 bg-brand-50 text-brand-600"
											: "border-surface-line text-ink-700 hover:bg-surface-muted",
									)}
									onClick={() => setStatus("approved")}
									type="button"
								>
									Approved &amp; live
								</button>
								<button
									className={cn(
										"h-10 flex-1 rounded-base border px-3 text-[13px] font-semibold transition-colors",
										status === "pending"
											? "border-brand-600 bg-brand-50 text-brand-600"
											: "border-surface-line text-ink-700 hover:bg-surface-muted",
									)}
									onClick={() => setStatus("pending")}
									type="button"
								>
									Pending review
								</button>
							</div>
						</div>

						<div>
							<p className="mb-2 text-[13px] font-semibold text-ink-700">
								Spread post dates over
							</p>
							<div className="flex flex-wrap gap-2">
								{SPREAD_OPTIONS.map((option) => (
									<button
										className={cn(
											"h-10 rounded-base border px-3 text-[13px] font-semibold transition-colors",
											spreadDays === option.days
												? "border-brand-600 bg-brand-50 text-brand-600"
												: "border-surface-line text-ink-700 hover:bg-surface-muted",
										)}
										key={option.days}
										onClick={() => setSpreadDays(option.days)}
										type="button"
									>
										{option.label}
									</button>
								))}
							</div>
							<p className="mt-2 text-[12px] text-ink-400">
								Reviews get random past dates in this window instead of all
								posting at once, so the history looks organic.
							</p>
						</div>
					</div>
				) : null}
			</div>

			{error ? (
				<p className="rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
					{error}
				</p>
			) : null}

			<button
				className="flex h-12 w-full items-center justify-center gap-2 rounded-base bg-brand-600 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={submitting}
				onClick={() => void handleGenerate()}
				type="button"
			>
				{submitting ? (
					<Icon className="h-4 w-4 animate-spin" name="loader" />
				) : (
					<Icon className="h-4 w-4" name="sparkles" />
				)}
				{submitting
					? "Generating…"
					: `Generate ${count} review${count === 1 ? "" : "s"}`}
			</button>
		</div>
	);
}
