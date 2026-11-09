import { StoreProfilePage } from "@/admin/components/settings/settings-pages";
import { getAdminStoreSettings } from "@/lib/backend/admin-data";

export default async function SettingsPage() {
	const settings = await getAdminStoreSettings();

	return <StoreProfilePage settings={settings} />;
}
