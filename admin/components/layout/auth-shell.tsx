import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { adminBranding } from "@/admin/config/branding";
import { routes } from "@/admin/config/routes";

type AuthShellProps = {
	children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
	return (
		<main className="grid min-h-screen bg-surface-body lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1fr)]">
			<section className="admin-brand-hero admin-brand-hero-panel relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col">
				<Link
					aria-label={adminBranding.dashboardLabel}
					className="relative z-10 inline-flex items-center gap-3"
					href={routes.dashboard}
				>
					<span className="grid h-12 w-12 place-items-center rounded-base bg-white/95 p-1.5 shadow-lift">
						<Image
							alt={adminBranding.logoAlt}
							className="h-full w-full object-contain"
							height={40}
							priority
							src={adminBranding.logo.mark}
							width={40}
						/>
					</span>
					<span className="text-[22px] font-semibold text-white">
						{adminBranding.name}
					</span>
				</Link>

				<div className="relative z-10 mt-auto grid place-items-center pb-10">
					<div className="grid h-44 w-44 place-items-center rounded-base bg-white/95 p-5 shadow-lift">
						<Image
							alt=""
							className="h-full w-full object-contain"
							height={156}
							priority
							src={adminBranding.logo.mark}
							width={156}
						/>
					</div>
				</div>
			</section>
			<section className="admin-brand-hero admin-brand-auth-panel relative flex items-center justify-center px-4 py-10">
				{children}
			</section>
		</main>
	);
}
