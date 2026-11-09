"use client";

import { useEffect, useState } from "react";
import type { AdminProductDetail } from "@/lib/backend/admin-data";
import {
	IMAGE_ALT_MAX,
	isValidGtin,
	normalizeGtin,
	parseKeywords,
	SEO_DESCRIPTION_MAX,
	SEO_DESCRIPTION_MIN,
	SEO_SLUG_MAX,
	SEO_TITLE_MAX,
	slugifyHandle,
} from "@/lib/productSeoFields";
import { cn } from "@/admin/utils/cn";
import styles from "./product-form.module.css";

// Kept in step with SITE_NAME in lib/seo.ts (not imported: that module is
// server-only). The storefront's title template appends " | Avokarto".
const STORE_NAME = "Avokarto";
const TITLE_SUFFIX = ` | ${STORE_NAME}`;

type GalleryImage = { id: string; preview: string; uploading: boolean; url: string };

type ProductSeoFieldsProps = {
	formId: string;
	gallery: { images: GalleryImage[] };
	idPrefix: string;
	// What customers pay, from the Pricing card (it isn't a single input).
	price?: number;
	product?: AdminProductDetail;
};

const inputClass =
	"h-11 w-full min-w-0 rounded-base border border-surface-line bg-surface-body px-3 text-[16px]! text-ink-900 placeholder:text-ink-400 sm:text-[14px]! aria-[invalid=true]:border-danger-500";

function plain(value: string) {
	return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function clip(value: string, max: number) {
	if (value.length <= max) return value;
	const cut = value.slice(0, max - 1);
	return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
}

/** Live value of another field in the product form (name, price, …). */
function useFormField(formId: string, name: string, initial = "") {
	const [value, setValue] = useState(initial);
	useEffect(() => {
		const form = document.getElementById(formId) as HTMLFormElement | null;
		if (!form) return;
		const read = () => {
			const field = form.elements.namedItem(name);
			if (field && "value" in field && typeof field.value === "string") {
				setValue(field.value);
			}
		};
		read();
		form.addEventListener("input", read);
		form.addEventListener("change", read);
		return () => {
			form.removeEventListener("input", read);
			form.removeEventListener("change", read);
		};
	}, [formId, name]);
	return value;
}

type Tone = "good" | "warn" | "bad" | "idle";

const toneText: Record<Tone, string> = {
	bad: "text-danger-600",
	good: "text-success-600",
	idle: "text-ink-400",
	warn: "text-warning-600",
};
const toneBar: Record<Tone, string> = {
	bad: "bg-danger-500",
	good: "bg-success-500",
	idle: "bg-surface-line",
	warn: "bg-warning-500",
};

function LengthMeter({ id, length, max, min = 0, note }: { id: string; length: number; max: number; min?: number; note: string }) {
	const tone: Tone = length === 0 ? "idle" : length > max ? "bad" : length < min ? "warn" : "good";
	const label =
		tone === "idle" ? "Using the default" : tone === "bad" ? "Too long – will be cut off" : tone === "warn" ? "A little short" : "Good length";
	return (
		<div className="space-y-1.5" id={id}>
			<div className="h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
				<div
					className={cn("h-full rounded-full transition-[width,background-color] duration-200", toneBar[tone])}
					style={{ width: `${Math.min(100, (length / max) * 100)}%` }}
				/>
			</div>
			<div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12px] leading-relaxed">
				<p className="mb-0 text-ink-400">{note}</p>
				<span className={cn("shrink-0 font-semibold tabular-nums", toneText[tone])}>
					{length}/{max} · {label}
				</span>
			</div>
		</div>
	);
}

function SectionCard({ children, description, title, end }: { children: React.ReactNode; description?: string; end?: React.ReactNode; title: string }) {
	return (
		<article className={`${styles.card} rounded-card border border-surface-line bg-surface-card shadow-card`}>
			<div className={styles.seoHeading}>
				<div className="min-w-0">
					<h2 className="mb-1 text-[18px] font-semibold text-ink-900">{title}</h2>
					{description ? <p className="mb-0 text-[13px] leading-relaxed text-ink-500">{description}</p> : null}
				</div>
				{end}
			</div>
			{children}
		</article>
	);
}

