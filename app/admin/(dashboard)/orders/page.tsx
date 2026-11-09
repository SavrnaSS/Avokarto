import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveOrdersTable } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";

export default function OrdersPage() {
	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addOrder}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Order
					</Link>
				}
				description="Review, filter, and manage every customer order in one place."
				eyebrow="Operations"
				title="Orders Listing"
			/>
			<LiveOrdersTable initialOrders={[]} />
		</>
	);
}
