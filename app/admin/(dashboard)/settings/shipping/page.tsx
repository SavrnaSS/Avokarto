import type { Metadata } from "next";
import { ShippingSettings } from "@/admin/components/settings/store-policy-settings";
import { getAdminShippingMethods } from "@/lib/backend/admin-data";
import { getStoreSettingsPolicy } from "@/lib/backend/store-policy";

export const metadata: Metadata = { title: "Shipping settings" };

export default async function ShippingSettingsRoutePage() {
	const [policy, methods] = await Promise.all([getStoreSettingsPolicy(), getAdminShippingMethods()]);
	return (
		<ShippingSettings
			initial={policy}
			methods={methods.map(({ deliveryEstimate, id, name, price, status }) => ({ deliveryEstimate, id, name, price, status }))}
		/>
	);
}
