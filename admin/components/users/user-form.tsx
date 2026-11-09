"use client";

import Link from "next/link";
import {
	Field,
	FormCard,
	SelectField,
} from "@/admin/components/forms/admin-form-primitives";
import { Breadcrumb } from "@/admin/components/layout/breadcrumb";
import { Icon } from "@/admin/components/layout/icon";
import { routes } from "@/admin/config/routes";
import { useAdminFormSubmit } from "@/admin/hooks/use-admin-form-submit";

export function UserForm() {
	const formId = "add-user-form";
	const { error, onSubmit, submitting } = useAdminFormSubmit({
		endpoint: "/api/admin/users",
		redirectTo: routes.users,
	});

	return (
		<>
			<div className="mb-5">
				<Breadcrumb
					items={[
						{ href: routes.dashboard, label: "Home" },
						{ href: routes.users, label: "Users" },
						{ label: "Add User" },
					]}
				/>
				<p className="mb-1 text-[13px] font-semibold uppercase text-brand-600">
					Users
				</p>
				<h1 className="text-[22px] font-semibold text-ink-900">Add User</h1>
				<p className="mt-1 text-[14px] text-ink-500">
					Create an account that can sign in to this admin dashboard.
				</p>
			</div>
			<form
				className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"
				id={formId}
				onSubmit={(event) => void onSubmit(event)}
			>
				<div className="min-w-0">
					<FormCard title="Profile Information">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Full Name"
								name="name"
								placeholder="Full name"
								required
							/>
							<Field
								label="Email"
								name="email"
								placeholder="email@example.com"
								required
								type="email"
							/>
							<Field
								help="At least 8 characters."
								label="Password"
								name="password"
								placeholder="••••••••"
								required
								type="password"
							/>
							<SelectField
								label="Role"
								name="role"
								options={["Admin", "Manager", "Support", "Customer"]}
								required
							/>
						</div>
					</FormCard>
				</div>
				<aside className="min-w-0 space-y-4">
					<FormCard title="Account Status">
						<SelectField
							defaultValue="Active"
							label="Status"
							name="status"
							options={["Active", "Disabled", "Review"]}
						/>
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
					href={routes.users}
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
