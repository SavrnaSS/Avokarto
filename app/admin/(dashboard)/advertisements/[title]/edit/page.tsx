import { notFound } from "next/navigation";
import { AdvertisementForm } from "@/admin/components/advertising/advertisement-form";
import { getAdminAdvertisementByTitle } from "@/lib/backend/admin-data";

export default async function EditAdvertisementPage({
	params,
}: {
	params: Promise<{ title: string }>;
}) {
	const { title } = await params;
	const advertisement = await getAdminAdvertisementByTitle(decodeURIComponent(title));

	if (!advertisement) {
		notFound();
	}

	return <AdvertisementForm advertisement={advertisement} mode="edit" />;
}
