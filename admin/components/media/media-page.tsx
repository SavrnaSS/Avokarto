import Image from "next/image";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { AppSelect } from "@/admin/components/ui/app-select";
import { baseURL } from "@/admin/utils/cn";

const assets = [
	{
		alt: "Organic food product",
		name: "beauty-product-st-07.webp",
		src: `${baseURL}assets/images/products/beauty-product-st-07.webp`,
		type: "Product image",
	},
	{
		alt: "Coffee product",
		name: "wireless-charger-a-03.webp",
		src: `${baseURL}assets/images/products/wireless-charger-a-03.webp`,
		type: "Product image",
	},
	{
		alt: "Store banner",
		name: "plumbing-accessories-07.webp",
		src: `${baseURL}assets/images/products/plumbing-accessories-07.webp`,
		type: "Banner",
	},
	{
		alt: "Logo asset",
		name: "prd-img-frames-a-02.webp",
		src: `${baseURL}assets/images/products/prd-img-frames-a-02.webp`,
		type: "Brand asset",
	},
];

export function MediaPage() {
	return (
		<>
			<PageHeader
				actions={
					<button
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						type="button"
					>
						<Icon className="h-4 w-4" name="upload" />
						Upload Asset
					</button>
				}
				description="Upload and manage product, category, and campaign media assets."
				eyebrow="Assets"
				title="Media"
			/>
			<section className="mb-6 rounded-card border border-dashed border-brand-200 bg-brand-50/60 p-8 text-center">
				<span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-card text-brand-600 shadow-card">
					<Icon className="h-6 w-6" name="image" />
				</span>
				<h2 className="mt-4 text-[18px] font-semibold text-ink-900">
					Drop files to upload
				</h2>
				<p className="mt-1 text-[14px] text-ink-500">
					PNG, JPG, SVG, WEBP, and PDF files are supported for this template.
				</p>
				<button
					className="mt-4 inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
					type="button"
				>
					<Icon className="h-4 w-4" name="folder-plus" />
					Choose files
				</button>
			</section>
			<section className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-[17px] font-semibold text-ink-900">
						Recent Assets
					</h2>
					<AppSelect
						className="w-[160px]"
						defaultValue="All types"
						options={["All types", "Images", "Documents"]}
					/>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{assets.map((asset) => (
						<article
							className="rounded-card border border-surface-line bg-surface-body p-3"
							key={asset.name}
						>
							<Image
								alt={asset.alt}
								className="aspect-square w-full rounded-base object-contain"
								height={320}
								src={asset.src}
								width={320}
							/>
							<p className="mt-3 truncate text-[14px] font-semibold text-ink-900">
								{asset.name}
							</p>
							<p className="text-[12px] text-ink-400">{asset.type}</p>
						</article>
					))}
				</div>
			</section>
		</>
	);
}
