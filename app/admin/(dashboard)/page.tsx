import type { Metadata } from "next";
import { LiveDashboard } from "@/admin/components/realtime/live-admin-resources";

export const metadata: Metadata = {
	title: "Dashboard",
};

export default function DashboardPage() {
	return <LiveDashboard />;
}
