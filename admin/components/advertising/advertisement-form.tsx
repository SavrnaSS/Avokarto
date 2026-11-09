"use client";

import Link from "next/link";
import { useState } from "react";
import {
	Field,
	FormCard,
	SelectField,
} from "@/admin/components/forms/admin-form-primitives";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";
import { useImageUpload } from "@/admin/hooks/use-image-upload";
import { cn } from "@/admin/utils/cn";
import type { Advertisement } from "@/admin/data/admin/operations";

type AdvertisementFormProps = {
	advertisement?: Advertisement;
	mode: "add" | "edit";
};

export function AdvertisementForm({ advertisement, mode }: AdvertisementFormProps) {
	const [status, setStatus] = useState<string>(advertisement?.status ?? "active");
	const [title, setTitle] = useState(advertisement?.title ?? "New Advertisement");
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/advertisements",
		method: mode === "edit" ? "PATCH" : "POST",
		redirectTo: routes.advertisements,
	});
	const image = useImageUpload(advertisement?.imageUrl ?? "");
	const formTitle = mode === "edit" ? "Edit Advertisement" : "Add Advertisement";

	return (
		<>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 max-w-full">
					<Breadcrumb
						items={[
							{ href: routes.dashboard, label: "Home" },
							{ href: routes.advertisements, label: "Advertising" },
							{ label: formTitle },
						]}
					/>
					<h1 className="text-[22px] font-semibold text-ink-900">{formTitle}</h1>
					<p className="mt-1 break-words text-[14px] text-ink-500">
						{mode === "edit"
							? "Update this banner's image, link, and visibility."
							: "Add a banner ad. It only appears on the storefront while its status is Active - remove or deactivate it any time."}
					</p>
				</div>
			</div>
			<form
				className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)]"
				id={`${mode}-advertisement-form`}
				onSubmit={(event) => void onSubmit(event)}
			>
				<aside className="min-w-0 space-y-4 xl:order-1">
					<FormCard title="Banner Image">
						<div className="flex flex-col items-center text-center">
							<input name="image_url" type="hidden" value={image.url} />
							<label className="group relative grid aspect-[21/9] w-full cursor-pointer place-items-center overflow-hidden rounded-base bg-surface-body shadow-soft transition-shadow hover:shadow-lift">
								<span className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-surface-card text-ink-400 shadow-card transition-colors group-hover:text-brand-600">
									<Icon className="h-3.5 w-3.5" name="pencil" />
								</span>
								{image.preview ? (
									// Plain img, not next/image - the preview can briefly be a
									// blob: URL while the real upload is in flight, which the
									// image optimizer can't fetch.
									// eslint-disable-next-line @next/next/no-img-element
									<img
										alt="Advertisement preview"
										className={cn(
											"absolute inset-0 h-full w-full object-cover",
											image.uploading ? "opacity-50" : "",
										)}
										src={image.preview}
									/>
								) : (
									<span className="grid h-14 w-14 -rotate-6 place-items-center rounded-base bg-brand-50 text-brand-200">
										<Icon
											className="h-7 w-7 transition-colors group-hover:text-brand-400"
											name="image"
										/>
									</span>
								)}
								{image.uploading ? (
									<span className="absolute inset-0 grid place-items-center bg-ink-900/10">
										<Icon
											className="h-6 w-6 animate-spin text-brand-600"
											name="loader"
										/>
									</span>
								) : null}
								<input
									accept=".png,.jpg,.jpeg,.webp"
									aria-label="Upload advertisement banner"
									className="sr-only"
									onChange={(event) => {
										const file = event.target.files?.[0];
										if (file) {
											void image.upload(file);
										}
									}}
									type="file"
								/>
							</label>
							{image.error ? (
								<p className="mt-3 text-[12px] font-semibold text-danger-500">
									{image.error}
								</p>
							) : null}
							<p className="mt-4 text-[12px] text-ink-400">
								Wide banner images (e.g. 1200x500) work best for this slot.
							</p>
						</div>
					</FormCard>
					<FormCard title="Status">
						<SelectField
							defaultValue={status}
							help="Inactive banners are hidden from the storefront but stay saved here."
							hideLabel
							label="Status"
							name="status"
							onChange={setStatus}
							options={["active", "inactive"]}
						/>
					</FormCard>
					<FormCard title="Sort Order">
						<Field
							defaultValue={advertisement ? String(advertisement.sortOrder) : "0"}
							help="When more than one banner is active, the lowest number shows first."
							label="Sort Order"
							name="sort_order"
							type="number"
						/>
					</FormCard>
				</aside>
				<div className="min-w-0 space-y-4 xl:order-2">
					<FormCard title="General">
						<div className="space-y-4">
							{mode === "edit" ? (
								// title is the key mutateAdvertisement upserts on - changing it
								// here would silently create a second banner instead of
								// updating this one, so it's locked once a banner exists.
								<label className="block">
									<span className="text-[13px] font-semibold text-ink-700">
										Title
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-muted px-3 font-semibold text-ink-500"
										disabled
										value={title}
									/>
									<input name="title" type="hidden" value={title} />
									<p className="mt-1 text-[12px] text-ink-400">
										The title can&apos;t be changed after a banner is created.
									</p>
								</label>
							) : (
								<label className="block">
									<span className="text-[13px] font-semibold text-ink-700">
										Title <span className="text-danger-500">*</span>
									</span>
									<input
										className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] focus:border-brand-600"
										name="title"
										onChange={(event) => setTitle(event.target.value)}
										placeholder="Summer Sale Banner"
										required
										value={title}
									/>
									<p className="mt-1 text-[12px] text-ink-400">
										Internal label only - shoppers never see this, just the
										image.
									</p>
								</label>
							)}
							<Field
								defaultValue={advertisement?.linkUrl}
								help="Where shoppers land if they click the banner. Leave blank for a non-clickable image."
								label="Link URL"
								name="link_url"
								placeholder="/shop-by-category or https://..."
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
						href={routes.advertisements}
					>
						Cancel
					</Link>
					<button
						className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
						disabled={submitting}
						form={`${mode}-advertisement-form`}
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
