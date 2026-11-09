import { baseURL } from "@/admin/utils/cn";

const asset = (path: string) => `${baseURL}${path}`;

export const adminBranding = {
	name: "Avokarto",
	adminName: "Avokarto Admin",
	dashboardLabel: "Avokarto dashboard",
	logoAlt: "Avokarto logo",
	logo: {
		dark: asset("assets/images/logo/avokarto-logo-mark-white.webp"),
		favicon: asset("assets/images/favicon.png"),
		light: asset("assets/images/logo/avokarto-logo-mark.webp"),
		mark: asset("assets/images/logo/avokarto-logo-mark.webp"),
	},
} as const;
