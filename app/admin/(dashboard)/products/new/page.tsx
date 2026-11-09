import type { Metadata } from "next";
import { ProductForm } from "@/admin/components/products/product-form";
import { productFormDefaults } from "@/admin/data/products/data";
import { getAdminCategories } from "@/lib/backend/admin-data";

export const metadata: Metadata = {
	title: "Add Product",
};

export default async function AddProductPage() {
	const categories = await getAdminCategories();

	return (
		<ProductForm
			categoryOptions={categories.map((category) => ({
				label: category.name,
				value: category.id,
			}))}
			mode="add"
			{...productFormDefaults.add}
		/>
	);
}
