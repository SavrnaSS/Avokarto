"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { SelectField } from "@/admin/components/forms/admin-form-primitives";
import { Icon } from "@/admin/components/layout/icon";
import { LiveDataStatus } from "@/admin/components/realtime/live-admin-resources";
import { AppSelect } from "@/admin/components/ui/app-select";
import type { AppSelectOption } from "@/admin/components/ui/app-select";
import { ColorVariantsField } from "@/admin/components/products/color-variants-field";
import { FaqsField } from "@/admin/components/products/faqs-field";
import { ProductSeoFields } from "@/admin/components/products/product-seo-fields";
import { GenerateReviewsModal } from "@/admin/components/products/generate-reviews-modal";
import { ReelsPanel } from "@/admin/components/products/reels-panel";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import { MAX_GALLERY_IMAGES, useImageGallery } from "@/admin/hooks/use-image-gallery";
import { useImageUpload } from "@/admin/hooks/use-image-upload";
import { useRealtimeResource } from "@/admin/hooks/use-realtime-resource";
import DataBoundary from "@/components/common/loading/DataBoundary";
import { useLiveResource } from "@/hooks/use-live-resource";
import { cn } from "@/admin/utils/cn";
import type {
	AdminProductDetail,
	AdminProductLiveState,
	AdminProductReview,
	AdminProductVariation,
} from "@/lib/backend/admin-data";
import {
	computePricing,
	inferDiscount,
	MAX_DISCOUNT_PERCENT,
	type DiscountType,
} from "@/lib/productPricing";
import styles from "./product-form.module.css";

type ProductFormMode = "add" | "edit";
type ProductTab = "advanced" | "reels" | "reviews" | "seo";
type ProductStatus = "archived" | "draft" | "low stock" | "published";
type Variation = AdminProductVariation & { id: string };
type CategoryOption = { id: string; name: string };

type ProductFormProps = {
	categoryOptions?: AppSelectOption[];
	description: string;
	formId: string;
	mode: ProductFormMode;
	product?: AdminProductDetail;
	subtitle: string;
	title: string;
};

const tabLabels: Record<ProductTab, string> = {
	advanced: "Advanced",
	reels: "Promo reels",
	reviews: "Reviews",
	seo: "SEO",
};

const discountOptions: [DiscountType, string][] = [
	["none", "No Discount"],
	["percentage", "Percentage %"],
	["fixed", "Fixed Amount"],
];

const money = new Intl.NumberFormat("en-US", {
	currency: "USD",
	style: "currency",
});

/** The form's string-valued fields, for detecting unsaved edits. */
function serializeFormState(form: HTMLFormElement) {
	const params = new URLSearchParams();
	for (const [key, value] of new FormData(form)) {
		if (typeof value === "string") params.append(key, value);
	}
	return params.toString();
}

function numberText(value: number | null | undefined) {
	return value === null || value === undefined ? undefined : String(value);
}

