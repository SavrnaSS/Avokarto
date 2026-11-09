import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/admin/components/products/product-form";
import { productFormDefaults } from "@/admin/data/products/data";
import { getAdminCategories, getAdminProductBySku } from "@/lib/backend/admin-data";

export const metadata: Metadata = {
	title: "Edit Product",
};

export default async function EditProductPage({
	params,
}: {
	params: Promise<{ sku: string }>;
}) {
	const { sku } = await params;
	const [product, categories] = await Promise.all([
		getAdminProductBySku(decodeURIComponent(sku)),
		getAdminCategories(),
	]);

	if (!product) {
		notFound();
	}

	return (
		// Keyed by version: after a refresh brings in changes saved elsewhere,
		// the form remounts with the new values instead of keeping stale ones.
		<ProductForm
			key={product.version}
			categoryOptions={categories.map((category) => ({
				label: category.name,
				value: category.id,
			}))}
			mode="edit"
			product={product}
			{...productFormDefaults.edit}
		/>
	);
}
