"use client";

import Link from "next/link";
import { useState } from "react";
import {
	AssignmentRules,
	FormActions,
	Tabs,
} from "@/admin/components/catalog/category-form";
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
import { cn } from "@/admin/utils/cn";
import type { AdminBrandDetail } from "@/lib/backend/admin-data";

type BrandFormProps = {
	brand?: AdminBrandDetail;
	mode: "add" | "edit";
};

type BrandTab = "general" | "rules" | "seo";

const statusFromValue: Record<string, string> = {
	archived: "Archived",
	draft: "Draft",
	published: "Published",
};

function initialsOf(name: string) {
	return (
		name
			.split(/\s+/)
			.map((part) => part[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() || "?"
	);
}

export function BrandForm({ brand, mode }: BrandFormProps) {
	const [tab, setTab] = useState<BrandTab>("seo");
	const [status, setStatus] = useState(
		statusFromValue[brand?.status ?? ""] ?? "Draft",
	);
	const [guideOpen, setGuideOpen] = useState(false);
	const formId = `${mode}-brand-form`;
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/brands",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.brands,
	});
	const title = mode === "edit" ? "Edit Brand" : "Add Brand";
	const description =
		mode === "edit"
			? "Update brand profile, logo, storefront visibility, SEO meta, and product rules."
			: "Create a brand profile with logo, storefront visibility, SEO meta, and product assignment rules.";

	return (
		<>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 max-w-full">
					<Breadcrumb
						items={[
							{ href: routes.dashboard, label: "Home" },
							{ href: routes.brands, label: "Brands" },
							{ label: title },
						]}
					/>
					<h1 className="text-[22px] font-semibold text-ink-900">{title}</h1>
					<p className="mt-1 break-words text-[14px] text-ink-500">
						{description}
					</p>
				</div>
				<button
					className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted cursor-pointer"
					onClick={() => setGuideOpen(true)}
					type="button"
				>
					<Icon className="h-4 w-4" name="panel-left" />
					Form Guide
				</button>
			</div>
			<form
				className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)]"
				id={formId}
				onSubmit={(event) => void onSubmit(event)}
			>
				<aside className="min-w-0 space-y-4 xl:order-1">
					<FormCard title="Brand Logo">
						<label className="group mx-auto grid h-36 w-36 cursor-pointer place-items-center rounded-base bg-brand-50 text-[28px] font-semibold text-brand-600 shadow-soft transition-shadow hover:shadow-lift">
							{brand ? (
								initialsOf(brand.name)
							) : (
								<Icon className="h-10 w-10 text-brand-300" name="image" />
							)}
							<input
								accept="image/*"
								aria-label="Upload brand logo"
								className="sr-only"
								type="file"
							/>
						</label>
						<p className="mt-4 text-center text-[12px] text-ink-400">
							Upload a square logo for brand tiles and filters.
						</p>
					</FormCard>
					<FormCard title="Status">
						<span
							className={cn(
								"mb-3 block h-2.5 w-2.5 rounded-full",
								status === "Published" ? "bg-success-500" : "bg-warning-500",
							)}
						/>
						<SelectField
							defaultValue={status}
							help="Set the brand status."
							label="Status"
							name="status"
							onChange={setStatus}
							options={["Published", "Draft", "Archived"]}
						/>
					</FormCard>
					<FormCard title="Storefront Placement">
						<SelectField
							defaultValue={brand?.visibility ?? "Standard"}
							help="Controls brand visibility on storefront modules."
							label="Visibility"
							name="visibility"
							options={["Featured", "Standard", "Hidden"]}
						/>
					</FormCard>
					<FormCard title="Brand Links">
						<div className="space-y-4">
							<Field
								defaultValue={brand?.website}
								label="Website"
								name="website"
								placeholder="https://example.com"
							/>
							<Field
								defaultValue={brand?.supportEmail}
								label="Support Email"
								name="support_email"
								placeholder="support@example.com"
								type="email"
							/>
						</div>
					</FormCard>
					{mode === "edit" ? (
						<FormCard title="Products">
							<p className="text-[30px] font-semibold leading-none text-ink-900">
								{brand?.productCount ?? 0}
							</p>
							<p className="mt-2 text-[13px] text-ink-400">Products assigned</p>
							<Link
								className="mt-4 inline-flex h-9 items-center gap-2 rounded-base bg-brand-50 px-3 text-[13px] font-semibold text-brand-600 hover:bg-brand-100"
								href={routes.products}
							>
								View products
								<Icon className="h-3.5 w-3.5" name="arrow-up-right" />
							</Link>
						</FormCard>
					) : null}
				</aside>
				<div className="min-w-0 space-y-4 xl:order-2">
					<Tabs
						active={tab}
						onChange={(value) => setTab(value)}
						tabs={["seo", "rules"]}
					/>
					{/*
					 * Always mounted, unlike the seo/rules sections below - Save
					 * Changes isn't tied to any one tab, so if name/slug only
					 * existed in the DOM while "general" was selected, saving from
					 * another tab would submit them blank and mutateBrand would
					 * create a brand new "Untitled Brand" instead of updating this
					 * one.
					 */}
					<FormCard title="General">
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									defaultValue={brand?.name}
									label="Brand Name"
									name="name"
									placeholder="Brand name"
									required
								/>
								<Field
									defaultValue={brand?.slug}
									help="Changing this moves the brand to a new URL."
									label="Slug"
									name="slug"
									placeholder="brand-slug"
								/>
							</div>
							<RichTextArea
								defaultValue={brand?.description}
								help="Set a description to the brand for better visibility."
								label="Description"
								name="description"
							/>
						</div>
					</FormCard>
					<FormCard title="Brand Details">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								defaultValue={brand?.vendorCode}
								label="Vendor Code"
								name="vendor_code"
								placeholder="BR-001"
							/>
							<Field
								defaultValue={brand?.country}
								label="Country"
								name="country"
								placeholder="Country"
							/>
						</div>
					</FormCard>
					{tab === "seo" ? (
						<FormCard title="Meta Options">
							<div className="space-y-4">
								<Field
									defaultValue={brand?.metaTitle}
									label="Meta Tag Title"
									name="meta_title"
									placeholder="Meta tag title"
								/>
								<RichTextArea
									defaultValue={brand?.metaDescription}
									help="Set a meta tag description to improve SEO ranking."
									label="Meta Description"
									name="meta_description"
								/>
								<Field
									defaultValue={brand?.metaKeywords}
									label="Meta Keywords"
									name="meta_keywords"
									placeholder="brand, product, keyword"
								/>
							</div>
						</FormCard>
					) : null}
					{tab === "rules" ? (
						<AssignmentRules title="Product Assignment" />
					) : null}
				</div>
			</form>
			<FormActions
				error={error}
				formId={formId}
				href={routes.brands}
				submitting={submitting}
			/>
			{guideOpen ? (
				<FormGuideDrawer onClose={() => setGuideOpen(false)} />
			) : null}
		</>
	);
}
