"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { adminBranding } from "@/admin/config/branding";
import { routes } from "@/admin/config/routes";
import { baseURL, cn } from "@/admin/utils/cn";
import { useRealtimeResource } from "@/admin/hooks/use-realtime-resource";
import type { AdminAttention } from "@/lib/backend/admin-data";
import { useDashboardChrome } from "./dashboard-chrome";
import { Icon } from "./icon";

export function Header() {
	return (
		<header className="sticky top-0 z-20 flex h-[60px] items-center border-b border-surface-line bg-surface-card px-4 lg:h-topbar lg:px-6">
			<MobileSidebarButton />
			<MobileLogo />
			<SearchUi />
			<div className="ml-auto flex items-center gap-2 sm:gap-4">
				<Notifications />
				<ThemeToggle />
				<UserProfileDropdown variant="topbar" />
			</div>
		</header>
	);
}

function MobileSidebarButton() {
	const { mobileOpen, toggleMobile } = useDashboardChrome();

	return (
		<button
			aria-controls="admin-sidebar"
			aria-expanded={mobileOpen}
			aria-label="Open sidebar"
			className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-base border border-surface-line text-ink-700 hover:bg-surface-muted lg:hidden"
			onClick={toggleMobile}
			type="button"
		>
			<Icon className="h-5 w-5" name="menu" />
		</button>
	);
}

function MobileLogo() {
	return (
		<Link
			aria-label={adminBranding.dashboardLabel}
			className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:hidden"
			href={routes.dashboard}
		>
			<Image
				alt={adminBranding.logoAlt}
				className="h-8 w-8 shrink-0 rounded-base object-contain"
				height={32}
				priority
				src={adminBranding.logo.mark}
				width={32}
			/>
			<span className="text-[17px] font-semibold text-ink-900">
				{adminBranding.name}
			</span>
		</Link>
	);
}

export function SearchUi() {
	return (
		<search className="hidden w-full max-w-[520px] items-center lg:flex">
			<form className="contents">
				<label className="sr-only" htmlFor="global-search">
					Search dashboard
				</label>
				<input
					className="h-10 flex-1 rounded-l-card border border-r-0 border-surface-line bg-surface-body px-5 text-[15px] text-ink-700 placeholder:text-ink-400 focus:border-brand-600"
					id="global-search"
					placeholder={`Search ${adminBranding.name} ..`}
					type="search"
				/>
				<button
					aria-label="Submit search"
					className="inline-flex h-10 w-14 items-center justify-center rounded-r-card bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
					type="submit"
				>
					<Icon className="h-5 w-5" name="search" />
				</button>
			</form>
		</search>
	);
}

const noAttention: AdminAttention = {
	ordersPending: 0,
	outOfStock: 0,
	payoutsRequested: 0,
	payoutsRequestedCount: 0,
	subsPastDue: 0,
	ticketsOpen: 0,
};

/**
 * The bell: live count of what's waiting on an admin (pending orders, payout
 * requests, open tickets, out-of-stock products, failing subscriptions), and
 * a dropdown that links straight to each.
 */