export function ProductForm({
	categoryOptions = [],
	description,
	formId,
	mode,
	product,
	subtitle,
	title,
}: ProductFormProps) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [activeTab, setActiveTab] = useState<ProductTab>("advanced");
	const [status, setStatus] = useState<ProductStatus>(
		product?.status ?? "published",
	);
	const gallery = useImageGallery(product?.images ?? []);
	const summaryImage = useImageUpload(product?.shortSummaryImage ?? "", {
		height: product?.shortSummaryImageHeight,
		width: product?.shortSummaryImageWidth,
	});
	const [variations, setVariations] = useState<Variation[]>(() =>
		product?.variations.length
			? product.variations.map((variation, index) => ({
					...variation,
					id: `variation-${index}`,
				}))
			: [{ attribute: "", id: "variation-0", value: "" }],
	);
	const [guideOpen, setGuideOpen] = useState(false);
	const [clientError, setClientError] = useState<string | null>(null);
	const forceSaveRef = useRef(false);
	const {
		error: serverError,
		errorCode,
		errorField,
		onSubmit,
		submitting,
		succeeded,
	} = useAdminFormSubmit({
		endpoint: "/api/admin/products",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.products,
	});
	const error = clientError ?? serverError;

	// ---- Pricing: the form edits a regular price plus a discount; the
	// server derives the stored price/old_price with the same helper.
	const [pricingDefaults] = useState(() =>
		product
			? inferDiscount(product.price, product.oldPrice)
			: { discountType: "none" as DiscountType, discountValue: 0, regularPrice: 0 },
	);
	const [regularPrice, setRegularPrice] = useState(
		product ? String(pricingDefaults.regularPrice) : "",
	);
	const [discountType, setDiscountType] = useState<DiscountType>(
		pricingDefaults.discountType,
	);
	const [discountValue, setDiscountValue] = useState(
		pricingDefaults.discountType === "none"
			? ""
			: String(pricingDefaults.discountValue),
	);
	const pricing = computePricing(
		regularPrice.trim() === "" ? Number.NaN : Number(regularPrice),
		discountType,
		Number(discountValue),
	);

	// ---- Live data: categories (another tab may create one) and, when
	// editing, this product's row version + sales.
	const categories = useLiveResource<CategoryOption[]>({
		endpoint: "/api/admin/categories",
		initialData: categoryOptions.map((option) => ({
			id: option.value,
			name: option.label,
		})),
		initialDataReady: true,
		topics: ["categories"],
	});
	const live = useLiveResource<AdminProductLiveState | null>({
		endpoint: product ? `/api/admin/products/${product.id}` : null,
		initialData: null,
		topics: ["products", "orders"],
	});
	const liveState = product && live.hasData && !live.loading ? live.data : undefined;
	const remoteDeleted = Boolean(product) && liveState === null;
	const remoteChanged = Boolean(
		product && liveState && liveState.version !== product.version,
	);

	// ---- Unsaved changes: compare the serialized form with a baseline.
	const baselineRef = useRef<string | null>(null);
	const [dirty, setDirty] = useState(false);
	const checkDirty = useCallback(() => {
		const form = formRef.current;
		if (!form || baselineRef.current === null) return;
		setDirty(serializeFormState(form) !== baselineRef.current);
	}, []);
	const scheduleDirtyCheck = useCallback(() => {
		// After React has committed the state change the event caused.
		window.setTimeout(checkDirty, 0);
	}, [checkDirty]);

	useEffect(() => {
		// Deferred so controls that render their native form element after
		// mounting (Radix selects) are part of the baseline.
		const timer = window.setTimeout(() => {
			if (formRef.current) {
				baselineRef.current = serializeFormState(formRef.current);
			}
		}, 0);
		return () => window.clearTimeout(timer);
	}, []);

	// Uploads finish without any DOM event on the form.
	const galleryKey = gallery.urls.join("\n");
	useEffect(() => {
		checkDirty();
	}, [galleryKey, summaryImage.url, checkDirty]);

	const guardNavigation = dirty && !succeeded;
	useEffect(() => {
		if (!guardNavigation) return;

		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		// Client-side navigations (sidebar, breadcrumbs, Cancel) don't fire
		// beforeunload; intercept same-origin link clicks before Next does.
		const onClick = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}
			const anchor = (event.target as Element | null)?.closest?.("a[href]");
			if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) {
				return;
			}
			const url = new URL(anchor.href, window.location.href);
			if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
				return;
			}
			if (!window.confirm("You have unsaved changes to this product. Leave without saving?")) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		window.addEventListener("beforeunload", onBeforeUnload);
		document.addEventListener("click", onClick, true);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			document.removeEventListener("click", onClick, true);
		};
	}, [guardNavigation]);

	// Nothing edited here yet and the product changed elsewhere: just load
	// the latest version (the edit page remounts this form per version).
	const autoRefreshedRef = useRef<string | null>(null);
	const latestVersion = liveState?.version;
	useEffect(() => {
		if (!remoteChanged || dirty || submitting || succeeded || !latestVersion) return;
		if (autoRefreshedRef.current === latestVersion) return;
		autoRefreshedRef.current = latestVersion;
		router.refresh();
	}, [remoteChanged, dirty, submitting, succeeded, latestVersion, router]);

	// ---- Validation helpers
	const revealField = useCallback(
		(element: Element) => {
			const panel = element.closest('[role="tabpanel"]');
			const tab = tabsFor(mode).find(
				(candidate) => panel?.id === `${formId}-${candidate}-panel`,
			);
			if (tab) setActiveTab(tab);
			requestAnimationFrame(() => {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
				if (element instanceof HTMLElement) element.focus({ preventScroll: true });
			});
		},
		[formId, mode],
	);

	// Point at the field the server rejected.
	useEffect(() => {
		const form = formRef.current;
		if (!errorField || !form) return;
		const target =
			form.querySelector(`[name="${CSS.escape(errorField)}"]:not([type="hidden"])`) ??
			form.querySelector(`[data-field="${CSS.escape(errorField)}"]`);
		if (target) revealField(target);
	}, [errorField, revealField]);

	const errorRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [error]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setClientError(null);
		const form = event.currentTarget;
		const force = forceSaveRef.current;
		forceSaveRef.current = false;

		if (gallery.images.some((image) => image.uploading) || summaryImage.uploading) {
			setClientError("Images are still uploading. Save again once they finish.");
			return;
		}
		if (gallery.images.some((image) => image.error)) {
			setClientError("Some gallery images failed to upload. Remove them (or upload them again) before saving.");
			form.querySelector('[data-field="gallery_image_urls"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}

		const invalidField = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
			"input:invalid, textarea:invalid, select:invalid",
		);
		if (invalidField) {
			revealField(invalidField);
			requestAnimationFrame(() => invalidField.reportValidity());
			return;
		}

		void onSubmit(event, force ? { force: "true" } : undefined);
	}

	function overwriteRemoteChanges() {
		forceSaveRef.current = true;
		formRef.current?.requestSubmit();
	}

	function discardAndLoadLatest() {
		baselineRef.current = null;
		setDirty(false);
		setClientError(null);
		router.refresh();
	}

	const tabs = tabsFor(mode);
	const savingBlocked = remoteDeleted;

	return (
		<>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 max-w-full">
					<nav className="mb-1 flex items-center gap-1.5 text-[13px] text-ink-400">
						<Link className="hover:text-brand-600" href={routes.dashboard}>
							Home
						</Link>
						<Icon className="h-3.5 w-3.5" name="chevron-right" />
						<Link className="hover:text-brand-600" href={routes.products}>
							Products
						</Link>
						<Icon className="h-3.5 w-3.5" name="chevron-right" />
						<span className="text-ink-700">{subtitle}</span>
					</nav>
					<h1 className="text-[22px] font-semibold text-ink-900">{title}</h1>
					<p className="mt-1 break-words text-[14px] text-ink-500">
						{description}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{dirty && !succeeded ? (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-[12px] font-semibold text-warning-600" role="status">
							<span className="h-2 w-2 rounded-full bg-warning-500" />
							Unsaved changes
						</span>
					) : null}
					<button
						className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted cursor-pointer"
						onClick={() => setGuideOpen(true)}
						type="button"
					>
						<Icon className="h-4 w-4" name="panel-left" />
						Form Guide
					</button>
				</div>
			</div>

			{remoteDeleted ? (
				<div className="mb-5 rounded-card border border-danger-100 bg-danger-50 px-4 py-3 text-[14px] text-danger-600" role="alert">
					<p className="font-semibold">This product has been deleted.</p>
					<p className="mt-1 text-[13px]">
						Someone removed it while you were editing, so it can no longer be
						saved. Copy anything you need, then go back to{" "}
						<Link className="font-semibold underline" href={routes.products}>
							Products
						</Link>
						.
					</p>
				</div>
			) : remoteChanged && dirty && !succeeded ? (
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning-100 bg-warning-50 px-4 py-3" role="alert">
					<div className="min-w-0 text-[14px] text-ink-700">
						<p className="font-semibold text-ink-900">
							This product was changed somewhere else
							{liveState ? ` at ${new Date(liveState.updatedAt).toLocaleTimeString()}` : ""}.
						</p>
						<p className="mt-1 text-[13px] text-ink-500">
							Your edits are still here. Load the latest version (discarding
							your edits), or keep editing - saving will ask before it
							overwrites their changes.
						</p>
					</div>
					<button
						className="inline-flex h-9 shrink-0 items-center gap-2 rounded-base border border-surface-line bg-surface-card px-3 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted"
						onClick={discardAndLoadLatest}
						type="button"
					>
						<Icon className="h-4 w-4" name="refresh-ccw" />
						Load latest
					</button>
				</div>
			) : null}

			{/* Reviews and Promo reels manage their own data: full width, no Save footer (data-reviews). */}
			<form
				className={styles.form}
				data-reviews={activeTab === "reviews" || activeTab === "reels" || undefined}
				id={formId}
				noValidate
				onChange={scheduleDirtyCheck}
				onClick={scheduleDirtyCheck}
				onInput={scheduleDirtyCheck}
				onSubmit={handleSubmit}
				ref={formRef}
			>
				{/*
				 * Unconditional, unlike the Advanced tab's read-only SKU display -
				 * Save Changes lives in a persistent footer, not inside any one
				 * tab, so a hidden field nested in tab-conditional JSX would go
				 * missing from FormData whenever you save from a different tab.
				 */}
				{product ? (
					<>
						<input name="sku" type="hidden" value={product.sku} />
						{/* What the server compares to detect edits made elsewhere. */}
						<input name="expected_version" type="hidden" value={product.version} />
						<input name="stock_loaded" type="hidden" value={product.stock} />
					</>
				) : null}
					<div
						aria-label="Product form tabs"
						className={styles.tabs}
						role="tablist"
					>
						{tabs.map((tab) => {
							const active = activeTab === tab;
							return (
								<button
									aria-controls={`${formId}-${tab}-panel`}
									aria-selected={active}
									className={cn(
										styles.tab,
										active
											? "border-brand-600 text-brand-600"
											: "border-transparent text-ink-500 hover:text-ink-700",
									)}
									key={tab}
									id={`${formId}-${tab}-tab`}
									onClick={() => setActiveTab(tab)}
									onKeyDown={(event) => {
										const index = tabs.indexOf(tab);
										const nextIndex = event.key === "Home" ? 0
											: event.key === "End" ? tabs.length - 1
												: event.key === "ArrowRight" ? (index + 1) % tabs.length
													: event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
														: undefined;
										if (nextIndex === undefined) return;
										event.preventDefault();
										setActiveTab(tabs[nextIndex]);
										document.getElementById(`${formId}-${tabs[nextIndex]}-tab`)?.focus();
									}}
									role="tab"
									tabIndex={active ? 0 : -1}
									type="button"
								>
									{tabLabels[tab]}
								</button>
							);
						})}
					</div>

				<div className={styles.main}>
					{/*
						 * Keep form fields mounted in both panels so switching tabs
						 * retains edits and saving includes every product field.
						 */}
					<div
						aria-labelledby={`${formId}-advanced-tab`}
						className={cn("min-w-0 space-y-4", activeTab !== "advanced" && "hidden")}
						hidden={activeTab !== "advanced"}
						id={`${formId}-advanced-panel`}
						role="tabpanel"
					>
							<Card title="General">
								<div className="space-y-4">
									<Field
										defaultValue={product?.name}
										help="A product name is required and recommended to be unique."
										label="Product Name"
										maxLength={200}
										name="name"
										placeholder="Product name"
										required
									/>
									<TextAreaField
										defaultValue={product?.description}
										help="Shown on the product page's Description tab. Plain text - line breaks are kept."
										label="Description"
										name="description"
										placeholder="Type your text here..."
										rows={6}
									/>
								</div>
							</Card>

							<ProductGallery gallery={gallery} />

							<StorefrontDisplay product={product} summaryImage={summaryImage} />

							<ColorVariantsField
								gallery={gallery}
								initialVariants={product?.colorVariants ?? []}
							/>

							<Card title="Pricing">
								<div className="space-y-4">
									<label className="block">
										<span className="text-[13px] font-semibold text-ink-700">
											Regular Price ($) <span className="text-danger-500">*</span>
										</span>
										<input
											className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] placeholder:text-ink-400 focus:border-brand-600"
											inputMode="decimal"
											max="9999999999.99"
											min="0"
											name="regular_price"
											onChange={(event) => setRegularPrice(event.target.value)}
											placeholder="0.00"
											required
											step="0.01"
											type="number"
											value={regularPrice}
										/>
										<p className="mt-1 text-[12px] text-ink-400">
											The full price before any discount.
										</p>
									</label>
									<div>
										<span className="text-[13px] font-semibold text-ink-700">
											Discount Type
										</span>
										<div className="mt-2 grid gap-3 sm:grid-cols-3">
											{discountOptions.map(([value, label]) => {
												const active = discountType === value;
												return (
													<label
														className={cn(
															"flex cursor-pointer items-center gap-3 rounded-base border px-4 py-3",
															active
																? "border-brand-600 bg-brand-50/60"
																: "border-surface-line hover:bg-surface-muted",
														)}
														key={value}
													>
														<input
															checked={active}
															className="h-4 w-4 border-surface-line text-brand-600 focus:ring-brand-600"
															name="discount_type"
															onChange={() => setDiscountType(value)}
															type="radio"
															value={value}
														/>
														<span className="text-[14px] font-semibold text-ink-900">
															{label}
														</span>
													</label>
												);
											})}
										</div>
									</div>

									{discountType !== "none" ? (
										<label className="block">
											<span className="text-[13px] font-semibold text-ink-700">
												{discountType === "percentage"
													? "Discount Percentage (%)"
													: "Discount Amount ($)"}
											</span>
											<input
												aria-describedby={`${formId}-pricing-summary`}
												aria-invalid={Boolean(pricing.error && discountValue) || undefined}
												className="mt-1.5 h-10 w-full max-w-xs rounded-base border border-surface-line bg-surface-body px-3 text-[14px] focus:border-brand-600 aria-[invalid=true]:border-danger-500"
												inputMode="decimal"
												max={discountType === "percentage" ? MAX_DISCOUNT_PERCENT : undefined}
												min="0"
												name="discount_value"
												onChange={(event) => setDiscountValue(event.target.value)}
												placeholder={discountType === "percentage" ? "10" : "5.00"}
												required
												step={discountType === "percentage" ? "1" : "0.01"}
												type="number"
												value={discountValue}
											/>
										</label>
									) : null}

									<PricingSummary
										id={`${formId}-pricing-summary`}
										pricing={pricing}
										show={regularPrice.trim() !== ""}
									/>

									<div className="grid gap-4 sm:grid-cols-2">
										<SelectField
											defaultValue={product?.taxClass ?? "standard"}
											help="Saved with the product. Checkout doesn't apply tax rules yet."
											label="Tax Class"
											name="tax_class"
											options={[
												{ label: "Standard Rate", value: "standard" },
												{ label: "Reduced Rate", value: "reduced" },
												{ label: "Zero Rate", value: "zero" },
											]}
										/>
										<Field
											defaultValue={numberText(product?.vatRate)}
											help="Optional product-specific VAT rate (0-100). Checkout doesn't apply it yet."
											label="VAT Rate (%)"
											max="100"
											name="vat"
											placeholder="0"
											type="number"
										/>
									</div>
								</div>
							</Card>

							<OptionsBuyBox product={product} />

						<div className="space-y-4">
							<InventorySection liveStock={liveState?.stock} product={product} />
							<Card title="Variations">
								<p className="mb-4 text-[13px] text-ink-500">
									Extra options this product comes in. Rows without both an
									attribute and a value are ignored.
								</p>
								<input
									name="variations"
									type="hidden"
									value={JSON.stringify(
										variations.map(({ attribute, value }) => ({ attribute, value })),
									)}
								/>
								<div className="space-y-3" data-field="variations">
									{variations.map((variation, index) => (
											<div className={styles.variationRow} key={variation.id}>
											<AppSelect
												ariaLabel={`Variation ${index + 1} attribute`}
												className="flex-1"
												onValueChange={(attribute) =>
													setVariations((current) =>
														current.map((item) =>
															item.id === variation.id
																? { ...item, attribute }
																: item,
														),
													)
												}
												options={["Color", "Size", "Material", "Weight"]}
												placeholder="Select a variation"
												value={variation.attribute || undefined}
											/>
											<input
												aria-label={`Variation ${index + 1} value`}
												className="h-10 flex-1 rounded-base border border-surface-line bg-surface-body px-3 text-[14px] focus:border-brand-600"
												maxLength={120}
												onChange={(event) =>
													setVariations((current) =>
														current.map((item) =>
															item.id === variation.id
																? { ...item, value: event.target.value }
																: item,
														),
													)
												}
												placeholder="Variation"
												type="text"
												value={variation.value}
											/>
											<button
												aria-label={`Remove variation ${index + 1}`}
												className="grid h-9 w-9 shrink-0 place-items-center rounded-base border border-danger-100 bg-danger-50 text-danger-500 hover:bg-danger-100"
												onClick={() =>
													setVariations((current) =>
														current.length > 1
															? current.filter((item) => item.id !== variation.id)
															: [{ attribute: "", id: `variation-${Date.now()}`, value: "" }],
													)
												}
												type="button"
											>
												<Icon className="h-4 w-4" name="x" />
											</button>
										</div>
									))}
								</div>
								<button
									className="mt-4 inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
									disabled={variations.length >= 50}
									onClick={() =>
										setVariations((current) => [
											...current,
											{
												attribute: "",
												id: `variation-${Date.now()}`,
												value: "",
											},
										])
									}
									type="button"
								>
									<Icon className="h-4 w-4" name="plus" />
									Add variation
								</button>
							</Card>
							<ShippingSection product={product} />
							<ProductDetailsAdvanced product={product} />
						<FaqsField initialFaqs={product?.faqs ?? []} />
						</div>
					</div>

					{/* Always mounted (like Advanced) so SEO edits survive tab
					    switches and are included whichever tab you save from. */}
					<div
						aria-labelledby={`${formId}-seo-tab`}
						className={cn("min-w-0", activeTab !== "seo" && "hidden")}
						hidden={activeTab !== "seo"}
						id={`${formId}-seo-panel`}
						role="tabpanel"
					>
						<ProductSeoFields
							formId={formId}
							gallery={gallery}
							idPrefix={formId}
							price={pricing.price ?? undefined}
							product={product}
						/>
					</div>

					{activeTab === "reviews" ? (
					<div role="tabpanel" id={`${formId}-reviews-panel`} aria-labelledby={`${formId}-reviews-tab`}>
					<ReviewsPanel productId={product?.id} productName={product?.name ?? "Product"} />
					</div>
				) : null}
					{activeTab === "reels" ? (
					<div role="tabpanel" id={`${formId}-reels-panel`} aria-labelledby={`${formId}-reels-tab`}>
					<ReelsPanel productId={product?.id} productName={product?.name ?? "this product"} />
					</div>
				) : null}
				</div>

				<div
					aria-label="Product settings"
					className={styles.sidebar}
					hidden={activeTab === "reviews" || activeTab === "reels"}
					role="region"
				>
					<Card
						title="Status"
						titleEnd={
							<span
								aria-label={`Current status: ${status}`}
								className={cn(
									"h-2.5 w-2.5 rounded-full",
									status === "published"
										? "bg-success-500"
										: status === "draft" || status === "low stock"
											? "bg-warning-500"
											: "bg-ink-300",
								)}
								role="status"
							/>
						}
						titleTag="h3"
					>
						<AppSelect
							name="status"
							onValueChange={(value) => setStatus(value as ProductStatus)}
							options={[
								{ label: "Published", value: "published" },
								{ label: "Draft", value: "draft" },
								{ label: "Low stock", value: "low stock" },
								{ label: "Archived", value: "archived" },
							]}
							value={status}
						/>
						<p className="mt-2 text-[12px] text-ink-400">
							{status === "published" || status === "low stock"
								? "Visible on the storefront."
								: "Hidden from the storefront."}
						</p>
					</Card>

					<Card title="Product Details" titleTag="h3">
						<div className="space-y-4">
							<SelectField
								defaultValue={product?.categoryId || undefined}
								help="Add product to a category. New categories appear here automatically."
								label="Categories"
								name="category_id"
								options={categories.data.map((category) => ({
									label: category.name,
									value: category.id,
								}))}
								placeholder="Select category"
							/>
							{/* New tab, so the product being edited isn't lost. */}
							<a
								className="inline-flex h-9 items-center gap-1.5 rounded-base bg-brand-50 px-3 text-[13px]! font-semibold! text-brand-600 hover:bg-brand-100 hover:text-brand-700"
								href={routes.addCategory}
								rel="noopener"
								target="_blank"
							>
								<Icon className="h-3.5 w-3.5" name="plus" />
								Create new category
							</a>
							<Field
								defaultValue={product?.tags?.join(", ")}
								help="Comma-separated tags shown on the storefront."
								label="Tags"
								name="tags"
								placeholder="new, trending, sale"
							/>
						</div>
					</Card>

					{product ? (
						<SalesSummary error={live.error} lastEventAt={live.lastEventAt} live={liveState ?? null} />
					) : (
						<WeeklySales />
					)}
				</div>
			</form>

			<div ref={errorRef}>
				{error ? (
					<div className="mt-4 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500" role="alert">
						<p>{error}</p>
						{errorCode === "PRODUCT_CHANGED" ? (
							<div className="mt-2 flex flex-wrap gap-2">
								<button
									className="inline-flex h-8 items-center rounded-base border border-surface-line bg-surface-card px-3 text-[12px] font-semibold text-ink-700 hover:bg-surface-muted"
									onClick={discardAndLoadLatest}
									type="button"
								>
									Discard mine &amp; load latest
								</button>
								<button
									className="inline-flex h-8 items-center rounded-base bg-danger-500 px-3 text-[12px] font-semibold text-white hover:bg-danger-600"
									onClick={overwriteRemoteChanges}
									type="button"
								>
									Overwrite with my changes
								</button>
							</div>
						) : null}
					</div>
				) : null}
			</div>
			<div className={styles.actions} hidden={activeTab === "reviews" || activeTab === "reels"}>
				<Link
					className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-5 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
					href={routes.products}
				>
					Cancel
				</Link>
				<button
					className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
					disabled={submitting || succeeded || savingBlocked}
					form={formId}
					type="submit"
				>
					<Icon className={cn("h-4 w-4", submitting && "animate-spin")} name={submitting ? "loader" : "save"} />
					{submitting ? "Saving..." : succeeded ? "Saved" : mode === "add" ? "Create Product" : "Save Changes"}
				</button>
			</div>

			{guideOpen ? (
				<FormGuideDrawer onClose={() => setGuideOpen(false)} />
			) : null}
		</>
	);
}

