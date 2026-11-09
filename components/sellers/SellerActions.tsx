"use client";

import { Check, Link2, Share2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SellerApiError, sellerRequest, shareLink } from "@/components/seller/sellerApi";
import { compactNumber } from "./sellerFormat";
import styles from "./sellers.module.css";

/**
 * Follow / Following toggle. Optimistic: flips at once and rolls back if the
 * server says no. Signed-out shoppers are sent to sign in first.
 */
export function FollowButton({
	followers: initialFollowers,
	following: initialFollowing,
	handle,
	name,
	size = "lg",
}: {
	followers: number;
	following: boolean;
	handle: string;
	name: string;
	size?: "lg" | "sm";
}) {
	const router = useRouter();
	const [state, setState] = useState({ followers: initialFollowers, following: initialFollowing });
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();

	const toggle = () => {
		const next = !state.following;
		const previous = state;
		setError("");
		setState({ followers: Math.max(0, state.followers + (next ? 1 : -1)), following: next });
		startTransition(async () => {
			try {
				const result = await sellerRequest<{ followers: number; following: boolean }>(
					next ? "POST" : "DELETE",
					`/api/sellers/${encodeURIComponent(handle)}/follow`,
				);
				setState(result);
				router.refresh();
			} catch (caught) {
				setState(previous);
				if (caught instanceof SellerApiError && caught.code === "UNAUTHENTICATED") {
					router.push("/signin");
					return;
				}
				setError(caught instanceof Error ? caught.message : "Try again.");
			}
		});
	};

	return (
		<span className={styles.followWrap}>
			<button
				aria-label={state.following ? `Unfollow ${name}` : `Follow ${name}`}
				aria-pressed={state.following}
				className={`${styles.followBtn} ${size === "sm" ? styles.followSm : ""}`}
				data-following={state.following || undefined}
				disabled={pending}
				onClick={toggle}
				type="button"
			>
				{state.following ? <Check aria-hidden="true" size={16} /> : <UserPlus aria-hidden="true" size={16} />}
				<span className={styles.followLabel} data-hover="Unfollow">{state.following ? "Following" : "Follow"}</span>
				{size === "lg" ? <span className={styles.followCount}>{compactNumber(state.followers)}</span> : null}
			</button>
			{error ? <span className={styles.inlineError} role="alert">{error}</span> : null}
		</span>
	);
}

/** Native share sheet on phones, copy-to-clipboard elsewhere. */
export function ShareProfileButton({ name, path }: { name: string; path: string }) {
	const [copied, setCopied] = useState(false);
	const share = async () => {
		const result = await shareLink({ text: `Check out ${name} on Avokarto`, title: name, url: `${window.location.origin}${path}` });
		if (result === "copied") {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		}
	};
	return (
		<button aria-label={`Share ${name}`} className={styles.iconBtn} onClick={() => void share()} title="Share profile" type="button">
			{copied ? <Link2 aria-hidden="true" size={18} /> : <Share2 aria-hidden="true" size={18} />}
			<span className={styles.iconBtnText}>{copied ? "Copied" : "Share"}</span>
		</button>
	);
}
