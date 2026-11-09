import { notFound } from "next/navigation";
import { CategoryForm } from "@/admin/components/catalog/category-form";
import { getAdminCategoryBySlug } from "@/lib/backend/admin-data";

export default async function EditCategoryPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const category = await getAdminCategoryBySlug(decodeURIComponent(slug));

	if (!category) {
		notFound();
	}

	return <CategoryForm category={category} mode="edit" />;
}
