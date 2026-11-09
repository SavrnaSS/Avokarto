"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	Field,
	FormCard,
	FormGuideDrawer,
	SelectField,
	TextAreaField,
} from "@/admin/components/forms/admin-form-primitives";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import { cn } from "@/admin/utils/cn";
import type { AdminCouponDetail } from "@/lib/backend/admin-data";

type CouponFormProps = {
	coupon?: AdminCouponDetail;
	mode: "add" | "edit";
};

type CouponTab = "discount" | "eligibility" | "usage";

const tabs: CouponTab[] = ["discount", "eligibility", "usage"];

export function CouponForm({ coupon, mode }: CouponFormProps) {
	const [tab, setTab] = useState<CouponTab>("discount");
	const [guideOpen, setGuideOpen] = useState(false);
	const [status, setStatus] = useState<string>(coupon?.status ?? "active");
	const [code, setCode] = useState(coupon?.code ?? "NEWCODE");
	const [discountType, setDiscountType] = useState<string>(
		coupon?.type ?? "percentage",
	);
	const [discountValue, setDiscountValue] = useState(
		coupon ? String(coupon.discountValue) : "10",
	);
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/coupons",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.coupons,
	});
	const title = mode === "edit" ? "Edit Coupon" : "Add Coupon";
	const discountPreview = useMemo(() => {
		if (discountType === "shipping") {
			return "Free shipping for eligible orders";
		}
		return discountType === "fixed"
			? `$${discountValue || "10"} off selected products`
			: `${discountValue || "10"}% off selected products`;
	}, [discountType, discountValue]);

	return (
		<>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 max-w-full">
					<Breadcrumb
						items={[
							{ href: routes.dashboard, label: "Home" },
							{ href: routes.coupons, label: "Marketing" },
							{ label: title },
						]}
					/>
					<h1 className="text-[22px] font-semibold text-ink-900">{title}</h1>
					<p className="mt-1 break-words text-[14px] text-ink-500">
						{mode === "edit"
							? "Update coupon campaign details, discount rules, usage limits, and validity window."
							: "Create a coupon code with discount rules, usage limits, and campaign scheduling."}
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
				id={`${mode}-coupon-form`}
				onSubmit={(event) => void onSubmit(event)}
			>
				<div className="min-w-0 space-y-4 xl:order-1">
					<FormCard title="Coupon Preview">
						<div className="rounded-card border border-dashed border-brand-200 bg-brand-50 p-4">
							<div className="flex items-start justify-between gap-3">
								<span className="grid h-10 w-10 place-items-center rounded-base bg-surface-card text-brand-600 shadow-card">
									<Icon className="h-5 w-5" name="badge-percent" />
								</span>
								<StatusBadge
									className="bg-success-50 text-success-600"
									label={capitalize(status)}
								/>
							</div>
							<p className="mt-4 text-[12px] font-semibold uppercase text-brand-600">
								Coupon Code
							</p>
							<p className="mt-1 break-all text-[22px] font-semibold text-ink-900">
								{code || "NEWCODE"}
							</p>
							<p className="mt-2 text-[13px] text-ink-500">{discountPreview}</p>
						</div>
						<p className="mt-3 text-[12px] text-ink-400">
							Preview updates from coupon code and discount fields.
						</p>
					</FormCard>
					<FormCard title="Status">
						<span
							className={cn(
								"mb-3 block h-2.5 w-2.5 rounded-full",
								status === "active"
									? "bg-success-500"
									: status === "scheduled"
										? "bg-brand-600"
										: status === "draft"
											? "bg-warning-500"
											: "bg-ink-300",
							)}
						/>
						<SelectField
							defaultValue={status}
							help="Set the coupon availability state."
							label="Status"
							name="status"
							onChange={setStatus}
							options={["active", "scheduled", "draft", "expired"]}
						/>
					</FormCard>
					{mode === "edit" && coupon ? (
						<FormCard title="Usage Summary">
							<div className="space-y-3 text-[14px]">
								<div className="flex items-center justify-between">
									<span className="text-ink-500">Redeemed</span>
									<span className="font-semibold text-ink-900">
										{coupon.usedCount.toLocaleString("en-US")}
										{coupon.usageLimit
											? ` / ${coupon.usageLimit.toLocaleString("en-US")}`
											: " (no limit)"}
									</span>
								</div>
								{coupon.usageLimit ? (
									<div className="h-2 overflow-hidden rounded-full bg-surface-muted">
										<span
											className="block h-full rounded-full bg-brand-600"
											style={{
												width: `${Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))}%`,
											}}
										/>
									</div>
								) : null}
							</div>
						</FormCard>
					) : null}
					<FormCard title="Schedule">
						<Field
							defaultValue={coupon?.startDate}
							label="Start Date"
							name="start_date"
							type="date"
						/>
						<div className="mt-4">
							<Field
								defaultValue={coupon?.endDate}
								label="End Date"
								name="end_date"
								type="date"
							/>
						</div>
					</FormCard>
				</div>
				<div className="min-w-0 space-y-4 xl:order-2">
					<div
						className="flex flex-wrap gap-2"
						role="tablist"
						aria-label="Coupon form sections"
					>
						{tabs.map((item) => (
							<button
								aria-selected={tab === item}
								className={cn(
									"inline-flex h-9 items-center rounded-base border px-4 pb-0.5 text-[13px] font-semibold",
									tab === item
										? "border-brand-600 bg-brand-600 text-white"
										: "border-surface-line text-ink-600 hover:bg-surface-muted",
								)}
								key={item}
								onClick={() => setTab(item)}
								role="tab"
								type="button"
							>
								{capitalize(item)}
							</button>
						))}
					</div>
					{/*
					 * Always mounted, unlike the discount/eligibility/usage
					 * sections below - Save Changes isn't tied to any one tab,
					 * so if name/code only existed in the DOM while "general"
					 * was selected, saving from another tab would submit them
					 * blank and mutateCoupon would create a brand new
					 * "Untitled" coupon instead of updating this one.
					 */}
					<FormCard title="General">
						<div className="grid gap-4 md:grid-cols-2">
							<Field
								className="md:col-span-2"
								defaultValue={coupon?.name}
								help="Use a clear campaign name for internal reporting."
								label="Coupon Name"
								name="name"
								placeholder="Coupon name"
								required
							/>
							{mode === "edit" ? (
								// code is the key mutateCoupon upserts on - changing it here
								// would silently create a second coupon instead of updating
								// this one, so it's locked once a coupon exists.
								<label className="block">
									<span className="text-[13px] font-semibold text-ink-700">
										Coupon Code
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-muted px-3 font-semibold uppercase text-ink-500"
										disabled
										value={code}
									/>
									<input name="code" type="hidden" value={code} />
									<p className="mt-1 text-[12px] text-ink-400">
										The code can&apos;t be changed after a coupon is created.
									</p>
								</label>
							) : (
								<label className="block">
									<span className="text-[13px] font-semibold text-ink-700">
										Coupon Code <span className="text-danger-500">*</span>
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 font-semibold uppercase text-ink-900 placeholder:text-ink-400 focus:border-brand-600"
										name="code"
										onChange={(event) =>
											setCode(event.target.value.trim().toUpperCase())
										}
										placeholder="NEWCODE"
										required
										value={code}
									/>
								</label>
							)}
							<TextAreaField
								className="md:col-span-2"
								defaultValue={coupon?.summary}
								label="Description"
								name="description"
								placeholder="Short internal note about this coupon"
							/>
						</div>
					</FormCard>
					{tab === "discount" ? (
						<FormCard title="Discount">
							<div className="grid gap-4 md:grid-cols-2">
								<SelectField
									defaultValue={discountType}
									label="Discount Type"
									name="discount_type"
									onChange={setDiscountType}
									options={["percentage", "fixed", "shipping"]}
								/>
								<label
									className={cn(
										"block",
										discountType === "shipping" ? "opacity-50" : "",
									)}
								>
									<span className="text-[13px] font-semibold text-ink-700">
										Discount Value
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] focus:border-brand-600"
										disabled={discountType === "shipping"}
										min="0"
										name="discount_value"
										onChange={(event) => setDiscountValue(event.target.value)}
										placeholder="10"
										type="number"
										value={discountValue}
									/>
								</label>
								<Field
									defaultValue={coupon ? String(coupon.minimumOrder) : undefined}
									label="Minimum Order Amount"
									name="minimum_order"
									placeholder="0"
									type="number"
								/>
								<Field
									defaultValue={
										coupon?.maximumDiscount != null
											? String(coupon.maximumDiscount)
											: undefined
									}
									label="Maximum Discount"
									name="maximum_discount"
									placeholder="No limit"
									type="number"
								/>
							</div>
						</FormCard>
					) : null}
					{tab === "eligibility" ? (
						<FormCard title="Eligibility">
							<p className="text-[13px] text-ink-500">
								Not yet enforced at checkout - eligibility rules are planned but
								this coupon currently applies storewide once redeemed.
							</p>
						</FormCard>
					) : null}
					{tab === "usage" ? (
						<FormCard title="Usage Limits">
							<div className="grid gap-4 md:grid-cols-2">
								<Field
									defaultValue={coupon?.usageLimit ? String(coupon.usageLimit) : undefined}
									label="Total Usage Limit"
									name="usage_limit"
									placeholder="500"
									type="number"
								/>
								<label className="flex items-center gap-2 text-[13px] font-semibold text-ink-700 md:col-span-2">
									<input
										className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
										name="combine_with_other_discounts"
										type="checkbox"
									/>
									Allow this coupon with other discounts
								</label>
							</div>
						</FormCard>
					) : null}
				</div>
			</form>
			<div className="mt-6 border-t border-surface-line pt-5">
				{error ? (
					<p className="mb-4 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
						{error}
					</p>
				) : null}
				<div className="flex items-center justify-end gap-3">
				<Link
					className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-5 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted"
					href={routes.coupons}
				>
					Cancel
				</Link>
				<button
					className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
					disabled={submitting}
					form={`${mode}-coupon-form`}
					type="submit"
				>
					<Icon className="h-4 w-4" name="save" />
					{submitting ? "Saving..." : "Save Changes"}
				</button>
				</div>
			</div>
			{guideOpen ? (
				<FormGuideDrawer onClose={() => setGuideOpen(false)} />
			) : null}
		</>
	);
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
