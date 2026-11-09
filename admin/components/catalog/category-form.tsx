"use client";

import Link from "next/link";
import { useState } from "react";
import {
	Field,
	FormCard,
	FormGuideDrawer,
	RichTextArea,
	SelectField,
} from "@/admin/components/forms/admin-form-primitives";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import { useImageUpload } from "@/admin/hooks/use-image-upload";
import { cn } from "@/admin/utils/cn";
import type { AdminCategoryDetail } from "@/lib/backend/admin-data";

type CategoryFormProps = {
	category?: AdminCategoryDetail;
	mode: "add" | "edit";
};

type Tab = "general" | "rules" | "seo";

const statusFromValue: Record<string, string> = {
	draft: "Draft",
	published: "Published",
};

export function CategoryForm({ category, mode }: CategoryFormProps) {
	const [tab, setTab] = useState<Tab>("seo");
	const [status, setStatus] = useState(
		statusFromValue[category?.status ?? ""] ?? "Draft",
	);
	const [guideOpen, setGuideOpen] = useState(false);
	const formId = `${mode}-category-form`;
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/categories",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.categories,
	});
	const thumb = useImageUpload(category?.imageUrl ?? "");

	const title = mode === "edit" ? "Edit Category" : "Add Category";
	const description =
		mode === "edit"
			? "Update merchandising, SEO meta, thumbnail, and product assignment rules."
			: "Create a merchandising group with thumbnail, SEO meta, and product assignment rules.";

	return (
		<>
			<FormHeader
				current={title}
				description={description}
				onGuideOpen={() => setGuideOpen(true)}
				title={title}
			/>
			<form
				className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)]"
				id={formId}
				onSubmit={(event) => void onSubmit(event)}
			>
				{category ? (
					<>
						<input name="category_id" type="hidden" value={category.id} />
						<input name="original_slug" type="hidden" value={category.slug} />
					</>
				) : null}
				<aside className="min-w-0 space-y-4 xl:order-1">
					<FormCard title="Thumbnail">
						<div className="flex flex-col items-center text-center">
							<input name="image_url" type="hidden" value={thumb.url} />
							<label className="group relative grid h-36 w-36 cursor-pointer place-items-center overflow-hidden rounded-base bg-surface-card shadow-soft transition-shadow hover:shadow-lift">
								<span className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-surface-card text-ink-400 shadow-card transition-colors group-hover:text-brand-600">
									<Icon className="h-3.5 w-3.5" name="pencil" />
								</span>
								{thumb.preview ? (
									// Plain img, not next/image - the preview can briefly be
									// a blob: URL while the real upload is in flight, which
									// the image optimizer can't fetch.
									// eslint-disable-next-line @next/next/no-img-element
									<img
										alt="Category thumbnail preview"
										className={cn(
											"absolute inset-0 h-full w-full object-cover p-2",
											thumb.uploading ? "opacity-50" : "",
										)}
										src={thumb.preview}
									/>
								) : (
									<span className="grid h-20 w-20 -rotate-6 place-items-center rounded-base bg-brand-50 text-brand-200">
										<Icon
											className="h-10 w-10 transition-colors group-hover:text-brand-400"
											name="image"
										/>
									</span>
								)}
								{thumb.uploading ? (
									<span className="absolute inset-0 grid place-items-center bg-ink-900/10">
										<Icon
											className="h-6 w-6 animate-spin text-brand-600"
											name="loader"
										/>
									</span>
								) : null}
								<input
									accept=".png,.jpg,.jpeg,.webp"
									aria-label="Upload category thumbnail"
									className="sr-only"
									onChange={(event) => {
										const file = event.target.files?.[0];
										if (file) {
											void thumb.upload(file);
										}
									}}
									type="file"
								/>
							</label>
							{thumb.error ? (
								<p className="mt-3 text-[12px] font-semibold text-danger-500">
									{thumb.error}
								</p>
							) : null}
							<p className="mt-4 text-[12px] text-ink-400">
								Set the category thumbnail image. Only image files are accepted.
							</p>
						</div>
					</FormCard>
					<FormCard
						title="Status"
						titleEnd={
							<span
								aria-label={`Current status: ${status}`}
								className={cn(
									"h-2.5 w-2.5 rounded-full",
									status === "Published" ? "bg-success-500" : "bg-warning-500",
								)}
								role="status"
							/>
						}
					>
						<SelectField
							defaultValue={status}
							help="Set the category status."
							hideLabel
							label="Status"
							name="status"
							onChange={setStatus}
							options={["Published", "Draft"]}
						/>
					</FormCard>
					{mode === "edit" ? (
						<FormCard title="Category Products">
							<div className="flex items-center justify-between gap-3">
								<span className="text-[14px] text-ink-500">
									Assigned products
								</span>
								<span className="text-[18px] font-semibold text-ink-900">
									{category?.productCount ?? 0}
								</span>
							</div>
							<Link
								className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-base bg-brand-50 text-[13px] font-semibold text-brand-600 hover:bg-brand-100"
								href={routes.products}
							>
								View products
								<Icon className="h-3.5 w-3.5" name="arrow-up-right" />
							</Link>
						</FormCard>
					) : null}
					<FormCard title="Store Template">
						<SelectField
							defaultValue={category?.template || "Default template"}
							help="Assign a template from your current theme to define how the category products are displayed."
							label="Select a store template"
							name="template"
							options={[
								"Default template",
								"Featured template",
								"Compact template",
							]}
						/>
					</FormCard>
					<FormCard title="Storefront Placement">
						<Field
							defaultValue={String(category?.sortOrder ?? 100)}
							help="Lower numbers appear first. Categories with the same value are sorted by name."
							label="Display order"
							name="sort_order"
							placeholder="100"
							type="number"
						/>
					</FormCard>
				</aside>
				<div className="min-w-0 space-y-4 xl:order-2">
					<Tabs
						active={tab}
						onChange={setTab}
						tabs={["seo", "rules"]}
					/>
					{/*
					 * Always mounted, unlike the seo/rules sections below - Save
					 * Changes isn't tied to any one tab, so if name/slug only
					 * existed in the DOM while "general" was selected, saving from
					 * another tab would submit them blank and mutateCategory would
					 * create a brand new "Untitled Category" instead of updating
					 * this one.
					 */}
					<FormCard title="General">
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									defaultValue={category?.name}
									help="A category name is required and recommended to be unique."
									label="Category Name"
									name="name"
									placeholder="Category name"
									required
								/>
								<Field
									defaultValue={category?.slug}
									help="Changing this moves the category to a new URL - leave it as-is unless you mean to."
									label="Slug"
									name="slug"
									placeholder="category-slug"
								/>
							</div>
							<RichTextArea
								defaultValue={category?.description}
								help="Set a description to the category for better visibility."
								label="Description"
								name="description"
							/>
						</div>
					</FormCard>
					{tab === "seo" ? (
						<FormCard title="SEO">
							<div className="space-y-4">
								<Field
									defaultValue={category?.metaTitle}
									help="Recommended to be simple and precise keywords."
									label="Meta Tag Title"
									name="meta_title"
									placeholder="Meta tag name"
								/>
								<RichTextArea
									defaultValue={category?.description}
									help="Set a meta tag description to improve SEO ranking. Falls back to the category description above when left blank."
									label="Meta Description"
									name="meta_description"
								/>
								<Field
									defaultValue={category?.metaKeywords}
									help="Separate keywords with a comma."
									label="Meta Keywords"
									name="meta_keywords"
									placeholder="e.g. headphones, audio"
								/>
							</div>
						</FormCard>
					) : null}
					{tab === "rules" ? (
						<AssignmentRules title="Rules / Automation" />
					) : null}
				</div>
			</form>
			<FormActions
				error={error}
				formId={formId}
				href={routes.categories}
				submitting={submitting}
			/>
			{guideOpen ? (
				<FormGuideDrawer onClose={() => setGuideOpen(false)} />
			) : null}
		</>
	);
}