function tabsFor(mode: ProductFormMode): ProductTab[] {
	return mode === "edit" ? ["advanced", "seo", "reviews", "reels"] : ["advanced", "seo"];
}

function PricingSummary({
	id,
	pricing,
	show,
}: {
	id: string;
	pricing: ReturnType<typeof computePricing>;
	show: boolean;
}) {
	if (!show) {
		return <p className="text-[12px] text-ink-400" id={id}>Enter a price to preview what customers pay.</p>;
	}

	if (pricing.error !== null) {
		return (
			<p className="rounded-base bg-danger-50 px-3 py-2 text-[13px] font-semibold text-danger-500" id={id} role="status">
				{pricing.error}
			</p>
		);
	}

	const savedPercent = pricing.oldPrice
		? Math.round((1 - pricing.price / pricing.oldPrice) * 100)
		: 0;

	return (
		<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-base border border-surface-line bg-surface-body px-4 py-3" id={id} role="status">
			<span className="text-[13px] text-ink-500">Customers pay</span>
			<span className="text-[20px] font-semibold text-ink-900">{money.format(pricing.price)}</span>
			{pricing.oldPrice ? (
				<>
					<span className="text-[14px] text-ink-400 line-through">{money.format(pricing.oldPrice)}</span>
					<span className="rounded-full bg-success-50 px-2 py-0.5 text-[12px] font-semibold text-success-600">
						Save {money.format(pricing.oldPrice - pricing.price)} ({savedPercent}%)
					</span>
				</>
			) : null}
		</div>
	);
}

