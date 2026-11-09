import { notFound } from "next/navigation";
import { ShippingMethodForm } from "@/admin/components/shipping/shipping-method-form";
import { getAdminShippingMethodByName } from "@/lib/backend/admin-data";

export default async function EditShippingMethodPage({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;
	const method = await getAdminShippingMethodByName(decodeURIComponent(name));

	if (!method) {
		notFound();
	}

	return <ShippingMethodForm method={method} mode="edit" />;
}