export function FormHeader({
	current,
	description,
	onGuideOpen,
	title,
}: {
	current: string;
	description: string;
	onGuideOpen: () => void;
	title: string;
}) {
	return (
		<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
			<div className="min-w-0 max-w-full">
				<Breadcrumb
					items={[
						{ href: routes.dashboard, label: "Home" },
						{ href: routes.categories, label: "Catalog" },
						{ label: current },
					]}
				/>
				<h1 className="text-[22px] font-semibold text-ink-900">{title}</h1>
				<p className="mt-1 break-words text-[14px] text-ink-500">
					{description}
				</p>
			</div>
			<button
				className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted cursor-pointer"
				onClick={onGuideOpen}
				type="button"
			>
				<Icon className="h-4 w-4" name="panel-left" />
				Form Guide
			</button>
		</div>
	);
}

export function Tabs({
	active,
	onChange,
	tabs,
}: {
	active: string;
	onChange: (tab: Tab) => void;
	tabs: Tab[];
}) {
	const labels: Record<Tab, string> = {
		general: "General",
		rules: "Rules",
		seo: "SEO",
	};

	return (
		<div aria-label="Form tabs" className="flex gap-2" role="tablist">
			{tabs.map((tab) => (
				<button
					aria-selected={active === tab}
					className={cn(
						"relative border px-4 pb-2 pt-1.5 text-sm! rounded-md font-semibold! transition-colors",
						active === tab
							? "bg-brand-600 border-brand-600 text-white"
							: "bg-white border-surface-line text-ink-500 hover:text-ink-700",
					)}
					key={tab}
					onClick={() => onChange(tab)}
					role="tab"
					type="button"
				>
					{labels[tab]}
				</button>
			))}
		</div>
	);
}

