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
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";

type AttributeValue = {
	id: string;
	value: string;
};

export function AttributeForm() {
	const [values, setValues] = useState<AttributeValue[]>([
		{ id: "value-1", value: "" },
		{ id: "value-2", value: "" },
	]);
	const formId = "add-attribute-form";
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/attributes",
		redirectTo: routes.attributes,
	});

	return (
		<>
			<div className="mb-5">
				<Breadcrumb
					items={[
						{ href: routes.dashboard, label: "Home" },
						{ href: routes.attributes, label: "Attributes" },
						{ label: "Add Attribute" },
					]}
				/>
				<h1 className="text-[22px] font-semibold text-ink-900">
					Add Attribute
				</h1>
				<p className="mt-1 text-[14px] text-ink-500">
					Create a reusable product attribute and define its values.
				</p>
			</div>
			<form
				className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"
				id={formId}
				onSubmit={(event) => void onSubmit(event)}
			>
				<div className="min-w-0 space-y-4">
					<FormCard title="General">
						<div className="space-y-4">
							<Field
								help="Attribute names appear in product option and filter controls."
								label="Attribute Name"
								name="name"
								placeholder="e.g. Color"
								required
							/>
							<SelectField
								help="Choose how values should be displayed in admin forms."
								label="Display Type"
								name="display_type"
								options={["Dropdown", "Swatch", "Text"]}
								required
							/>
							<TextAreaField
								help="Optional internal description for admins."
								label="Description"
								name="description"
								placeholder="Describe how this attribute should be used."
							/>
						</div>
					</FormCard>
					<FormCard title="Values">
						<div className="space-y-3">
							{values.map((item, index) => (
								<div className="flex items-center gap-2" key={item.id}>
									<input
										aria-label={`Attribute value ${index + 1}`}
										className="h-10 flex-1 rounded-base border border-surface-line bg-surface-body px-3 text-[14px] focus:border-brand-600"
										name="values"
										onChange={(event) =>
											setValues((current) =>
												current.map((valueItem) =>
													valueItem.id === item.id
														? { ...valueItem, value: event.target.value }
														: valueItem,
												),
											)
										}
										placeholder="Value"
										value={item.value}
									/>
									<button
										aria-label="Remove value"
										className="grid h-9 w-9 shrink-0 place-items-center rounded-base border border-danger-100 bg-danger-50 text-danger-500 hover:bg-danger-100"
										onClick={() =>
											setValues((current) =>
												current.length > 1
													? current.filter(
															(valueItem) => valueItem.id !== item.id,
														)
													: current,
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
							className="mt-4 inline-flex h-10 items-center gap-2 rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted cursor-pointer"
							onClick={() =>
								setValues((current) => [
									...current,
									{ id: `value-${Date.now()}`, value: "" },
								])
							}
							type="button"
						>
							<Icon className="h-4 w-4" name="plus" />
							Add value
						</button>
					</FormCard>
				</div>
				<aside className="min-w-0 space-y-4">
					<FormCard title="Status">
						<SelectField
							defaultValue="Active"
							help="Draft attributes are hidden from product forms."
							label="Status"
							name="status"
							options={["Active", "Draft"]}
						/>
					</FormCard>
					<FormCard title="Product Filters">
						<label className="inline-flex cursor-pointer items-start gap-2">
							<input
								className="mt-0.5 h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
								defaultChecked
								name="show_filter"
								type="checkbox"
							/>
							<span>
								<span className="block text-[14px] font-semibold text-ink-900">
									Show in storefront filters
								</span>
								<span className="mt-1 block text-[12px] text-ink-400">
									Customers can filter product lists by this attribute.
								</span>
							</span>
						</label>
					</FormCard>
				</aside>
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
					href={routes.attributes}
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
		</>
	);
}
