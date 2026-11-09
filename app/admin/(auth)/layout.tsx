import type { ReactNode } from "react";
import { AuthShell } from "@/admin/components/layout/auth-shell";

type AuthLayoutProps = {
	children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
	return <AuthShell>{children}</AuthShell>;
}
