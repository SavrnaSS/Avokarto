"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerSession } from "@/hooks/use-customer-session";

export type CustomerAddress = {
	address1: string;
	city: string;
	country: string;
	postcode: string;
};

export type CustomerProfile = {
	alternateAddress: CustomerAddress;
	dateOfBirth: string | null;
	defaultAddress: CustomerAddress;
	email: string;
	locale: string;
	name: string;
	phone: string;
};

type ProfileResponse = {
	profile?: CustomerProfile | null;
};

export function useCustomerProfile() {
	const customer = useCustomerSession((state) => state.customer);
	const [profile, setProfile] = useState<CustomerProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!customer) {
			setProfile(null);
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/account/profile", {
				cache: "no-store",
				credentials: "same-origin",
			});
			const payload = (await response.json().catch(() => ({}))) as ProfileResponse;

			if (!response.ok) {
				throw new Error("Unable to load account info.");
			}

			setProfile(payload.profile ?? null);
			setError(null);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to load account info.",
			);
		} finally {
			setLoading(false);
		}
	}, [customer]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void refresh();
	}, [refresh]);

	return { error, loading, profile, refresh };
}
