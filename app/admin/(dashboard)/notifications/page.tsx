import type { Metadata } from "next";
import { NotificationSettingsPage } from "@/admin/components/settings/notification-settings";
import { getAdminAlertSettings } from "@/lib/backend/admin-alerts";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsRoutePage() {
	return <NotificationSettingsPage initial={await getAdminAlertSettings()} />;
}
