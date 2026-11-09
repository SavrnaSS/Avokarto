"use client";

import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Footer } from "@/admin/components/layout/footer";
import { Header } from "@/admin/components/layout/header";
import { Sidebar } from "@/admin/components/layout/sidebar";
import { cn } from "@/admin/utils/cn";

type DashboardChromeContextValue = {
	closeSidebar: () => void;
	collapsed: boolean;
	mobileOpen: boolean;
	toggleCollapsed: () => void;
	toggleMobile: () => void;
};

const DashboardChromeContext =
	createContext<DashboardChromeContextValue | null>(null);

type DashboardChromeProps = {
	children: ReactNode;
};

export function DashboardChrome({ children }: DashboardChromeProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(
		() =>
			typeof window !== "undefined" &&
			localStorage.getItem("unimart-sidebar-collapsed") === "1",
	);

	useEffect(() => {
		document.documentElement.classList.toggle("sidebar-collapsed", collapsed);
		localStorage.setItem("unimart-sidebar-collapsed", collapsed ? "1" : "0");
	}, [collapsed]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMobileOpen(false);
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		const firstFrame = requestAnimationFrame(() => {
			const secondFrame = requestAnimationFrame(() => {
				document.documentElement.classList.add("sidebar-ready");
			});

			return () => cancelAnimationFrame(secondFrame);
		});

		return () => cancelAnimationFrame(firstFrame);
	}, []);

	const closeSidebar = useCallback(() => setMobileOpen(false), []);
	const toggleCollapsed = useCallback(
		() => setCollapsed((current) => !current),
		[],
	);
	const toggleMobile = useCallback(
		() => setMobileOpen((current) => !current),
		[],
	);

	const contextValue = useMemo(
		() => ({
			closeSidebar,
			collapsed,
			mobileOpen,
			toggleCollapsed,
			toggleMobile,
		}),
		[closeSidebar, collapsed, mobileOpen, toggleCollapsed, toggleMobile],
	);

	return (
		<DashboardChromeContext.Provider value={contextValue}>
			<div
				className="min-h-screen bg-surface-body"
				data-sidebar-open={mobileOpen}
			>
				<Sidebar />
				<div className="flex min-h-screen min-w-0 flex-col lg:pl-sidebar">
					<Header />
					<main className="min-h-[calc(100vh-140px)] min-w-0 flex-1 px-4 py-6 lg:px-6">
						{children}
					</main>
					<Footer />
				</div>
				<button
					aria-label="Close sidebar overlay"
					className={cn(
						"fixed inset-0 z-30 bg-ink-900/40 lg:hidden",
						mobileOpen ? "block" : "hidden",
					)}
					onClick={closeSidebar}
					type="button"
				/>
			</div>
		</DashboardChromeContext.Provider>
	);
}

export function useDashboardChrome() {
	const context = useContext(DashboardChromeContext);

	if (!context) {
		throw new Error("useDashboardChrome must be used within DashboardChrome");
	}

	return context;
}