type CardProps = {
	children: React.ReactNode;
	title: string;
	titleEnd?: React.ReactNode;
	titleTag?: "h2" | "h3";
};

function Card({ children, title, titleEnd, titleTag = "h2" }: CardProps) {
	const Title = titleTag;

	return (
		<article className={cn(styles.card, "rounded-card border border-surface-line bg-surface-card shadow-card")}>
			{titleEnd ? (
				<div className="mb-4 flex items-center justify-between gap-2">
					<Title className="text-[16px] font-semibold text-ink-900">
						{title}
					</Title>
					{titleEnd}
				</div>
			) : (
				<Title className="mb-4 text-[16px] font-semibold text-ink-900">
					{title}
				</Title>
			)}
			{children}
		</article>
	);
}

type FieldProps = {
	defaultValue?: string;
	help?: React.ReactNode;
	label: string;
	max?: string;
	maxLength?: number;
	name: string;
	placeholder?: string;
	required?: boolean;
	step?: string;
	type?: string;
};

function Field({
	defaultValue,
	help,
	label,
	max,
	maxLength,
	name,
	placeholder,
	required,
	step,
	type = "text",
}: FieldProps) {
	return (
		<label className="block">
			<span className="text-[13px] font-semibold text-ink-700">
				{label} {required ? <span className="text-danger-500">*</span> : null}
			</span>
			<input
				className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] placeholder:text-ink-400 focus:border-brand-600"
				defaultValue={defaultValue}
				inputMode={type === "number" ? "decimal" : undefined}
				max={max}
				maxLength={maxLength}
				min={type === "number" ? "0" : undefined}
				name={name}
				placeholder={placeholder}
				required={required}
				step={type === "number" ? (step ?? "0.01") : undefined}
				type={type}
			/>
			{help ? <p className="mt-1 text-[12px] text-ink-400">{help}</p> : null}
		</label>
	);
}

