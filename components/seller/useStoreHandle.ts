"use client";

import { useEffect, useState } from "react";
import { handleProblem, suggestHandle } from "@/lib/resellerPricing";

type Availability = { available: boolean | null; handle: string; reason: string | null } | null;

const UNCHECKED_MESSAGE = "We couldn’t check this link. We’ll confirm it when you open your store.";

/**
 * A store's link, derived from its name until the seller edits it, checked
 * live (debounced) against the server. Shared by opening a store (/start)
 * and editing it (Settings). `current` is the store's own link, which is
 * always fine to keep.
 */
export function useStoreHandle(name: string, current?: string) {
	const [typed, setTyped] = useState(current ?? "");
	const [touched, setTouched] = useState(Boolean(current));
	const [availability, setAvailability] = useState<Availability>(null);

	const handle = touched ? typed : suggestHandle(name);
	const problem = handle ? handleProblem(handle) : null;
	const needsCheck = Boolean(handle) && !problem && handle !== current;
	// Only an answer about the link currently shown counts.
	const answer = availability?.handle === handle ? availability : null;
	const checking = needsCheck && !answer;

	useEffect(() => {
		if (!needsCheck) return;
		const controller = new AbortController();
		let active = true;
		let timeout: number | undefined;
		const timer = window.setTimeout(async () => {
			// A slow or disconnected request must not leave the form blocked.
			timeout = window.setTimeout(() => controller.abort(), 8000);
			try {
				const response = await fetch(`/api/seller/handle?handle=${encodeURIComponent(handle)}`, {
					credentials: "same-origin",
					signal: controller.signal,
				});
				if (!response.ok) throw new Error("Availability check failed");
				const payload = (await response.json()) as { data?: { available?: unknown; reason?: unknown } } | null;
				if (typeof payload?.data?.available !== "boolean") throw new Error("Invalid availability response");
				if (active) {
					setAvailability({
						available: payload.data.available,
						handle,
						reason: typeof payload.data.reason === "string" ? payload.data.reason : null,
					});
				}
			} catch {
				// Only the current request may settle; save re-checks unknown links.
				if (active) setAvailability({ available: null, handle, reason: UNCHECKED_MESSAGE });
			} finally {
				window.clearTimeout(timeout);
			}
		}, 350);
		return () => {
			active = false;
			controller.abort();
			window.clearTimeout(timer);
			window.clearTimeout(timeout);
		};
	}, [handle, needsCheck]);

	const message = problem
		? { ok: false, text: problem }
		: handle === current
			? null
			: answer && answer.available !== null
				? { ok: answer.available, text: answer.available ? "This link is yours to take." : answer.reason ?? "Taken." }
				: null;

	return {
		checkError: answer?.available === null ? UNCHECKED_MESSAGE : null,
		checking,
		handle,
		message,
		problem,
		/** Ready to save: no local problem and not known to be taken. */
		usable: Boolean(handle) && !problem && answer?.available !== false,
		setHandle(raw: string) {
			setTouched(true);
			setTyped(raw.toLowerCase().replace(/[^a-z0-9-]/g, ""));
		},
	};
}
