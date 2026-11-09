import type { Metadata } from "next";
import { PermissionSettings } from "@/admin/components/settings/store-policy-settings";
import { getAdminAccounts } from "@/lib/backend/admin-data";
import { getResellerSettings } from "@/lib/backend/resellers";
import { getStoreSettingsPolicy } from "@/lib/backend/store-policy";

export const metadata: Metadata = { title: "Permission settings" };

export default async function PermissionSettingsRoutePage() {
	const [policy, accounts, resellers] = await Promise.all([getStoreSettingsPolicy(), getAdminAccounts(), getResellerSettings()]);
	return (
		<PermissionSettings
			accounts={accounts}
			initial={policy}
			sellerAccess={{ signupsOpen: resellers.signupsOpen, subscriptionsRequired: resellers.subscriptionsRequired }}
		/>
	);
}
