import { adminBranding } from "@/admin/config/branding";

export function Footer() {
	return (
		<footer className="m-0 border-t border-surface-line bg-surface-card px-4 py-4 text-center text-[13px] text-ink-500 lg:px-6">
			© {new Date().getFullYear()} Avokarto · {adminBranding.adminName}
		</footer>
	);
}
