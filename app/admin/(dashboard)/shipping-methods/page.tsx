import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveShippingMethodsPanel } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";
import { getAdminShippingMethods } from "@/lib/backend/admin-data";

export default async function ShippingMethodsPage() {
	const methods = await getAdminShippingMethods();

	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addShippingMethod}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Shipping Method
					</Link>
				}
				description="Manage the shipping options, rates, and delivery estimates shown at checkout."
				eyebrow="Fulfillment"
				title="Shipping Methods"
			/>
			<LiveShippingMethodsPanel initialMethods={methods} />
		</>
	);
}
