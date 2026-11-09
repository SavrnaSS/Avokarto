import type { ReactNode } from "react";
import { DashboardShell } from "@/admin/components/layout/dashboard-shell";

type DashboardLayoutProps = {
	children: ReactNode;
};

// Dashboard routes read live, authenticated data and must never require the
// database while Next.js is compiling or statically exporting the application.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return <DashboardShell>{children}</DashboardShell>;
}
