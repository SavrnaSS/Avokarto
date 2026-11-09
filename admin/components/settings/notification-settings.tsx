"use client";

import { type FormEvent, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { cn } from "@/admin/utils/cn";
import type { AdminAlertEvent, AdminAlertSettings } from "@/lib/backend/admin-alerts";

const EVENTS: { description: string; event: AdminAlertEvent; icon: string; label: string }[] = [
	{ description: "Every order placed on the marketplace or a seller's store, with the total.", event: "newOrder", icon: "shopping-bag", label: "New orders" },
	{ description: "When a seller asks to be paid out, with the store and amount.", event: "payoutRequest", icon: "dollar-sign", label: "Payout requests" },
	{ description: "When a customer sends the contact form and a ticket is opened.", event: "newTicket", icon: "life-buoy", label: "Support tickets" },
	{ description: "When a seller opens a new store.", event: "newStore", icon: "store", label: "New seller stores" },
];

type Notice = { text: string; tone: "error" | "ok" };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...init });
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const fieldErrors = payload.error?.details?.fieldErrors as Record<string, string[]> | undefined;
		const first = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
		throw new Error(first ?? payload.error?.message ?? "Something went wrong.");
	}
	return payload.data as T;
}

/** Admin -> Settings -> Notifications: real email alerts (lib/backend/admin-alerts.ts). */
export function NotificationSettingsPage({ initial }: { initial: AdminAlertSettings }) {
	const [saved, setSaved] = useState(initial);
	const [recipients, setRecipients] = useState(initial.recipients.join(", "));
	const [events, setEvents] = useState(initial.events);
	const [saving, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);
	const [notice, setNotice] = useState<Notice | null>(null);

	const dirty = recipients.trim() !== saved.recipients.join(", ") || EVENTS.some(({ event }) => events[event] !== saved.events[event]);

	async function save(event: FormEvent) {
		event.preventDefault();
		setSaving(true);
		setNotice(null);
		try {
			const next = await request<AdminAlertSettings>("/api/admin/notification-settings", {
				body: JSON.stringify({ events, recipients }),
				method: "PATCH",
			});
			setSaved(next);
			setRecipients(next.recipients.join(", "));
			setEvents(next.events);
			setNotice({ text: "Notification settings saved.", tone: "ok" });
		} catch (error) {
			setNotice({ text: error instanceof Error ? error.message : "Couldn't save.", tone: "error" });
		} finally {
			setSaving(false);
		}
	}

	async function sendTest() {
		setTesting(true);
		setNotice(null);
		try {
			const result = await request<{ results: { ok: boolean; to: string }[]; status: "not-configured" | "no-recipients" | "sent" }>(
				"/api/admin/notification-settings/test",
				{ method: "POST" },
			);
			if (result.status === "no-recipients") setNotice({ text: "Add a recipient and save first.", tone: "error" });
			else if (result.status === "not-configured") setNotice({ text: "Email isn't set up on the server yet (RESEND_API_KEY and EMAIL_FROM).", tone: "error" });
			else {
				const failed = result.results.filter((item) => !item.ok).map((item) => item.to);
				setNotice(
					failed.length
						? { text: `Couldn't send to ${failed.join(", ")}. Check the email provider's logs.`, tone: "error" }
						: { text: `Test email sent to ${result.results.map((item) => item.to).join(", ")}.`, tone: "ok" },
				);
			}
		} catch (error) {
			setNotice({ text: error instanceof Error ? error.message : "Couldn't send the test.", tone: "error" });
		} finally {
			setTesting(false);
		}
	}

	const card = "rounded-card border border-surface-line bg-surface-card p-5 shadow-card sm:p-6";

	return (
		<>
			<PageHeader
				description="Email alerts for the things that need an admin - who gets them, and for which events."
				eyebrow="Settings"
				title="Notifications"
			/>
			{!saved.emailConfigured ? (
				<p className="mb-6 flex items-start gap-3 rounded-card border border-warning-500/30 bg-warning-50 px-4 py-3 text-[14px] text-warning-600" role="status">
					<Icon className="mt-0.5 h-4 w-4 shrink-0" name="circle-alert" />
					<span>
						Email isn&apos;t set up on the server yet, so alerts can&apos;t be delivered. Add <code className="font-semibold">RESEND_API_KEY</code> and{" "}
						<code className="font-semibold">EMAIL_FROM</code> to the environment - your choices below are saved and start working once it is.
					</span>
				</p>
			) : null}
			<form className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" onSubmit={(event) => void save(event)}>
				<section className={card}>
					<h2 className="text-[18px] font-semibold text-ink-900">Send an alert for</h2>
					<p className="mt-1 text-[14px] text-ink-500">Each one is a single email, sent the moment it happens.</p>
					<ul className="mt-4 divide-y divide-surface-line">
						{EVENTS.map(({ description, event, icon, label }) => (
							<li key={event}>
								<label className="flex cursor-pointer items-center gap-4 py-4">
									<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
										<Icon className="h-4 w-4" name={icon} />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-[14px] font-semibold text-ink-900">{label}</span>
										<span className="mt-0.5 block text-[13px] text-ink-500">{description}</span>
									</span>
									{/* A switch: the checkbox stays for keyboard and screen readers. */}
									<input
										checked={events[event]}
										className="peer sr-only"
										onChange={(change) => setEvents((current) => ({ ...current, [event]: change.target.checked }))}
										type="checkbox"
									/>
									<span
										aria-hidden="true"
										className={cn(
											"relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2",
											events[event] ? "bg-brand-600" : "bg-surface-muted ring-1 ring-surface-line",
										)}
									>
										<span
											className={cn(
												"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
												events[event] ? "translate-x-[22px]" : "translate-x-0.5",
											)}
										/>
									</span>
								</label>
							</li>
						))}
					</ul>
				</section>

				<aside className={cn(card, "flex flex-col gap-4 self-start")}>
					<div>
						<h2 className="text-[18px] font-semibold text-ink-900">Who gets them</h2>
						<p className="mt-1 text-[14px] text-ink-500">Up to 5 addresses, separated by commas.</p>
					</div>
					<label className="block">
						<span className="sr-only">Alert recipients</span>
						<textarea
							className="min-h-[96px] w-full rounded-base border border-surface-line bg-surface-body px-3 py-2 text-[14px] text-ink-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
							onChange={(change) => setRecipients(change.target.value)}
							placeholder="you@yourstore.com, ops@yourstore.com"
							value={recipients}
						/>
					</label>
					{saved.recipients.length ? null : (
						<p className="text-[13px] text-ink-400">No one receives alerts until you add an address.</p>
					)}
					{notice ? (
						<p
							className={cn("rounded-base px-3 py-2 text-[13px]", notice.tone === "ok" ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500")}
							role={notice.tone === "ok" ? "status" : "alert"}
						>
							{notice.text}
						</p>
					) : null}
					<div className="flex flex-wrap gap-2">
						<button
							className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={saving || !dirty}
							type="submit"
						>
							<Icon className="h-4 w-4" name="save" />
							{saving ? "Saving..." : "Save"}
						</button>
						<button
							className="inline-flex h-11 items-center justify-center gap-2 rounded-base border border-surface-line px-4 text-[14px] font-semibold text-ink-700 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
							disabled={testing || dirty || !saved.recipients.length}
							onClick={() => void sendTest()}
							title={dirty ? "Save your changes first" : undefined}
							type="button"
						>
							<Icon className="h-4 w-4" name="mail" />
							{testing ? "Sending..." : "Send test"}
						</button>
					</div>
				</aside>
			</form>
		</>
	);
}
