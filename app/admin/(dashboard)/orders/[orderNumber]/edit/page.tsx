import { notFound } from "next/navigation";
import { OrderForm } from "@/admin/components/orders/order-form";
import { getAdminOrderByNumber } from "@/lib/backend/admin-data";

export default async function EditOrderPage({
	params,
}: {
	params: Promise<{ orderNumber: string }>;
}) {
	const { orderNumber } = await params;
	const order = await getAdminOrderByNumber(decodeURIComponent(orderNumber));

	if (!order) {
		notFound();
	}

	return <OrderForm mode="edit" order={order} />;
}