type ProductGalleryProps = {
	gallery: ReturnType<typeof useImageGallery>;
};

function ProductGallery({ gallery }: ProductGalleryProps) {
	return (
		<Card title="Gallery">
			<p className="mb-4 text-[12px] text-ink-400">
				The first image is the product&apos;s main thumbnail everywhere on
				the site. Pin any other image to make it the main one, or remove
				images you don&apos;t need.
			</p>
			<div className="grid grid-cols-3 gap-3 sm:grid-cols-4" data-field="gallery_image_urls">
				{gallery.images.map((image, index) => (
					<div
						className={cn(
							"group relative aspect-square overflow-hidden rounded-base border bg-surface-body",
							index === 0
								? "border-brand-600 ring-2 ring-brand-100"
								: "border-surface-line",
						)}
						key={image.id}
					>
						{image.preview ? (
							// Plain img, not next/image - previews can briefly be a
							// blob: URL while the real upload is in flight, which the
							// image optimizer can't fetch.
							// eslint-disable-next-line @next/next/no-img-element
							<img
								alt={`Product image ${index + 1}`}
								className={cn(
									"h-full w-full object-cover",
									image.uploading ? "opacity-50" : "",
								)}
								src={image.preview}
							/>
						) : null}
						{image.uploading ? (
							<span className="absolute inset-0 grid place-items-center bg-ink-900/10">
								<Icon
									className="h-5 w-5 animate-spin text-brand-600"
									name="loader"
								/>
							</span>
						) : null}
						{index === 0 ? (
							<span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
								Primary
							</span>
						) : null}
						{!image.uploading ? (
							<div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-ink-900/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
								{index !== 0 ? (
									<button
										aria-label="Set as primary image"
										className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink-700 hover:bg-white"
										onClick={() => gallery.pin(image.id)}
										type="button"
									>
										<Icon className="h-3.5 w-3.5" name="star" />
									</button>
								) : null}
								<button
									aria-label="Remove image"
									className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-danger-500 hover:bg-white"
									onClick={() => gallery.remove(image.id)}
									type="button"
								>
									<Icon className="h-3.5 w-3.5" name="trash-2" />
								</button>
							</div>
						) : null}
						{image.error ? (
							<p
								className="absolute inset-x-1 bottom-1 rounded bg-danger-500/90 px-1 py-0.5 text-center text-[10px] font-semibold text-white"
								title={image.error}
							>
								Failed
							</p>
						) : null}
					</div>
				))}
				{gallery.images.length < MAX_GALLERY_IMAGES ? (
				<label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-base border-2 border-dashed border-brand-300 bg-brand-50/40 text-brand-600 transition-colors hover:bg-brand-50">
					<Icon className="h-5 w-5" name="plus" />
					<span className="text-[12px] font-semibold">Add image</span>
					<input
						accept=".png,.jpg,.jpeg,.webp"
						aria-label="Add product images"
						className="sr-only"
						multiple
						onChange={(event) => {
							if (event.target.files?.length) {
								gallery.addFiles(event.target.files);
							}

							event.target.value = "";
						}}
						type="file"
					/>
				</label>
				) : null}
			</div>
			{gallery.notice ? (
				<p className="mt-3 text-[12px] font-semibold text-danger-500" role="alert">
					{gallery.notice}
				</p>
			) : null}
			{gallery.images.length === 0 ? (
				<p className="mt-3 text-[12px] text-ink-400">
					No images yet - add at least one so the product has a thumbnail.
				</p>
			) : null}
			{gallery.urls.map((url) => (
				<input key={url} name="gallery_image_urls" type="hidden" value={url} />
			))}
		</Card>
	);
}

