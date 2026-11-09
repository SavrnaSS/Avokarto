import { notFound } from "next/navigation";
import { BrandForm } from "@/admin/components/catalog/brand-form";
import { getAdminBrandBySlug } from "@/lib/backend/admin-data";

export default async function EditBrandPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const brand = await getAdminBrandBySlug(decodeURIComponent(slug));

	if (!brand) {
		notFound();
	}

	return <BrandForm brand={brand} mode="edit" />;
}