export function ProductSeoFields({ formId, gallery, idPrefix, price: livePrice, product }: ProductSeoFieldsProps) {
	const productName = useFormField(formId, "name", product?.name ?? "");
	const productDescription = useFormField(formId, "description", product?.description ?? "");
	const shortSummary = useFormField(formId, "short_summary", product?.shortSummary ?? "");
	const price = livePrice === undefined ? "" : String(livePrice);
	const categoryId = useFormField(formId, "category_id", product?.categoryId ?? "");

	const [title, setTitle] = useState(product?.seoTitle ?? "");
	const [description, setDescription] = useState(product?.seoDescription ?? "");
	const [keywords, setKeywords] = useState(product?.seoKeywords?.join(", ") ?? "");
	const [slug, setSlug] = useState(product?.slug ?? "");
	const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
	const [gtin, setGtin] = useState(product?.gtin ?? "");
	const [mpn, setMpn] = useState(product?.mpn ?? "");
	const [noindex, setNoindex] = useState(product?.seoNoindex ?? false);
	const [alts, setAlts] = useState<Record<string, string>>(product?.imageAlts ?? {});

	// New products get a handle that follows the name until it's edited by hand.
	const effectiveSlug = slugTouched ? slug : slugifyHandle(productName);
	const slugChanged = Boolean(product?.slug && effectiveSlug && effectiveSlug !== product.slug);

	const readyImages = gallery.images.filter((image) => image.url && !image.uploading);
	const imageAlts: Record<string, string> = {};
	for (const image of readyImages) {
		const text = alts[image.url]?.trim();
		if (text) imageAlts[image.url] = text;
	}

	const gtinDigits = normalizeGtin(gtin);
	const gtinInvalid = gtinDigits.length > 0 && !isValidGtin(gtinDigits);

	// What search engines will actually see (mirrors lib/seo.ts fallbacks).
	const previewTitle = (title.trim() || productName.trim() || "Product name");
	const previewTitleFull = new RegExp(`\\b${STORE_NAME}\\s*$`, "i").test(previewTitle) ? previewTitle : `${previewTitle}${TITLE_SUFFIX}`;
	const previewDescription = clip(
		plain(description) || plain(shortSummary) || plain(productDescription) ||
			`Shop ${productName.trim() || "this product"} at ${STORE_NAME}. See photos, reviews, current price, and live stock.`,
		SEO_DESCRIPTION_MAX,
	);
	const siteHost = (() => {
		try {
			return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").host;
		} catch {
			return "example.com";
		}
	})();
	const priceNumber = Number(price);

	const checks = [
		{
			label: "Search title is 30–60 characters",
			ok: previewTitleFull.length >= 30 && previewTitleFull.length <= SEO_TITLE_MAX,
			tip: `Currently ${previewTitleFull.length} characters including “${TITLE_SUFFIX.trim()}”.`,
		},
		{
			label: "Meta description is 120–160 characters",
			ok: plain(description).length >= SEO_DESCRIPTION_MIN && plain(description).length <= SEO_DESCRIPTION_MAX,
			tip: description ? `Currently ${plain(description).length} characters.` : "Write one – otherwise the summary is cut from your product description.",
		},
		{
			label: "URL handle is short and readable",
			ok: effectiveSlug.length > 0 && effectiveSlug.length <= 60 && /[a-z]/.test(effectiveSlug),
			tip: "Use a few descriptive words, e.g. cozy-cat-carrier-hoodie.",
		},
		{
			label: "At least 3 product images",
			ok: readyImages.length >= 3,
			tip: `Google shows richer results for products with several photos. You have ${readyImages.length}.`,
		},
		{
			label: "Every image has alt text",
			ok: readyImages.length > 0 && readyImages.every((image) => alts[image.url]?.trim()),
			tip: "Alt text is how Google Images understands a photo.",
		},
		{
			label: "Has a GTIN or MPN",
			ok: (gtinDigits.length > 0 && !gtinInvalid) || mpn.trim().length > 0,
			tip: "Product identifiers help Google match and show your listing.",
		},
		{
			label: "Product description is at least 300 characters",
			ok: plain(productDescription).length >= 300,
			tip: "Unique, detailed copy is the biggest on-page ranking factor.",
		},
		{
			label: "Product is in a category",
			ok: Boolean(categoryId),
			tip: "Categories become breadcrumbs in search results.",
		},
	];
	const passed = checks.filter((check) => check.ok).length;
	const score = Math.round((passed / checks.length) * 100);
	const scoreTone: Tone = noindex ? "idle" : score >= 75 ? "good" : score >= 50 ? "warn" : "bad";

	return (
		<div className="min-w-0 space-y-4">
			{/* Values for the save request; visible inputs below mirror them. */}
			{/* Blank for a new product whose handle still follows its name: the
			    server then adds -2, -3… instead of rejecting a taken handle. */}
			<input name="slug" type="hidden" value={slugTouched ? effectiveSlug : ""} />
			<input name="image_alts" type="hidden" value={JSON.stringify(imageAlts)} />
			<input name="seo_noindex_present" type="hidden" value="1" />

			<SectionCard
				description="How this product can appear in Google search results."
				end={
					<span
						className={cn(
							"rounded-full px-3 py-1 text-[12px] font-semibold tabular-nums",
							scoreTone === "good" && "bg-success-50 text-success-700",
							scoreTone === "warn" && "bg-warning-50 text-warning-600",
							scoreTone === "bad" && "bg-danger-50 text-danger-600",
							scoreTone === "idle" && "bg-surface-muted text-ink-500",
						)}
					>
						{noindex ? "Hidden from search" : `SEO score ${score}/100`}
					</span>
				}
				title="Search Preview"
			>
				<div className="rounded-base border border-surface-line bg-white p-4" aria-label="Search result preview">
					<div className="mb-1 flex min-w-0 items-center gap-2">
						<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-600" aria-hidden="true">
							{STORE_NAME[0]}
						</span>
						<div className="min-w-0 leading-tight">
							<p className="mb-0 truncate text-[14px] text-[#202124]">{STORE_NAME}</p>
							<p className="mb-0 truncate text-[12px] text-[#4d5156]">
								https://{siteHost} › product › {effectiveSlug || "url-handle"}
							</p>
						</div>
					</div>
					<p className="mb-1 line-clamp-2 break-words text-[20px] leading-snug text-[#1a0dab]">{previewTitleFull}</p>
					<p className="mb-0 line-clamp-2 break-words text-[14px] leading-relaxed text-[#4d5156]">{previewDescription}</p>
					{Number.isFinite(priceNumber) && priceNumber > 0 ? (
						<p className="mb-0 mt-1 text-[13px] text-[#4d5156]">
							${priceNumber.toFixed(2)}
						</p>
					) : null}
				</div>
				{noindex ? (
					<p className="mb-0 mt-3 rounded-base bg-warning-50 px-3 py-2 text-[13px] text-warning-600">
						This product is hidden from search engines, so it won&apos;t appear in results at all.
					</p>
				) : null}

				<ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="SEO checklist">
					{checks.map((check) => (
						<li
							className={cn(
								"flex min-w-0 items-start gap-2 rounded-base border px-3 py-2 text-[13px]",
								check.ok ? "border-success-100 bg-success-50/60" : "border-surface-line bg-surface-body",
							)}
							key={check.label}
						>
							<span
								aria-hidden="true"
								className={cn(
									"mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white",
									check.ok ? "bg-success-500" : "bg-ink-300",
								)}
							>
								{check.ok ? "✓" : "!"}
							</span>
							<span className="min-w-0">
								<span className={cn("block font-semibold", check.ok ? "text-success-700" : "text-ink-700")}>
									<span className="sr-only">{check.ok ? "Done: " : "To do: "}</span>
									{check.label}
								</span>
								{!check.ok ? <span className="block text-[12px] leading-relaxed text-ink-400">{check.tip}</span> : null}
							</span>
						</li>
					))}
				</ul>
			</SectionCard>

			<SectionCard
				description="Leave a field blank to use the product's own name and description."
				title="Search Listing"
			>
				<div className={styles.seoFields}>
					<div className="min-w-0 space-y-2">
						<label className="block text-[14px] font-semibold text-ink-700" htmlFor={`${idPrefix}-slug`}>URL Handle</label>
						<div className="flex min-w-0 items-stretch overflow-hidden rounded-base border border-surface-line bg-surface-body focus-within:border-brand-500">
							<span className="hidden shrink-0 items-center border-r border-surface-line bg-surface-muted px-3 text-[13px] text-ink-500 sm:flex">/product/</span>
							<input
								aria-describedby={`${idPrefix}-slug-help`}
								className="h-11 w-full min-w-0 bg-transparent px-3 text-[16px]! text-ink-900 outline-none placeholder:text-ink-400 sm:text-[14px]!"
								id={`${idPrefix}-slug`}
								maxLength={SEO_SLUG_MAX}
								onBlur={() => setSlug(slugifyHandle(effectiveSlug))}
								onChange={(event) => {
									setSlugTouched(true);
									setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"));
								}}
								placeholder="cozy-cat-carrier-hoodie"
								type="text"
								value={effectiveSlug}
							/>
							{slugTouched && productName ? (
								<button
									className="shrink-0 cursor-pointer border-l border-surface-line px-3 text-[12px] font-semibold text-brand-600 hover:bg-brand-50"
									onClick={() => {
										setSlug(slugifyHandle(productName));
										setSlugTouched(true);
									}}
									type="button"
								>
									From name
								</button>
							) : null}
						</div>
						<p className="mb-0 text-[12px] leading-relaxed text-ink-400" id={`${idPrefix}-slug-help`}>
							{slugChanged ? (
								<span className="font-semibold text-warning-600">
									The current address /product/{product?.slug} will permanently redirect here, so existing links and rankings carry over.
								</span>
							) : (
								"Lower-case words separated by hyphens. Keep it short and stable – changing it later adds a redirect."
							)}
						</p>
					</div>

					<div className="min-w-0 space-y-2">
						<label className="block text-[14px] font-semibold text-ink-700" htmlFor={`${idPrefix}-meta-title`}>Meta Title</label>
						<input
							aria-describedby={`${idPrefix}-title-meter`}
							className={inputClass}
							id={`${idPrefix}-meta-title`}
							maxLength={120}
							name="meta_title"
							onChange={(event) => setTitle(event.target.value)}
							placeholder={productName || "Enter a descriptive product title"}
							type="text"
							value={title}
						/>
						<LengthMeter
							id={`${idPrefix}-title-meter`}
							length={title.trim() ? previewTitleFull.length : 0}
							max={SEO_TITLE_MAX}
							min={30}
							note={`Put the most important words first. “${TITLE_SUFFIX.trim()}” is added automatically.`}
						/>
					</div>

					<div className="min-w-0 space-y-2">
						<label className="block text-[14px] font-semibold text-ink-700" htmlFor={`${idPrefix}-meta-description`}>Meta Description</label>
						<textarea
							aria-describedby={`${idPrefix}-description-meter`}
							className="block min-h-[120px] w-full min-w-0 resize-y rounded-base border border-surface-line bg-surface-body px-3 py-3 text-[16px]! leading-relaxed text-ink-900 placeholder:text-ink-400 sm:text-[14px]!"
							id={`${idPrefix}-meta-description`}
							maxLength={320}
							name="meta_desc"
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Summarise what it is, who it's for and why it's worth a click…"
							rows={4}
							value={description}
						/>
						<LengthMeter
							id={`${idPrefix}-description-meter`}
							length={plain(description).length}
							max={SEO_DESCRIPTION_MAX}
							min={SEO_DESCRIPTION_MIN}
							note="Plain text. Google may rewrite it, but a clear summary is used most often."
						/>
					</div>

					<div className="min-w-0 space-y-2">
						<label className="block text-[14px] font-semibold text-ink-700" htmlFor={`${idPrefix}-meta-keywords`}>Focus Keywords</label>
						<input
							aria-describedby={`${idPrefix}-keywords-help`}
							className={inputClass}
							id={`${idPrefix}-meta-keywords`}
							name="meta_keywords"
							onChange={(event) => setKeywords(event.target.value)}
							placeholder="e.g. pet carrier hoodie, cat carrier, dog travel bag"
							type="text"
							value={keywords}
						/>
						{parseKeywords(keywords).length ? (
							<ul className="flex flex-wrap gap-1.5" aria-label="Keywords">
								{parseKeywords(keywords).map((keyword) => {
									const used = `${previewTitleFull} ${previewDescription}`.toLowerCase().includes(keyword.toLowerCase());
									return (
										<li
											className={cn(
												"rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
												used ? "bg-success-50 text-success-700" : "bg-surface-muted text-ink-500",
											)}
											key={keyword}
											title={used ? "Appears in the title or description" : "Not in the title or description yet"}
										>
											{keyword}
										</li>
									);
								})}
							</ul>
						) : null}
						<p className="mb-0 text-[12px] leading-relaxed text-ink-400" id={`${idPrefix}-keywords-help`}>
							Comma-separated phrases shoppers search for. Google ignores the keywords tag itself – green chips show
							phrases already used in your title or description, which is what counts.
						</p>
					</div>
				</div>
			</SectionCard>

			<SectionCard
				description="Describe what each photo shows. Used by Google Images, screen readers and when an image fails to load."
				end={
					<span className="rounded-full bg-surface-muted px-3 py-1 text-[12px] font-semibold tabular-nums text-ink-500">
						{Object.keys(imageAlts).length}/{readyImages.length} described
					</span>
				}
				title="Image Alt Text"
			>
				{readyImages.length ? (
					<ul className="grid gap-3">
						{readyImages.map((image, index) => {
							const value = alts[image.url] ?? "";
							const inputId = `${idPrefix}-alt-${image.id}`;
							return (
								<li className="flex min-w-0 items-start gap-3" key={image.id}>
									{/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded URL */}
									<img
										alt=""
										className={cn(
											"h-16 w-16 shrink-0 rounded-base border object-cover",
											index === 0 ? "border-brand-600 ring-2 ring-brand-100" : "border-surface-line",
										)}
										src={image.preview}
									/>
									<div className="min-w-0 flex-1 space-y-1">
										<label className="block text-[13px] font-semibold text-ink-700" htmlFor={inputId}>
											{index === 0 ? "Primary image" : `Image ${index + 1}`}
										</label>
										<input
											className={inputClass}
											id={inputId}
											maxLength={IMAGE_ALT_MAX}
											onChange={(event) => setAlts((current) => ({ ...current, [image.url]: event.target.value }))}
											placeholder={index === 0 ? productName || "e.g. Cream cat carrier hoodie with a cat peeking out" : `${productName || "Product"} – view ${index + 1}`}
											type="text"
											value={value}
										/>
										<p className="mb-0 text-right text-[11px] tabular-nums text-ink-400">{value.length}/{IMAGE_ALT_MAX}</p>
									</div>
								</li>
							);
						})}
					</ul>
				) : (
					<p className="mb-0 rounded-base bg-surface-body px-3 py-3 text-[13px] text-ink-500">
						Add images in the Advanced tab&apos;s Gallery first – they&apos;ll appear here for alt text.
					</p>
				)}
			</SectionCard>

			<SectionCard
				description="Barcodes and part numbers let Google match this product and show it in Shopping results."
				title="Product Identifiers"
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="min-w-0 space-y-2">
						<label className="block text-[14px] font-semibold text-ink-700" htmlFor={`${idPrefix}-gtin`}>GTIN (UPC / EAN / ISBN)</label>
						<input
							aria-describedby={`${idPrefix}-gtin-help`}
							aria-invalid={gtinInvalid}
							className={inputClass}
							id={`${idPrefix}-gtin`}
							inputMode="numeric"
							maxLength={20}
							name="gtin"
							onChange={(event) => setGtin(event.target.value)}
							placeholder="e.g. 0123456789012"
							type="text"
							value={gtin}
						/>
						<p
							className={cn("mb-0 text-[12px] leading-relaxed", gtinInvalid ? "font-semibold text-danger-600" : "text-ink-400")}
							id={`${idPrefix}-gtin-help`}
						>
							{gtinInvalid
								? "That number doesn't pass the barcode check digit – check for a typo."
								: gtinDigits
									? "Valid barcode number."
									: "The digits under the barcode. Leave blank if the product has none."}
						</p>
					</div>
					<div className="min-w-0 space-y-2">
						<label className="block text-[14px] font-semibold text-ink-700" htmlFor={`${idPrefix}-mpn`}>MPN</label>
						<input
							aria-describedby={`${idPrefix}-mpn-help`}
							className={inputClass}
							id={`${idPrefix}-mpn`}
							maxLength={70}
							name="mpn"
							onChange={(event) => setMpn(event.target.value)}
							placeholder="Manufacturer part number"
							type="text"
							value={mpn}
						/>
						<p className="mb-0 text-[12px] leading-relaxed text-ink-400" id={`${idPrefix}-mpn-help`}>
							Use when there&apos;s no GTIN. Your SKU is always included automatically.
						</p>
					</div>
				</div>
			</SectionCard>

			<SectionCard title="Search Visibility">
				<label className="flex cursor-pointer items-start gap-3" htmlFor={`${idPrefix}-noindex`}>
					<input
						checked={noindex}
						className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
						id={`${idPrefix}-noindex`}
						name="seo_noindex"
						onChange={(event) => setNoindex(event.target.checked)}
						type="checkbox"
					/>
					<span className="min-w-0">
						<span className="block text-[14px] font-semibold text-ink-700">Hide this product from search engines</span>
						<span className="block text-[12px] leading-relaxed text-ink-400">
							Adds a noindex tag and removes it from the sitemap. Shoppers can still find it in your store. Use for
							test products or duplicates.
						</span>
					</span>
				</label>
			</SectionCard>
		</div>
	);
}