function StorefrontDisplay({
	product,
	summaryImage,
}: {
	product?: AdminProductDetail;
	summaryImage: ReturnType<typeof useImageUpload>;
}) {
	return (
		<Card title="Storefront Display">
			<div className="grid gap-4 md:grid-cols-2">
				<Field
					defaultValue={product?.brandName}
					help="Shown near the product title and filters. A new name creates the brand."
					label="Brand Name"
					maxLength={80}
					name="brand_name"
					placeholder="e.g. Beats"
				/>
				<Field
					defaultValue={product?.productBadges}
					help="Separate multiple storefront badges with commas."
					label="Product Badges"
					name="product_badges"
					placeholder="New, Hot, Sale"
				/>
				<Field
					defaultValue={product?.averageRating?.toString()}
					help="0-5. Replaced by the real average once the product has approved reviews."
					label="Average Rating"
					max="5"
					name="average_rating"
					placeholder="4.8"
					type="number"
				/>
				<Field
					defaultValue={product?.reviewCount?.toString()}
					help="Replaced by the real count once the product has approved reviews."
					label="Review Count"
					name="review_count"
					placeholder="52"
					step="1"
					type="number"
				/>
				<div className="md:col-span-2">
					<TextAreaField
						defaultValue={product?.shortSummary}
						help="A compact intro shown above the description on the product page."
						label="Short Summary"
						name="short_summary"
						placeholder="Wireless earbuds with active noise cancellation, long battery life, and fast charging."
					/>
					<div className="mt-3">
						<span className="text-[13px] font-semibold text-ink-700">
							Short Summary Image
						</span>
						<p className="mt-1 text-[12px] text-ink-400">
							Optional - shown right after the summary text on the product
							page. Uploads a dedicated image, separate from the product
							Gallery.
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-3">
							<input
								name="short_summary_image"
								type="hidden"
								value={summaryImage.url}
							/>
							<input
								name="short_summary_image_width"
								type="hidden"
								value={summaryImage.url ? (summaryImage.width ?? "") : ""}
							/>
							<input
								name="short_summary_image_height"
								type="hidden"
								value={summaryImage.url ? (summaryImage.height ?? "") : ""}
							/>
							<label className="group relative grid aspect-video w-56 cursor-pointer place-items-center overflow-hidden rounded-base border border-surface-line bg-surface-body shadow-soft transition-shadow hover:shadow-lift">
								<span className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-surface-card text-ink-400 shadow-card transition-colors group-hover:text-brand-600">
									<Icon className="h-3.5 w-3.5" name="pencil" />
								</span>
								{summaryImage.preview ? (
									// Plain img, not next/image - the preview can briefly be a
									// blob: URL while the real upload is in flight, which the
									// image optimizer can't fetch.
									// eslint-disable-next-line @next/next/no-img-element
									<img
										alt="Short summary image preview"
										className={cn(
											"absolute inset-0 h-full w-full object-cover",
											summaryImage.uploading ? "opacity-50" : "",
										)}
										src={summaryImage.preview}
									/>
								) : (
									<span className="grid h-10 w-10 -rotate-6 place-items-center rounded-base bg-brand-50 text-brand-200">
										<Icon
											className="h-5 w-5 transition-colors group-hover:text-brand-400"
											name="image"
										/>
									</span>
								)}
								{summaryImage.uploading ? (
									<span className="absolute inset-0 grid place-items-center bg-ink-900/10">
										<Icon
											className="h-5 w-5 animate-spin text-brand-600"
											name="loader"
										/>
									</span>
								) : null}
								<input
									accept=".png,.jpg,.jpeg,.webp"
									aria-label="Upload short summary image"
									className="sr-only"
									onChange={(event) => {
										const file = event.target.files?.[0];
										if (file) {
											void summaryImage.upload(file);
										}
										event.target.value = "";
									}}
									type="file"
								/>
							</label>
							{summaryImage.preview ? (
								<button
									className="text-[12px] font-semibold text-danger-500 hover:underline"
									disabled={summaryImage.uploading}
									onClick={() => summaryImage.clear()}
									type="button"
								>
									Remove image
								</button>
							) : null}
						</div>
						{summaryImage.error ? (
							<p className="mt-2 text-[12px] font-semibold text-danger-500" role="alert">
								{summaryImage.error}
							</p>
						) : null}
					</div>
				</div>
				<TextAreaField
					className="md:col-span-2"
					defaultValue={product?.keyHighlights?.join("; ")}
					help="Shown as highlight cards on the product page's Description tab. Separate with semicolons."
					label="Key Highlights"
					name="key_highlights"
					placeholder="Bluetooth 5.3; Noise cancellation; Fast charging; Water resistant"
				/>
			</div>
		</Card>
	);
}

function OptionsBuyBox({ product }: { product?: AdminProductDetail }) {
	return (
		<Card title="Options & Buy Box">
			<div className="grid gap-4 md:grid-cols-2">
				<Field
					defaultValue={product?.colorSwatches.join(", ")}
					help="Colors used by the storefront color filter, comma-separated."
					label="Color Swatches"
					name="color_swatches"
					placeholder="Black, White, Pink"
				/>
				<Field
					defaultValue={product?.styleOptions.join(", ")}
					help="Shown as option buttons in the buy box and the size filter."
					label="Style Options"
					name="style_options"
					placeholder="Basic, Premium, Wireless"
				/>
				<TextAreaField
					className="md:col-span-2"
					defaultValue={product?.shippingMessages.join("; ")}
					help="Short storefront messages near shipping and returns. Separate with semicolons."
					label="Shipping Message"
					name="shipping_message"
					placeholder="Free returns; Secure payment; Authentic guarantee; Warranty included"
				/>
			</div>
		</Card>
	);
}

type TextAreaFieldProps = {
	className?: string;
	defaultValue?: string;
	help: string;
	label: string;
	name: string;
	placeholder: string;
	rows?: number;
};

function TextAreaField({
	className,
	defaultValue,
	help,
	label,
	name,
	placeholder,
	rows = 3,
}: TextAreaFieldProps) {
	return (
		<label className={cn("block", className)}>
			<span className="text-[13px] font-semibold text-ink-700">{label}</span>
			<textarea
				className="mt-1.5 min-h-[92px] w-full resize-y rounded-base border border-surface-line bg-surface-body px-3 py-3 text-[14px] focus:border-brand-600"
				defaultValue={defaultValue}
				name={name}
				placeholder={placeholder}
				rows={rows}
			/>
			<p className="mt-1 text-[12px] text-ink-400">{help}</p>
		</label>
	);
}

function InventorySection({
	liveStock,
	product,
}: {
	liveStock?: number;
	product?: AdminProductDetail;
}) {
	const stockMoved =
		product && liveStock !== undefined && liveStock !== product.stock
			? liveStock - product.stock
			: 0;

	return (
		<Card title="Inventory">
			<div className="space-y-4">
				{product ? (
					// Display-only - the submitted value is the always-mounted
					// hidden field at the top of the form.
					<label className="block">
						<span className="text-[13px] font-semibold text-ink-700">SKU</span>
						<input
							className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-muted px-3 text-[14px] text-ink-500"
							disabled
							value={product.sku}
						/>
						<p className="mt-1 text-[12px] text-ink-400">
							SKU can&apos;t be changed after a product is created.
						</p>
					</label>
				) : (
					<Field
						help="Unique product code. Leave blank to generate one."
						label="SKU"
						maxLength={64}
						name="sku"
						placeholder="SKU Number"
					/>
				)}
				<div>
					<Field
						defaultValue={product?.stock.toString() ?? ""}
						help={
							product
								? "Units available to sell. Changes are applied on top of any orders placed while you edit."
								: "Units available to sell."
						}
						label="Stock Quantity"
						name="stock"
						placeholder="0"
						required
						step="1"
						type="number"
					/>
					{stockMoved ? (
						<p className="mt-2 rounded-base bg-brand-50 px-3 py-2 text-[12px] text-brand-700" role="status">
							Live stock is now <strong>{liveStock}</strong> ({stockMoved > 0 ? "+" : ""}
							{stockMoved} since you opened this page). Saving keeps those
							changes and adds your adjustment to them.
						</p>
					) : null}
				</div>
				<p className="text-[12px] text-ink-400">
					Barcodes (UPC, EAN, ISBN) go in the SEO tab&apos;s GTIN field, where
					Google reads them.
				</p>
			</div>
		</Card>
	);
}

