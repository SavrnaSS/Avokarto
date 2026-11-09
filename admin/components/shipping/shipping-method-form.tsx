"use client";

import Link from "next/link";
import { useState } from "react";
import {
	Field,
	FormCard,
	SelectField,
	TextAreaField,
} from "@/admin/components/forms/admin-form-primitives";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import type { AdminShippingMethodDetail } from "@/lib/backend/admin-data";

type ShippingMethodFormProps = {
	method?: AdminShippingMethodDetail;
	mode: "add" | "edit";
};

export function ShippingMethodForm({ method, mode }: ShippingMethodFormProps) {
	const [status, setStatus] = useState<string>(method?.status ?? "active");
	const [name, setName] = useState(method?.name ?? "New Shipping Method");
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/shipping-methods",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.shippingMethods,
	});
	const title = mode === "edit" ? "Edit Shipping Method" : "Add Shipping Method";

	return (
		<>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 max-w-full">
					<Breadcrumb
						items={[
							{ href: routes.dashboard, label: "Home" },
							{ href: routes.shippingMethods, label: "Shipping" },
							{ label: title },
						]}
					/>
					<h1 className="text-[22px] font-semibold text-ink-900">{title}</h1>
					<p className="mt-1 break-words text-[14px] text-ink-500">
						{mode === "edit"
							? "Update this shipping method's price, delivery estimate, and availability at checkout."
							: "Add a new shipping option shoppers can choose at checkout."}
					</p>
				</div>
			</div>
			<form
				className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)]"
				id={`${mode}-shipping-method-form`}
				onSubmit={(event) => void onSubmit(event)}
			>
				<div className="min-w-0 space-y-4 xl:order-1">
					<FormCard title="Preview">
						<div className="rounded-card border border-dashed border-brand-200 bg-brand-50 p-4">
							<div className="flex items-start justify-between gap-3">
								<span className="grid h-10 w-10 place-items-center rounded-base bg-surface-card text-brand-600 shadow-card">
									<Icon className="h-5 w-5" name="truck" />
								</span>
								<StatusBadge
									className={
										status === "active"
											? "bg-success-50 text-success-600"
											: "bg-surface-muted text-ink-600"
									}
									label={capitalize(status)}
								/>
							</div>
							<p className="mt-4 break-words text-[16px] font-semibold text-ink-900">
								{name || "New Shipping Method"}
							</p>
						</div>
					</FormCard>
					<FormCard title="Status">
						<SelectField
							defaultValue={status}
							help="Inactive methods are hidden from checkout but stay in past order history."
							label="Status"
							name="status"
							onChange={setStatus}
							options={["active", "inactive"]}
						/>
					</FormCard>
					<FormCard title="Sort Order">
						<Field
							defaultValue={method ? String(method.sortOrder) : "0"}
							help="Lower numbers appear first at checkout."
							label="Sort Order"
							name="sort_order"
							type="number"
						/>
					</FormCard>
				</div>
				<div className="min-w-0 space-y-4 xl:order-2">
					<FormCard title="General">
						<div className="grid gap-4 md:grid-cols-2">
							{mode === "edit" ? (
								// name is the key mutateShippingMethod upserts on - changing
								// it here would silently create a second method instead of
								// updating this one, so it's locked once a method exists.
								<label className="block md:col-span-2">
									<span className="text-[13px] font-semibold text-ink-700">
										Name
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-muted px-3 font-semibold text-ink-500"
										disabled
										value={name}
									/>
									<input name="name" type="hidden" value={name} />
									<p className="mt-1 text-[12px] text-ink-400">
										The name can&apos;t be changed after a method is created.
									</p>
								</label>
							) : (
								<label className="block md:col-span-2">
									<span className="text-[13px] font-semibold text-ink-700">
										Name <span className="text-danger-500">*</span>
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] focus:border-brand-600"
										name="name"
										onChange={(event) => setName(event.target.value)}
										placeholder="Standard Shipping"
										required
										value={name}
									/>
								</label>
							)}
							<TextAreaField
								className="md:col-span-2"
								defaultValue={method?.description}
								label="Description"
								name="description"
								placeholder="Shown to shoppers at checkout"
							/>
							<Field
								defaultValue={method?.carrier}
								label="Carrier"
								name="carrier"
								placeholder="UPS, FedEx, USPS..."
							/>
							<Field
								defaultValue={method ? String(method.price) : "0"}
								label="Price"
								name="price"
								placeholder="10"
								required
								type="number"
							/>
						</div>
					</FormCard>
					<FormCard title="Delivery Estimate">
						<div className="grid gap-4 md:grid-cols-2">
							<Field
								defaultValue={
									method?.minDeliveryDays != null
										? String(method.minDeliveryDays)
										: undefined
								}
								label="Minimum Days"
								name="min_delivery_days"
								placeholder="5"
								type="number"
							/>
							<Field
								defaultValue={
									method?.maxDeliveryDays != null
										? String(method.maxDeliveryDays)
										: undefined
								}
								label="Maximum Days"
								name="max_delivery_days"
								placeholder="7"
								type="number"
							/>
						</div>
					</FormCard>
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
						href={routes.shippingMethods}
					>
						Cancel
					</Link>
					<button
						className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
						disabled={submitting}
						form={`${mode}-shipping-method-form`}
						type="submit"
					>
						<Icon className="h-4 w-4" name="save" />
						{submitting ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>
		</>
	);
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