export function Notifications() {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const { data, hasData } = useRealtimeResource<AdminAttention>({
		endpoint: "/api/admin/attention",
		fallbackData: noAttention,
		topics: ["orders", "products", "resellers", "support-tickets"],
	});

	const items = [
		{ count: data.ordersPending, href: routes.orders, icon: "shopping-bag", label: "Orders to fulfil", note: "Waiting to be packed and shipped" },
		{
			count: data.payoutsRequestedCount,
			href: routes.resellerPayouts,
			icon: "dollar-sign",
			label: "Payout requests",
			note: data.payoutsRequestedCount
				? `${new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(data.payoutsRequested)} requested by sellers`
				: "Sellers asking to be paid",
		},
		{ count: data.ticketsOpen, href: routes.supportTickets, icon: "life-buoy", label: "Open tickets", note: "Customers waiting for a reply" },
		{ count: data.outOfStock, href: routes.products, icon: "package", label: "Out of stock", note: "Listed, but can't be bought" },
		{ count: data.subsPastDue, href: routes.resellers, icon: "credit-card", label: "Payments failing", note: "Seller plans past due" },
	];
	const waiting = items.filter((item) => item.count > 0);
	const total = waiting.reduce((sum, item) => sum + item.count, 0);

	useEffect(() => {
		if (!open) return;
		const onPointer = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("pointerdown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div className="relative" ref={rootRef}>
			<button
				aria-expanded={open}
				aria-haspopup="true"
				aria-label={total ? `Notifications, ${total} need attention` : "Notifications, all clear"}
				className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-700 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
				onClick={() => setOpen((value) => !value)}
				type="button"
			>
				<Icon className="h-5 w-5" name="bell" />
				{hasData && total ? (
					<span className="absolute right-0 top-0 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold leading-none text-white">
						{total > 99 ? "99+" : total}
					</span>
				) : null}
			</button>
			{open ? (
				<div
					className="fixed inset-x-3 top-[64px] z-50 overflow-hidden rounded-card border border-surface-line bg-surface-card shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[340px]"
					role="menu"
				>
					<div className="flex items-center justify-between border-b border-surface-line px-4 py-3">
						<span className="text-[14px] font-semibold text-ink-900">Needs attention</span>
						<span className="text-[12px] text-ink-400">Live</span>
					</div>
					{waiting.length ? (
						<ul className="max-h-[360px] overflow-y-auto py-1">
							{waiting.map((item) => (
								<li key={item.label}>
									<Link
										className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-body"
										href={item.href}
										onClick={() => setOpen(false)}
										role="menuitem"
									>
										<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
											<Icon className="h-4 w-4" name={item.icon} />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-[14px] font-medium text-ink-900">{item.label}</span>
											<span className="block truncate text-[12px] text-ink-400">{item.note}</span>
										</span>
										<span className="rounded-full bg-ink-900 px-2 py-0.5 text-[12px] font-semibold text-white dark:bg-brand-500">
											{item.count}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<div className="flex items-center gap-3 px-4 py-5">
							<span className="grid h-9 w-9 place-items-center rounded-full bg-success-50 text-success-600">
								<Icon className="h-4 w-4" name="check" />
							</span>
							<span className="text-[14px] text-ink-700">All clear - nothing waiting on you.</span>
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}

export function ThemeToggle() {
	const [dark, setDark] = useState(
		() =>
			typeof document !== "undefined" &&
			document.documentElement.classList.contains("dark"),
	);

	function toggleTheme() {
		const nextDark = !dark;
		document.documentElement.classList.add("no-theme-transition");
		document.documentElement.classList.toggle("dark", nextDark);
		localStorage.setItem("unimart-theme", nextDark ? "dark" : "light");
		setDark(nextDark);

		requestAnimationFrame(() => {
			requestAnimationFrame(() =>
				document.documentElement.classList.remove("no-theme-transition"),
			);
		});
	}

	return (
		<button
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
			aria-pressed={dark}
			className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-surface-muted sm:inline-flex"
			onClick={toggleTheme}
			type="button"
		>
			<Icon className="h-5 w-5" name={dark ? "sun" : "moon"} />
		</button>
	);
}

type UserProfileDropdownProps = {
	variant: "sidebar" | "topbar";
};

export function UserProfileDropdown({ variant }: UserProfileDropdownProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const menuId =
		variant === "topbar" ? "topbar-user-menu" : "sidebar-user-menu";

	useEffect(() => {
		function onDocumentClick(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
			}
		}

		document.addEventListener("click", onDocumentClick);
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("click", onDocumentClick);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, []);

	if (variant === "sidebar") {
		return (
			<div
				className="relative border-t border-surface-line p-3"
				ref={containerRef}
			>
				<button
					aria-controls={menuId}
					aria-expanded={open}
					aria-haspopup="menu"
					className="user-switch flex w-full items-center gap-3 rounded-base px-2 py-2 text-left transition-colors hover:bg-surface-muted"
					onClick={() => setOpen((current) => !current)}
					type="button"
				>
					<Image
						alt="Sumit Singh"
						className="h-9 w-9 shrink-0 rounded-full object-cover"
						height={36}
						src={`${baseURL}assets/avatars/admin-avatar.svg`}
						width={36}
					/>
					<span className="user-text min-w-0 flex-1">
						<span className="block truncate text-[14px] font-semibold text-ink-900">
							Sumit Singh
						</span>
						<span className="block truncate text-[12px] text-ink-400">
							admin@avokarto.local
						</span>
					</span>
					<Icon
						className="user-text h-4 w-4 shrink-0 text-ink-400"
						name="chevrons-up-down"
					/>
				</button>
				<UserMenu id={menuId} open={open} placement="sidebar" />
			</div>
		);
	}

	return (
		<div className="relative" ref={containerRef}>
			<button
				aria-controls={menuId}
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label="Sumit Singh Admin - open account menu"
				className="flex items-center gap-3 rounded-card px-2 py-1.5 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
				onClick={() => setOpen((current) => !current)}
				type="button"
			>
				<Image
					alt="Sumit Singh"
					className="h-10 w-10 rounded-full border border-surface-line object-cover"
					height={40}
					src={`${baseURL}assets/avatars/admin-avatar.svg`}
					width={40}
				/>
				<span className="hidden text-left lg:block">
					<span className="block text-[15px] font-semibold leading-tight text-ink-900">
						Sumit Singh
					</span>
					<span className="flex items-center gap-1 text-[13px] text-ink-500">
						Admin <Icon className="h-3.5 w-3.5" name="chevron-down" />
					</span>
				</span>
			</button>
			<UserMenu id={menuId} open={open} placement="topbar" />
		</div>
	);
}

type UserMenuProps = {
	id: string;
	open: boolean;
	placement: "sidebar" | "topbar";
};

function UserMenu({ id, open, placement }: UserMenuProps) {
	const placementClass =
		placement === "topbar"
			? "absolute right-0 top-full z-50 mt-2 w-64"
			: "absolute bottom-full left-3 right-3 z-50 mb-2";

	return (
		<div
			className={cn(
				placementClass,
				"rounded-card border border-surface-line bg-surface-card p-1.5 shadow-lift",
				open ? "block" : "hidden",
			)}
			id={id}
			role="menu"
		>
			<div className="flex items-center gap-3 border-b border-surface-line px-2 pb-3 pt-2">
				<Image
					alt="Sumit Singh"
					className="h-9 w-9 rounded-full object-cover"
					height={36}
					src={`${baseURL}assets/avatars/admin-avatar.svg`}
					width={36}
				/>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-[14px] font-semibold text-ink-900">
						Sumit Singh
					</span>
					<span className="block truncate text-[12px] text-ink-400">
						admin@avokarto.local
					</span>
				</span>
			</div>
			<div className="space-y-0.5 py-1.5">
				<UserMenuItem
					href={routes.settings}
					icon="settings"
					label="Profile Setting"
				/>
				<UserMenuItem
					href={routes.notifications}
					icon="bell"
					label="Notifications"
				/>
			</div>
			<div className="border-t border-surface-line py-1.5">
				<UserMenuItem
					href={routes.signIn}
					icon="log-out"
					label="Logout"
				/>
			</div>
			{placement === "sidebar" ? (
				<p className="px-2 pb-1 pt-2 text-[12px] text-ink-400 nav-text">
					v1.5.69 - Terms &amp; Conditions
				</p>
			) : null}
		</div>
	);
}

type UserMenuItemProps = {
	className?: string;
	href: string;
	icon: string;
	label: string;
};

function UserMenuItem({ className, href, icon, label }: UserMenuItemProps) {
	return (
		<Link
			aria-label={label}
			className={cn(
				"flex items-center gap-3 rounded-base px-2 py-2 text-[14px] text-ink-700 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
				className,
			)}
			href={href}
			role="menuitem"
		>
			<Icon className="h-[18px] w-[18px] text-ink-500" name={icon} />
			<span className="nav-text">{label}</span>
		</Link>
	);
}