function ShippingSection({ product }: { product?: AdminProductDetail }) {
	return (
		<Card title="Shipping">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field
					defaultValue={numberText(product?.weightKg)}
					help="Package weight in kilograms."
					label="Weight (kg)"
					name="weight"
					placeholder="0.00"
					step="0.001"
					type="number"
				/>
				<Field
					defaultValue={numberText(product?.widthCm)}
					help="Package width in centimetres."
					label="Width (cm)"
					name="width"
					placeholder="0.00"
					type="number"
				/>
				<Field
					defaultValue={numberText(product?.heightCm)}
					help="Package height in centimetres."
					label="Height (cm)"
					name="height"
					placeholder="0.00"
					type="number"
				/>
				<Field
					defaultValue={numberText(product?.lengthCm)}
					help="Package length in centimetres."
					label="Length (cm)"
					name="length"
					placeholder="0.00"
					type="number"
				/>
			</div>
		</Card>
	);
}

function ProductDetailsAdvanced({ product }: { product?: AdminProductDetail }) {
	return (
		<Card title="Product Specifications">
			<div className="space-y-4">
				<TextAreaField
					defaultValue={product?.specifications}
					help="Use semicolon-separated pairs for storefront specification rows."
					label="Specification Details"
					name="specifications"
					placeholder="Brand: Beats; Model: Studio Buds; Material: Plastic; Warranty: 1 year"
				/>
				<TextAreaField
					defaultValue={product?.reviewVideoUrls.join("\n")}
					help="Full https:// links to review videos, one per line (up to 20)."
					label="Review Video URLs"
					name="review_videos"
					placeholder="https://example.com/video"
				/>
			</div>
		</Card>
	);
}

const reviewStatusClass: Record<AdminProductReview["status"], string> = {
	approved: "text-success-600",
	draft: "text-ink-400",
	pending: "text-warning-600",
};

function ReviewsPanel({
	productId,
	productName,
}: {
	productId?: string;
	productName: string;
}) {
	if (!productId) {
		return (
			<Card title="Review Overview">
				<p className="text-[13px] text-ink-400">
					Reviews become available once this product has been saved.
				</p>
			</Card>
		);
	}

	return <ReviewsPanelContent productId={productId} productName={productName} />;
}

