"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { adminBranding } from "@/admin/config/branding";
import { routes } from "@/admin/config/routes";

type AdminSignInFormProps = {
	nextPath?: string;
};

function safeNextPath(value?: string) {
	if (!value || !value.startsWith("/admin") || value.startsWith("/admin/signin")) {
		return routes.dashboard;
	}

	return value;
}

export function AdminSignInForm({ nextPath }: AdminSignInFormProps) {
	const [email, setEmail] = useState("admin@avokarto.local");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/login", {
				body: JSON.stringify({ email, password }),
				cache: "no-store",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			});
			const payload = (await response.json().catch(() => ({}))) as {
				error?: { message?: string };
			};

			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Unable to sign in.");
			}

			// A hard navigation, not router.replace(), because this page's own
			// links (e.g. the mobile dashboard logo) may have already prefetched
			// this exact path while signed out. Next.js's client Router Cache can
			// replay that stale prefetch - which still resolves to a signin
			// redirect - instead of re-checking proxy.ts now that the session
			// cookie is set, leaving the user stuck on this page.
			window.location.assign(safeNextPath(nextPath));
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to sign in.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="w-full max-w-[440px]">
			{/*
			 * Below lg the auth panel still shows the dark green brand backdrop
			 * (it only resets to a plain white background at the lg breakpoint,
			 * see .admin-brand-auth-panel in globals.css), so this row needs
			 * light text/logo there and dark text once it's sitting on white at
			 * lg+. On desktop the back link lands top-left of the white panel -
			 * the hero panel already owns its own top-left logo (and the mobile
			 * logo here hides), so nothing competes for the same space.
			 */}
			<div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 lg:mb-8">
				<Link
					className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white lg:text-ink-500 lg:hover:text-ink-700"
					href="/"
				>
					<Icon className="h-4 w-4" name="arrow-left" />
					Back to store
				</Link>

				<Link
					aria-label={adminBranding.dashboardLabel}
					className="inline-flex items-center gap-2 lg:hidden"
					href={routes.dashboard}
				>
					<Image
						alt={adminBranding.logoAlt}
						className="h-9 w-9 rounded-base object-contain"
						height={36}
						priority
						src={adminBranding.logo.mark}
						width={36}
					/>
					<span className="text-[18px] font-semibold text-white">
						{adminBranding.name}
					</span>
				</Link>
			</div>

			<form
				className="rounded-card border border-surface-line bg-surface-card p-6 shadow-card"
				onSubmit={(event) => void handleSubmit(event)}
			>
				<p className="mb-1 text-[13px] font-semibold uppercase text-brand-600">
					Welcome back
				</p>
				<h1 className="text-[26px] font-semibold text-ink-900">
					Sign in to admin
				</h1>
				<p className="mt-2 text-[14px] text-ink-500">
					Use your production admin account to manage store operations.
				</p>

				<div className="mt-6 space-y-4">
					<label className="block">
						<span className="text-[14px] font-semibold text-ink-700">
							Email address
						</span>
						<input
							autoComplete="email"
							className="mt-2 h-11 w-full rounded-base border border-surface-line bg-surface-body px-4 text-[14px] focus:border-brand-600"
							onChange={(event) => setEmail(event.target.value)}
							required
							type="email"
							value={email}
						/>
					</label>
					<label className="block">
						<span className="text-[14px] font-semibold text-ink-700">
							Password
						</span>
						<input
							autoComplete="current-password"
							className="mt-2 h-11 w-full rounded-base border border-surface-line bg-surface-body px-4 text-[14px] focus:border-brand-600"
							onChange={(event) => setPassword(event.target.value)}
							required
							type="password"
							value={password}
						/>
					</label>
				</div>

				<div className="mt-5 flex items-center justify-between gap-3 text-[14px]">
					<label className="flex items-center gap-2 text-ink-600">
						<input
							className="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600"
							defaultChecked
							name="remember"
							type="checkbox"
						/>
						Remember me
					</label>
					<Link
						className="font-semibold text-brand-600 hover:text-brand-700"
						href={routes.signIn}
					>
						Forgot password?
					</Link>
				</div>

				{error ? (
					<p className="mt-4 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
						{error}
					</p>
				) : null}

				<button
					className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-base bg-brand-600 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
					disabled={submitting}
					type="submit"
				>
					{submitting ? "Signing in..." : "Sign In"}
				</button>
			</form>
		</div>
	);
}
