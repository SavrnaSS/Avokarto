import { notFound } from "next/navigation";
import { OrderDetail } from "@/admin/components/orders/order-detail";
import { getAdminOrderByNumber } from "@/lib/backend/admin-data";
import { getOrderResellerSummary } from "@/lib/backend/resellers";

export default async function OrderDetailPage({
	params,
}: {
	params: Promise<{ orderNumber: string }>;
}) {
	const { orderNumber } = await params;
	const decoded = decodeURIComponent(orderNumber);
	const [order, resellerStores] = await Promise.all([
		getAdminOrderByNumber(decoded),
		getOrderResellerSummary(decoded),
	]);

	if (!order) {
		notFound();
	}

	return <OrderDetail order={order} resellerStores={resellerStores} />;
}
