"use client";

import { useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { cn } from "@/admin/utils/cn";
import type { useImageGallery } from "@/admin/hooks/use-image-gallery";
import type { AdminProductColorVariant } from "@/lib/backend/admin-data";

type ColorVariantRow = AdminProductColorVariant & { id: string };

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function randomId() {
	return typeof crypto.randomUUID === "function"
		? crypto.randomUUID()
		: `color-${Math.random().toString(36).slice(2)}`;
}

/**
 * Lets an admin decide, per product, which already-uploaded gallery image
 * represents which color - the product page's color swatches read this to
 * swap the main photo when a shopper taps a color. Reuses the SAME gallery
 * state instance the "Gallery" card above manages (`gallery.urls`), so a
 * color can only point at an image the admin actually uploaded.
 */
export function ColorVariantsField({
	gallery,
	initialVariants,
}: {
	gallery: ReturnType<typeof useImageGallery>;
	initialVariants: AdminProductColorVariant[];
}) {
	const [rows, setRows] = useState<ColorVariantRow[]>(() =>
		initialVariants.map((variant) => ({ ...variant, id: randomId() })),
	);

	function updateRow(id: string, patch: Partial<AdminProductColorVariant>) {
		setRows((current) =>
			current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		);
	}

	function addRow() {
		setRows((current) => [
			...current,
			{
				hex: "#111111",
				id: randomId(),
				imageUrl: gallery.urls[0] ?? "",
				name: "",
			},
		]);
	}

	function removeRow(id: string) {
		setRows((current) => current.filter((row) => row.id !== id));
	}

	return (
		<article className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card">
			<h2 className="mb-1 text-[16px] font-semibold text-ink-900">
				Color Variants
			</h2>
			<p className="mb-4 text-[12px] text-ink-400">
				Assign one of the uploaded gallery images to each color a shopper can
				tap on the product page. A color needs both a name and an image to be
				saved.
			</p>
			<div className="space-y-4">
				{rows.map((row) => {
					// Removed from the gallery (or never in it, for older
					// products) - the storefront would still show that photo.
					const imageMissing = Boolean(row.imageUrl) && !gallery.urls.includes(row.imageUrl);
					const named = Boolean(row.name.trim());
					return (
					<div
						className={cn(
							"rounded-base border p-3",
							imageMissing ? "border-warning-500" : "border-surface-line",
						)}
						key={row.id}
					>
						<div className="flex items-start gap-3">
							<input
								aria-label="Color hex value"
								className="h-10 w-10 shrink-0 cursor-pointer rounded-base border border-surface-line bg-surface-body"
								onChange={(event) =>
									updateRow(row.id, { hex: event.target.value })
								}
								type="color"
								value={HEX_PATTERN.test(row.hex) ? row.hex : "#111111"}
							/>
							<label className="flex-1">
								<span className="sr-only">Color name</span>
								<input
									className="h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] placeholder:text-ink-400 focus:border-brand-600"
									onChange={(event) =>
										updateRow(row.id, { name: event.target.value })
									}
									placeholder="e.g. Black"
									value={row.name}
								/>
							</label>
							<button
								aria-label="Remove color"
								className="grid h-10 w-10 shrink-0 place-items-center rounded-base text-danger-500 hover:bg-danger-50"
								onClick={() => removeRow(row.id)}
								type="button"
							>
								<Icon className="h-3.5 w-3.5" name="trash-2" />
							</button>
						</div>
						{gallery.urls.length ? (
							<div className="mt-3 flex flex-wrap gap-2">
								{gallery.urls.map((url) => (
									<button
										className={cn(
											"h-14 w-14 shrink-0 overflow-hidden rounded-base border-2",
											row.imageUrl === url
												? "border-brand-600"
												: "border-transparent",
										)}
										aria-label={`Use gallery image ${gallery.urls.indexOf(url) + 1} for ${row.name.trim() || "this color"}`}
										aria-pressed={row.imageUrl === url}
										key={url}
										onClick={() => updateRow(row.id, { imageUrl: url })}
										type="button"
									>
										{/* eslint-disable-next-line @next/next/no-img-element -- always a final, same-origin upload URL; a small fixed-size admin picker thumbnail doesn't need the image optimizer. */}
										<img
											alt=""
											className="h-full w-full object-cover"
											src={url}
										/>
									</button>
								))}
							</div>
						) : (
							<p className="mt-2 text-[12px] text-ink-400">
								Add gallery images above first.
							</p>
						)}
						{imageMissing ? (
							<p className="mt-2 text-[12px] font-semibold text-warning-600" role="status">
								This color&apos;s image isn&apos;t in the gallery anymore - pick one of
								the images above.
							</p>
						) : !named || !row.imageUrl ? (
							<p className="mt-2 text-[12px] text-ink-400">
								{named ? "Pick an image" : "Add a color name"} - incomplete colors
								aren&apos;t saved.
							</p>
						) : null}
					</div>
					);
				})}
			</div>
			<button
				className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-base border border-surface-line px-3 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted"
				onClick={addRow}
				type="button"
			>
				<Icon className="h-3.5 w-3.5" name="plus" />
				Add Color
			</button>
			<input
				name="color_variants"
				type="hidden"
				value={JSON.stringify(
					rows.map(({ hex, imageUrl, name }) => ({ hex, imageUrl, name })),
				)}
			/>
		</article>
	);
}
