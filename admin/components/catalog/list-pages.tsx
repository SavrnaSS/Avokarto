"use client";

import Image from "next/image";
import Link from "next/link";
import {
	type EntityColumn,
	EntityTable,
} from "@/admin/components/admin/entity-table";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { routes } from "@/admin/config/routes";
import type {
	Attribute,
	Brand,
	Category,
	Customer,
} from "@/admin/data/admin/catalog";
import { cn } from "@/admin/utils/cn";
import type { AdminUser } from "@/lib/backend/admin-data";

type CategoryRow = Category & { id: string };
type BrandRow = Brand & { id: string };
type AttributeRow = Attribute & { id: string };
type CustomerRow = Customer & { id: string };
type UserRow = AdminUser;
type DeleteHandler = (ids: string[]) => Promise<void> | void;
type AttributeWithOptionalId = Attribute & { id?: string };

const statusClass = {
	active: "bg-success-50 text-success-600",
	archived: "bg-surface-muted text-ink-600",
	disabled: "bg-surface-muted text-ink-600",
	draft: "bg-warning-50 text-warning-600",
	published: "bg-success-50 text-success-600",
	review: "bg-warning-50 text-warning-600",
};

export function CategoryListTable({
	categories,
	onDelete,
}: {
	categories: Category[];
	onDelete?: DeleteHandler;
}) {
	const rows: CategoryRow[] = categories.map((category) => ({
		...category,
		id: category.slug,
	}));
	const columns: EntityColumn<CategoryRow>[] = [
		{
			key: "category",
			label: "Category",
			render: (category) => (
				<div className="flex items-center gap-3">
					<Image
						alt={category.name}
						className="h-12 w-12 rounded-base bg-surface-body object-cover"
						height={48}
						src={category.image}
						width={48}
					/>
					<div>
						<Link
							className="font-semibold text-ink-900 hover:text-brand-600"
							href={routes.editCategory(category.slug)}
						>
							{category.name}
						</Link>
						<p className="mt-1 text-[13px] text-ink-400">/{category.slug}</p>
					</div>
				</div>
			),
			sortValue: (category) => category.name,
		},
		{
			hideable: true,
			key: "slug",
			label: "Slug",
			render: (category) => category.slug,
			sortValue: (category) => category.slug,
		},
		{
			hideable: true,
			key: "products",
			label: "Products",
			render: (category) => category.count,
			sortValue: (category) => category.count,
		},
		{
			hideable: true,
			key: "display-order",
			label: "Display order",
			render: (category) => category.sortOrder,
			sortValue: (category) => category.sortOrder,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (category) => (
				<StatusBadge
					className={statusClass[category.status]}
					label={capitalize(category.status)}
				/>
			),
			sortValue: (category) => category.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This category will be permanently removed from your catalog. This action cannot be undone."
			editHref={(row) => routes.editCategory(row.slug)}
			filterOptions={[
				{ label: "All", match: () => true, value: "all" },
				{
					label: "Published",
					match: (row) => row.status === "published",
					value: "published",
				},
				{
					label: "Draft",
					match: (row) => row.status === "draft",
					value: "draft",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search categories"
			searchPlaceholder="Search categories"
			searchText={(category) => `${category.name} ${category.slug}`}
			singularName="category"
		/>
	);
}

export function BrandListTable({
	brands,
	onDelete,
}: {
	brands: Brand[];
	onDelete?: DeleteHandler;
}) {
	const rows: BrandRow[] = brands.map((brand) => ({
		...brand,
		id: brand.slug,
	}));
	const columns: EntityColumn<BrandRow>[] = [
		{
			key: "brand",
			label: "Brand",
			render: (brand) => (
				<div className="flex items-center gap-3">
					<span
						className={cn(
							"grid h-12 w-12 shrink-0 place-items-center rounded-base text-[14px] font-semibold",
							brand.tileClass,
						)}
					>
						{brand.initials}
					</span>
					<div>
						<Link
							className="font-semibold text-ink-900 hover:text-brand-600"
							href={routes.editBrand(brand.slug)}
						>
							{brand.name}
						</Link>
						<p className="mt-1 text-[13px] text-ink-400">{brand.website}</p>
					</div>
				</div>
			),
			sortValue: (brand) => brand.name,
		},
		{
			hideable: true,
			key: "slug",
			label: "Slug",
			render: (brand) => brand.slug,
			sortValue: (brand) => brand.slug,
		},
		{
			hideable: true,
			key: "products",
			label: "Products",
			render: (brand) => brand.count,
			sortValue: (brand) => brand.count,
		},
		{
			hideable: true,
			key: "visibility",
			label: "Visibility",
			render: (brand) => brand.visibility,
			sortValue: (brand) => brand.visibility,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (brand) => (
				<StatusBadge
					className={statusClass[brand.status]}
					label={capitalize(brand.status)}
				/>
			),
			sortValue: (brand) => brand.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This brand will be permanently removed from your catalog. This action cannot be undone."
			editHref={(row) => routes.editBrand(row.slug)}
			filterOptions={[
				{ label: "All", match: () => true, value: "all" },
				{
					label: "Published",
					match: (row) => row.status === "published",
					value: "published",
				},
				{
					label: "Draft",
					match: (row) => row.status === "draft",
					value: "draft",
				},
				{
					label: "Archived",
					match: (row) => row.status === "archived",
					value: "archived",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search brands"
			searchPlaceholder="Search brands"
			searchText={(brand) => `${brand.name} ${brand.slug} ${brand.website}`}
			singularName="brand"
		/>
	);
}

export function AttributeListTable({
	attributes,
	onDelete,
}: {
	attributes: AttributeWithOptionalId[];
	onDelete?: DeleteHandler;
}) {
	const rows: AttributeRow[] = attributes.map((attribute) => ({
		...attribute,
		id: attribute.id ?? attribute.name.toLowerCase(),
	}));
	const columns: EntityColumn<AttributeRow>[] = [
		{
			key: "attribute",
			label: "Attribute",
			render: (attribute) => (
				<div>
					<Link
						className="font-semibold text-ink-900 hover:text-brand-600"
						href={routes.addAttribute}
					>
						{attribute.name}
					</Link>
					<p className="mt-1 text-[13px] text-ink-400">
						{attribute.values.join(", ")}
					</p>
				</div>
			),
			sortValue: (attribute) => attribute.name,
		},
		{
			hideable: true,
			key: "type",
			label: "Type",
			render: (attribute) => attribute.type,
			sortValue: (attribute) => attribute.type,
		},
		{
			hideable: true,
			key: "products",
			label: "Products",
			render: (attribute) => attribute.products,
			sortValue: (attribute) => attribute.products,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (attribute) => (
				<StatusBadge
					className={statusClass[attribute.status]}
					label={capitalize(attribute.status)}
				/>
			),
			sortValue: (attribute) => attribute.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This attribute will be permanently removed from your catalog. This action cannot be undone."
			editHref={routes.addAttribute}
			filterOptions={[
				{ label: "All types", match: () => true, value: "all" },
				{
					label: "Dropdown",
					match: (row) => row.type === "Dropdown",
					value: "dropdown",
				},
				{
					label: "Swatch",
					match: (row) => row.type === "Swatch",
					value: "swatch",
				},
				{ label: "Text", match: (row) => row.type === "Text", value: "text" },
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search attributes"
			searchPlaceholder="Search attributes"
			searchText={(attribute) =>
				`${attribute.name} ${attribute.type} ${attribute.values.join(" ")}`
			}
			singularName="attribute"
		/>
	);
}

export function CustomerListTable({
	customers,
	onDelete,
}: {
	customers: Customer[];
	onDelete?: DeleteHandler;
}) {
	const rows: CustomerRow[] = customers.map((customer) => ({
		...customer,
		id: customer.email,
	}));
	const columns: EntityColumn<CustomerRow>[] = [
		{
			key: "customer",
			label: "Customer",
			render: (customer) => (
				<div className="flex items-center gap-3">
					<span
						className={cn(
							"grid h-12 w-12 shrink-0 place-items-center rounded-full text-[14px] font-semibold",
							customer.avatarClass,
						)}
					>
						{customer.name
							.split(" ")
							.map((part) => part[0])
							.join("")}
					</span>
					<div>
						<p className="font-semibold text-ink-900">{customer.name}</p>
						<p className="mt-1 text-[13px] text-ink-400">{customer.email}</p>
					</div>
				</div>
			),
			sortValue: (customer) => customer.name,
		},
		{
			hideable: true,
			key: "segment",
			label: "Segment",
			render: (customer) => customer.segment,
			sortValue: (customer) => customer.segment,
		},
		{
			hideable: true,
			key: "orders",
			label: "Orders",
			render: (customer) => customer.orders,
			sortValue: (customer) => customer.orders,
		},
		{
			hideable: true,
			key: "ltv",
			label: "LTV",
			render: (customer) => customer.ltv,
			sortValue: (customer) => Number(customer.ltv.replace(/[$,]/g, "")),
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (customer) => (
				<StatusBadge
					className={statusClass[customer.status]}
					label={capitalize(customer.status)}
				/>
			),
			sortValue: (customer) => customer.status,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This customer profile will be removed from the directory. This action cannot be undone."
			editHref={routes.addUser}
			filterOptions={[
				{ label: "All", match: () => true, value: "all" },
				{
					label: "Active",
					match: (row) => row.status === "active",
					value: "active",
				},
				{
					label: "Review",
					match: (row) => row.status === "review",
					value: "review",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search customers"
			searchPlaceholder="Search customers"
			searchText={(customer) =>
				`${customer.name} ${customer.email} ${customer.segment}`
			}
			singularName="customer"
		/>
	);
}

export function UserListTable({
	users,
	onDelete,
}: {
	onDelete?: DeleteHandler;
	users: AdminUser[];
}) {
	const rows: UserRow[] = users;
	const columns: EntityColumn<UserRow>[] = [
		{
			key: "user",
			label: "User",
			render: (user) => (
				<div>
					<p className="font-semibold text-ink-900">{user.name}</p>
					<p className="mt-1 text-[13px] text-ink-400">{user.email}</p>
				</div>
			),
			sortValue: (user) => user.name,
		},
		{
			hideable: true,
			key: "role",
			label: "Role",
			render: (user) => capitalize(user.role),
			sortValue: (user) => user.role,
		},
		{
			hideable: true,
			key: "status",
			label: "Status",
			render: (user) => (
				<StatusBadge
					className={statusClass[user.status]}
					label={capitalize(user.status)}
				/>
			),
			sortValue: (user) => user.status,
		},
		{
			hideable: true,
			key: "createdAt",
			label: "Created",
			render: (user) => user.createdAt,
			sortValue: (user) => user.createdAt,
		},
	];

	return (
		<EntityTable
			columns={columns}
			deleteMessage="This admin account will lose access immediately. This action cannot be undone."
			editHref={routes.addUser}
			filterOptions={[
				{ label: "All", match: () => true, value: "all" },
				{
					label: "Active",
					match: (row) => row.status === "active",
					value: "active",
				},
				{
					label: "Disabled",
					match: (row) => row.status === "disabled",
					value: "disabled",
				},
			]}
			items={rows}
			onDelete={onDelete}
			searchLabel="Search users"
			searchPlaceholder="Search users"
			searchText={(user) => `${user.name} ${user.email} ${user.role}`}
			singularName="user"
		/>
	);
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