export function AssignmentRules({ title }: { title: string }) {
	const [method, setMethod] = useState("Manual");
	return (
		<FormCard title={title}>
			<div className="space-y-4">
				<div>
					<span className="text-[13px] font-semibold text-ink-700">
						Assignment Method
					</span>
					<div className="mt-2 grid gap-3 sm:grid-cols-2">
						{["Manual", "Automatic"].map((value) => (
							<label
								className={cn(
									"flex cursor-pointer items-center gap-3 rounded-base border px-4 py-3",
									method === value
										? "border-brand-600 bg-brand-50/60"
										: "border-surface-line hover:bg-surface-muted",
								)}
								key={value}
							>
								<input
									checked={method === value}
									className="h-4 w-4 border-surface-line text-brand-600 focus:ring-brand-600"
									name="assignment_method"
									onChange={() => setMethod(value)}
									type="radio"
									value={value}
								/>
								<span className="text-[14px] font-semibold text-ink-900">
									{value}
								</span>
							</label>
						))}
					</div>
				</div>
				{method === "Automatic" ? (
					<div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
						<SelectField
							label="Condition"
							name="condition"
							options={["Product tag", "Brand", "Price"]}
						/>
						<Field
							label="Value"
							name="condition_value"
							placeholder="e.g. audio"
						/>
						<button
							className="h-10 self-end rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted"
							type="button"
						>
							Add
						</button>
					</div>
				) : (
					<p className="rounded-base bg-surface-muted p-4 text-[13px] text-ink-500">
						Products can be assigned manually from product edit pages.
					</p>
				)}
			</div>
		</FormCard>
	);
}

export function FormActions({
	error,
	formId,
	href,
	submitting = false,
}: {
	error?: string | null;
	formId?: string;
	href: string;
	submitting?: boolean;
}) {
	return (
		<div className="mt-6 border-t border-surface-line pt-5">
			{error ? (
				<p className="mb-4 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
					{error}
				</p>
			) : null}
			<div className="flex items-center justify-end gap-3">
			<Link
				className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-5 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
				href={href}
			>
				Cancel
			</Link>
			<button
				className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
				disabled={submitting}
				form={formId}
				type="submit"
			>
				<Icon className="h-4 w-4" name="save" />
				{submitting ? "Saving..." : "Save Changes"}
			</button>
			</div>
		</div>
	);
}
