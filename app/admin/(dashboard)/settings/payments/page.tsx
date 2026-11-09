import type { Metadata } from "next";
import { PaymentSettings } from "@/admin/components/settings/store-policy-settings";
import { getResellerSettings } from "@/lib/backend/resellers";
import { getStoreSettingsPolicy } from "@/lib/backend/store-policy";

export const metadata: Metadata = { title: "Payment settings" };

export default async function PaymentSettingsRoutePage() {
	const [policy, resellers] = await Promise.all([getStoreSettingsPolicy(), getResellerSettings()]);
	return (
		<PaymentSettings
			initial={policy}
			payouts={{ holdDays: resellers.holdDays, minPayout: resellers.minPayout, platformFeePercent: resellers.platformFeePercent }}
		/>
	);
}