function ReviewsPanelContent({
	productId,
	productName,
}: {
	productId: string;
	productName: string;
}) {
	const { data, error, lastEventAt, refresh, loading, hasData } = useRealtimeResource<
		AdminProductReview[]
	>({
		endpoint: `/api/admin/products/${productId}/reviews`,
		fallbackData: [],
		topics: ["reviews"],
	});
	const [pendingActionId, setPendingActionId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [generateOpen, setGenerateOpen] = useState(false);

	async function updateStatus(
		id: string,
		status: "approved" | "pending",
	) {
		setPendingActionId(id);
		setActionError(null);

		try {
			const response = await fetch("/api/admin/reviews", {
				body: JSON.stringify({ id, status }),
				cache: "no-store",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			});
			const payload = (await response.json().catch(() => ({}))) as {
				error?: { message?: string };
			};

			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Unable to update review.");
			}

			await refresh();
		} catch (requestError) {
			setActionError(
				requestError instanceof Error
					? requestError.message
					: "Unable to update review.",
			);
		} finally {
			setPendingActionId(null);
		}
	}

	const total = data.length;
	const approved = data.filter((review) => review.status === "approved").length;
	const pending = data.filter((review) => review.status === "pending").length;

	return (
		<div className="space-y-4">
			<Card
				title="Review Overview"
				titleEnd={
					<button
						className="inline-flex h-9 items-center gap-2 rounded-base bg-brand-600 px-3 text-[13px] font-semibold text-white hover:bg-brand-700"
						onClick={() => setGenerateOpen(true)}
						type="button"
					>
						<Icon className="h-4 w-4" name="sparkles" />
						Generate Reviews
					</button>
				}
			>
				<DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
					layout="table" count={4} label="Loading product reviews">
				<LiveDataStatus error={error} lastEventAt={lastEventAt} />
				<div className="grid gap-4 sm:grid-cols-3">
					{[
						["Total Reviews", String(total), "text-ink-900"],
						["Approved", String(approved), "text-success-600"],
						["Pending", String(pending), "text-warning-600"],
					].map(([label, value, valueClass]) => (
						<div
							className="rounded-base border border-surface-line bg-surface-body p-4"
							key={label}
						>
							<p className="text-[13px] text-ink-400">{label}</p>
							<p className={cn("mt-2 text-[22px] font-semibold", valueClass)}>
								{value}
							</p>
						</div>
					))}
				</div>
				{actionError ? (
					<p className="mt-4 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
						{actionError}
					</p>
				) : null}
				{total === 0 ? (
					<p className="mt-6 text-[13px] text-ink-400">
						No customers have reviewed this product yet.
					</p>
				) : (
					<div className="dashboard-scrollbar mt-6 overflow-x-auto rounded-base border border-surface-line">
						<table className="w-full min-w-[680px] text-left text-[14px]">
							<thead className="border-b border-surface-line bg-surface-muted">
								<tr>
									<th className="px-4 py-3 text-[13px] font-semibold text-ink-500">
										Customer
									</th>
									<th className="px-4 py-3 text-[13px] font-semibold text-ink-500">
										Rating
									</th>
									<th className="px-4 py-3 text-[13px] font-semibold text-ink-500">
										Review
									</th>
									<th className="px-4 py-3 text-[13px] font-semibold text-ink-500">
										Date
									</th>
									<th className="px-4 py-3 text-[13px] font-semibold text-ink-500">
										Status
									</th>
									<th className="px-4 py-3 text-right text-[13px] font-semibold text-ink-500">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-surface-line">
								{data.map((review) => (
									<tr key={review.id}>
										<td className="px-4 py-3 font-semibold text-ink-900">
											{review.customerName}
										</td>
										<td className="px-4 py-3 text-warning-500">
											{review.rating}/5
										</td>
										<td className="max-w-xs px-4 py-3 text-ink-600">
											{review.review}
										</td>
										<td className="px-4 py-3 text-ink-500">
											{review.createdAt}
										</td>
										<td
											className={cn(
												"px-4 py-3 font-semibold",
												reviewStatusClass[review.status],
											)}
										>
											{review.status.charAt(0).toUpperCase() +
												review.status.slice(1)}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex justify-end gap-2">
												{review.status !== "approved" ? (
													<button
														className="rounded-base border border-surface-line px-3 py-1.5 text-[13px] font-semibold text-success-600 hover:bg-success-50 disabled:opacity-50"
														disabled={pendingActionId === review.id}
														onClick={() => void updateStatus(review.id, "approved")}
														type="button"
													>
														Approve
													</button>
												) : null}
												{review.status !== "pending" ? (
													<button
														className="rounded-base border border-surface-line px-3 py-1.5 text-[13px] font-semibold text-warning-600 hover:bg-warning-50 disabled:opacity-50"
														disabled={pendingActionId === review.id}
														onClick={() => void updateStatus(review.id, "pending")}
														type="button"
													>
														Unapprove
													</button>
												) : null}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				</DataBoundary>
			</Card>
			{generateOpen ? (
				<GenerateReviewsModal
					onClose={() => setGenerateOpen(false)}
					onGenerated={refresh}
					product={{ id: productId, name: productName }}
				/>
			) : null}
		</div>
	);
}

function WeeklySales() {
	return (
		<Card title="Weekly Sales" titleTag="h3">
			<p className="text-[13px] text-ink-400">
				No data available. Sales data will begin capturing once product has been
				published.
			</p>
		</Card>
	);
}

const shortDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });

function SalesSummary({
	error,
	lastEventAt,
	live,
}: {
	error: string | null;
	lastEventAt: Date | null;
	live: AdminProductLiveState | null;
}) {
	if (!live) {
		return (
			<Card title="Last 7 Days" titleTag="h3">
				<p className="text-[13px] text-ink-400">
					{error ? `Live sales unavailable: ${error}` : "Loading live sales..."}
				</p>
			</Card>
		);
	}

	const { days, previousRevenue, revenue, units } = live.sales;
	const peak = Math.max(...days.map((day) => day.revenue), 0);
	const change = previousRevenue > 0
		? Math.round(((revenue - previousRevenue) / previousRevenue) * 1000) / 10
		: null;

	return (
		<Card
			title="Last 7 Days"
			titleEnd={
				<span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success-600" title={lastEventAt ? `Updated ${lastEventAt.toLocaleTimeString()}` : "Live"}>
					<span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
					Live
				</span>
			}
			titleTag="h3"
		>
			<div className="flex items-center gap-2">
				<p className="text-[30px] font-semibold leading-none text-ink-900">
					{money.format(revenue)}
				</p>
				{change !== null ? (
					<span
						className={cn(
							"rounded-full px-2 py-0.5 text-[12px] font-semibold",
							change >= 0 ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500",
						)}
						title="Compared with the 7 days before"
					>
						{change >= 0 ? "+" : ""}
						{change}%
					</span>
				) : null}
			</div>
			<p className="mt-2 text-[13px] font-semibold text-ink-400">
				{units} {units === 1 ? "unit" : "units"} sold · {money.format(revenue / 7)} / day
			</p>
			<div className="mt-6 flex h-14 items-end justify-between gap-2" aria-label="Daily revenue, last 7 days" role="img">
				{days.map((day) => (
					<span className="flex flex-1 flex-col items-center gap-1" key={day.date} title={`${day.date}: ${money.format(day.revenue)} (${day.units} sold)`}>
						<span
							className={cn("w-3 rounded-full", day.revenue > 0 ? "bg-brand-500" : "bg-surface-line")}
							style={{ height: `${peak > 0 ? Math.max(4, (day.revenue / peak) * 40) : 4}px` }}
						/>
						<span className="text-[10px] text-ink-400">{shortDay.format(new Date(`${day.date}T00:00:00Z`)).slice(0, 2)}</span>
					</span>
				))}
			</div>
			<p className="mt-4 text-[12px] text-ink-400">
				Excludes cancelled and failed orders. Live stock: {live.stock}.
			</p>
		</Card>
	);
}

type FormGuideDrawerProps = {
	onClose: () => void;
};

function FormGuideDrawer({ onClose }: FormGuideDrawerProps) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	return (
		<div
			aria-labelledby="product-form-guide-title"
			aria-modal="true"
			className="fixed inset-0 z-50 flex justify-end"
			role="dialog"
		>
			<button
				aria-label="Close form guide"
				className="absolute inset-0 bg-ink-900/45"
				onClick={onClose}
				type="button"
			/>
			<aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-surface-card shadow-lift">
				<div className="flex items-start justify-between gap-4 border-b border-surface-line px-5 py-4">
					<div>
						<p className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
							Form Guide
						</p>
						<h2 className="mt-1 text-[18px] font-semibold text-ink-900" id="product-form-guide-title">
							Compact editing checklist
						</h2>
						<p className="mt-1 text-[13px] text-ink-500">
							Everything on every tab is saved together.
						</p>
					</div>
					<button
						aria-label="Close form guide"
						autoFocus
						className="grid h-9 w-9 shrink-0 place-items-center rounded-base border border-surface-line text-ink-500 hover:bg-surface-muted hover:text-ink-900"
						onClick={onClose}
						type="button"
					>
						<Icon className="h-4 w-4" name="x" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto px-5 py-5">
					<div className="space-y-4">
						<section className="rounded-base border border-surface-line p-4">
							<h3 className="text-[14px] font-semibold text-ink-900">
								Before publishing
							</h3>
							<ul className="mt-3 space-y-2 text-[13px] text-ink-500">
								{[
									"Name, regular price and stock quantity are filled in.",
									"At least one gallery image is uploaded - the first is the thumbnail.",
									"The price preview shows what customers will actually pay.",
									"The SEO tab's search preview reads well.",
								].map((item) => (
									<li className="flex gap-2" key={item}>
										<Icon
											className="mt-0.5 h-4 w-4 text-success-500"
											name="check"
										/>
										{item}
									</li>
								))}
							</ul>
						</section>
						<section className="rounded-base border border-surface-line p-4">
							<h3 className="text-[14px] font-semibold text-ink-900">
								Working with others
							</h3>
							<p className="mt-2 text-[13px] leading-6 text-ink-500">
								This page watches the product live. Orders placed while you
								edit adjust stock without conflicting with your changes. If
								someone else saves the product, you&apos;ll be told before
								anything is overwritten.
							</p>
						</section>
						<section className="rounded-base border border-surface-line p-4">
							<h3 className="text-[14px] font-semibold text-ink-900">
								Common saves
							</h3>
							<div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-semibold text-ink-600">
								{[
									"Save as Draft first",
									"Check the SEO preview",
									"Review stock",
									"Publish",
								].map((item) => (
									<span
										className="rounded-base bg-surface-muted px-3 py-2"
										key={item}
									>
										{item}
									</span>
								))}
							</div>
						</section>
					</div>
				</div>
			</aside>
		</div>
	);
}
