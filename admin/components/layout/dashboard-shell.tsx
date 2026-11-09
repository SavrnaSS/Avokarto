import type { ReactNode } from "react";
import { DashboardChrome } from "@/admin/components/layout/dashboard-chrome";

type DashboardShellProps = {
	children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
	return <DashboardChrome>{children}</DashboardChrome>;
}
