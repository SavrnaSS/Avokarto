"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

type UseAdminFormSubmitOptions = {
	endpoint: string;
	method?: "PATCH" | "POST";
	redirectTo: string;
};

function serializeForm(form: HTMLFormElement) {
	const formData = new FormData(form);
	const payload: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};

	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			if (!value.name) {
				continue;
			}

			payload[key] = value.name;
			continue;
		}

		const existing = payload[key];

		if (existing === undefined) {
			payload[key] = value;
		} else if (Array.isArray(existing)) {
			existing.push(value);
		} else {
			payload[key] = [existing, value];
		}
	}

	return payload;
}

export function useAdminFormSubmit({
	endpoint,
	method = "POST",
	redirectTo,
}: UseAdminFormSubmitOptions) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	// Machine-readable error code and offending field (when the API names
	// one), so a form can react to specific failures.
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [errorField, setErrorField] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	// Set once the save succeeded and navigation is under way.
	const [succeeded, setSucceeded] = useState(false);
	const inFlight = useRef(false);

	async function onSubmit(
		event: FormEvent<HTMLFormElement>,
		extraFields?: Record<string, string>,
	) {
		event.preventDefault();
		// Guards double submits (Enter + click) before React re-renders the
		// disabled button.
		if (inFlight.current) return;
		inFlight.current = true;
		setSubmitting(true);
		setError(null);
		setErrorCode(null);
		setErrorField(null);

		try {
			const response = await fetch(endpoint, {
				body: JSON.stringify({
					...serializeForm(event.currentTarget),
					...extraFields,
				}),
				cache: "no-store",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				method,
			});
			const payload = (await response.json().catch(() => ({}))) as {
				error?: { code?: string; details?: { field?: unknown }; message?: string };
			};

			if (!response.ok) {
				setErrorCode(payload.error?.code ?? null);
				setErrorField(
					typeof payload.error?.details?.field === "string"
						? payload.error.details.field
						: null,
				);
				throw new Error(payload.error?.message ?? "Unable to save changes.");
			}

			setSucceeded(true);
			router.replace(redirectTo);
			router.refresh();
		} catch (requestError) {
			setError(
				// fetch() itself rejects with a TypeError when the request never
				// reached the server.
				requestError instanceof TypeError
					? "Couldn't reach the server. Check your connection - your changes are still here - and try again."
					: requestError instanceof Error
						? requestError.message
						: "Unable to save changes.",
			);
		} finally {
			inFlight.current = false;
			setSubmitting(false);
		}
	}

	return {
		error,
		errorCode,
		errorField,
		onSubmit,
		submitting,
		succeeded,
	};
}
