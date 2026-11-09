"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminBranding } from "@/admin/config/branding";
import { primaryNavigation } from "@/admin/config/navigation";
import { routes } from "@/admin/config/routes";
import type { NavigationGroup, NavigationItem } from "@/admin/types/navigation";
import { cn } from "@/admin/utils/cn";
import { useDashboardChrome } from "./dashboard-chrome";
import { UserProfileDropdown } from "./header";
import { Icon } from "./icon";
import { SearchKbd } from "./sidebar-search";

export function Sidebar() {
	const { closeSidebar, mobileOpen, toggleCollapsed } = useDashboardChrome();
	const pathname = usePathname();

	return (
		<aside
			aria-label="Primary navigation"
			className={cn(
				"dashboard-scrollbar fixed inset-y-0 left-0 z-40 flex w-sidebar flex-col border-r border-surface-line bg-surface-card text-ink-700 lg:translate-x-0",
				mobileOpen ? "translate-x-0" : "-translate-x-full",
			)}
			id="admin-sidebar"
		>
			<div className="sidebar-header relative flex items-center gap-2 p-3">
				<Link
					aria-label={adminBranding.dashboardLabel}
					className="ws-switch flex flex-1 items-center gap-2 rounded-base px-2 py-1.5"
					href={routes.dashboard}
				>
					<Image
						alt={adminBranding.logoAlt}
						className="logo-full h-10 w-10 shrink-0 rounded-base object-contain"
						height={40}
						priority
						src={adminBranding.logo.mark}
						width={40}
					/>
					<span className="logo-full min-w-0 truncate text-[20px] font-semibold text-ink-900">
						{adminBranding.name}
					</span>
					<Image
						alt=""
						className="logo-mark hidden h-10 w-10 shrink-0 rounded-base object-contain"
						height={40}
						src={adminBranding.logo.mark}
						width={40}
					/>
				</Link>
				<button
					aria-label="Collapse sidebar"
					className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-base text-ink-400 transition-colors hover:bg-surface-muted hover:text-ink-700 lg:inline-flex"
					onClick={toggleCollapsed}
					type="button"
				>
					<Icon className="h-[18px] w-[18px]" name="panel-left" />
				</button>
				<button
					aria-label="Close sidebar"
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-base text-ink-400 hover:bg-surface-muted lg:hidden"
					onClick={closeSidebar}
					type="button"
				>
					<Icon className="h-5 w-5" name="x" />
				</button>
			</div>
			<SidebarSearch />
			<nav className="dashboard-scrollbar mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
				{primaryNavigation.map((item) =>
					isNavigationGroup(item) ? (
						<SidebarNavGroup group={item} key={item.key} pathname={pathname} />
					) : (
						<SidebarNavLink item={item} key={item.key} pathname={pathname} />
					),
				)}
			</nav>
			<UserProfileDropdown variant="sidebar" />
		</aside>
	);
}

function isNavigationGroup(
	item: NavigationGroup | NavigationItem,
): item is NavigationGroup {
	return "children" in item;
}

function SidebarSearch() {
	return (
		<div className="nav-search px-3">
			<div className="relative">
				<Icon
					className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
					name="search"
				/>
				<input
					className="h-10 w-full rounded-base border border-surface-line bg-surface-muted/50 pl-9 pr-12 text-[14px] text-ink-700 placeholder:text-ink-400 focus:border-brand-600"
					placeholder="Search"
					type="search"
				/>
				<SearchKbd />
			</div>
		</div>
	);
}

type SidebarNavLinkProps = {
	item: NavigationItem;
	pathname: string;
};

function SidebarNavLink({ item, pathname }: SidebarNavLinkProps) {
	const active = isRouteActive(pathname, item.href);

	return (
		<Link
			className={cn(
				"sidebar-link flex items-center gap-3 rounded-base px-2 py-2 text-[14px] text-ink-700 transition-colors hover:bg-surface-muted",
				active ? "bg-surface-muted font-semibold text-ink-900" : "",
			)}
			href={item.href}
			title={item.title ?? item.label}
		>
			{item.icon ? (
				<Icon
					className="h-[18px] w-[18px] shrink-0 text-ink-500"
					name={item.icon}
				/>
			) : null}
			<span className="nav-text flex-1">{item.label}</span>
		</Link>
	);
}

type SidebarNavGroupProps = {
	group: NavigationGroup;
	pathname: string;
};

function SidebarNavGroup({ group, pathname }: SidebarNavGroupProps) {
	const activeChildHref = getActiveChildHref(group.children, pathname);
	const hasActiveChild = activeChildHref !== undefined;
	const [userOpen, setUserOpen] = useState(false);
	const open = hasActiveChild || userOpen;

	return (
		<div data-open={open}>
			<button
				aria-expanded={open}
				className="sidebar-link flex w-full items-center gap-3 rounded-base px-2 py-2 text-[14px] text-ink-700 transition-colors hover:bg-surface-muted"
				onClick={() => setUserOpen((current) => !current)}
				title={group.label}
				type="button"
			>
				<Icon
					className="h-[18px] w-[18px] shrink-0 text-ink-500"
					name={group.icon}
				/>
				<span className="nav-text flex-1 text-left">{group.label}</span>
				<Icon
					className={cn(
						"nav-text h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300",
						open ? "rotate-90" : "",
					)}
					name="chevron-right"
				/>
			</button>
			<div
				className={cn(
					"nav-text grid transition-all duration-300 ease-in-out",
					open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<div className="mt-0.5 space-y-0.5 pl-9 text-[13px]">
						{group.children.map((child) => {
							const active = activeChildHref === child.href;

							return (
								<Link
									className={cn(
										"block rounded-base px-2 py-2 text-ink-500 transition-colors hover:bg-surface-muted hover:text-ink-900",
										active ? "bg-surface-muted font-semibold text-ink-900" : "",
									)}
									href={child.href}
									key={child.key}
								>
									{child.label}
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

function isRouteActive(pathname: string, href: string) {
	if (href === routes.dashboard) {
		return pathname === href;
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveChildHref(children: NavigationItem[], pathname: string) {
	const matches = children
		.filter((child) => isRouteActive(pathname, child.href))
		.sort((a, b) => b.href.length - a.href.length);

	return matches[0]?.href;
}
