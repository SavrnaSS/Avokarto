"use client";

import { useCallback, useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * The browser's "install this site" prompt (Chrome, Edge, Samsung Internet).
 * `install` is null until the browser says the store can be installed.
 */
export function useInstallPrompt() {
	const [event, setEvent] = useState<InstallPromptEvent | null>(null);

	useEffect(() => {
		const onPrompt = (prompt: Event) => {
			prompt.preventDefault();
			setEvent(prompt as InstallPromptEvent);
		};
		const onInstalled = () => setEvent(null);
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	const install = useCallback(async () => {
		if (!event) return;
		await event.prompt();
		await event.userChoice.catch(() => null);
		// A prompt can only be used once.
		setEvent(null);
	}, [event]);

	return event ? install : null;
}
