"use client";

import { Check, CreditCard, ExternalLink, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import { grantsAccess, PLAN_KEYS, PLANS, TRIAL_DAYS, type PlanKey } from "@/lib/billing/plans";
import { sellerRequest, SellerApiError } from "./sellerApi";
import styles from "./seller.module.css";

type Billing = {
	configured: boolean;
	listings: number;
	required: boolean;
	subscription: {
		cancelAtPeriodEnd: boolean;
		currentPeriodEnd: string | null;
		manageUrl: string;
		plan: PlanKey;
		status: string;
	} | null;
};

const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
const when = (iso: string | null) => (iso ? date.format(new Date(iso)) : "");

/** How the current plan reads, Whop status by Whop status. */
function statusLine(subscription: NonNullable<Billing["subscription"]>) {
	const end = when(subscription.currentPeriodEnd);
	switch (subscription.status) {
		case "trialing":
			return { badge: styles.badgeGreen, label: "Free trial", note: end ? `Trial ends ${end} - your first charge is then.` : "Your free trial is running." };
		case "active":
			return subscription.cancelAtPeriodEnd
				? { badge: styles.badgeAmber, label: "Cancelling", note: end ? `Ends ${end}. Your store goes offline then.` : "Ends at the close of this period." }
				: { badge: styles.badgeGreen, label: "Active", note: end ? `Renews ${end}.` : "Renews automatically." };
		case "past_due":
			return { badge: styles.badgeAmber, label: "Payment failed", note: "Update your card in Manage billing to keep your store online." };
		default:
			return { badge: styles.badgeRed, label: "Ended", note: "Your plan has ended. Pick a plan to bring your store back online." };
	}
}

export default function SellerBilling({ onToast }: { onToast: (message: string) => void }) {
	// A store going live or offline publishes on "resellers", so the plan refreshes itself.
	const resource = useLiveResource<Billing | null>({ endpoint: "/api/seller/billing", initialData: null, topics: ["resellers"] });
	const billing = resource.data;
	const { refresh } = resource;
	const [busy, setBusy] = useState<PlanKey | null>(null);
	// Back from Whop: the webhook usually lands within seconds - keep checking for half a minute.
	const [returned] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkout") === "done");
	const [gaveUp, setGaveUp] = useState(false);
	const hasAccess = grantsAccess(billing?.subscription?.status);
	const returning = returned && !hasAccess && !gaveUp;

	useEffect(() => {
		if (!returning) return;
		const poll = window.setInterval(() => void refresh(), 3000);
		const stop = window.setTimeout(() => setGaveUp(true), 30_000);
		return () => {
			window.clearInterval(poll);
			window.clearTimeout(stop);
		};
	}, [refresh, returning]);

	async function start(plan: PlanKey) {
		setBusy(plan);
		try {
			const { url } = await sellerRequest<{ url: string }>("POST", "/api/seller/billing/checkout", { plan });
			window.location.assign(url);
		} catch (caught) {
			setBusy(null);
			onToast(caught instanceof SellerApiError ? caught.message : "Couldn't open checkout. Please try again.");
		}
	}

	if (resource.error && !billing) {
		return (
			<div className={styles.alert} role="alert">
				{resource.error} <button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => void refresh()} type="button">Try again</button>
			</div>
		);
	}
	if (!billing) {
		return <div className={styles.card}><p className={styles.muted}><Loader2 className={styles.spin} size={16} /> Loading your plan…</p></div>;
	}

	const { subscription } = billing;
	const current = subscription && hasAccess ? PLANS[subscription.plan] : null;
	const status = subscription ? statusLine(subscription) : null;
	const limit = current?.listingLimit ?? null;

	return (
		<div className={styles.stack}>
			{returning ? (
				<p className={styles.success} role="status"><Loader2 className={styles.spin} size={15} /> Confirming your plan - this takes a few seconds.</p>
			) : null}
			{returned && hasAccess ? <p className={styles.success} role="status"><Check size={15} /> Your plan is active - welcome aboard!</p> : null}
			{billing.required && !hasAccess ? (
				<p className={styles.notice} role="alert">
					<strong>Your store is offline.</strong> Start your {TRIAL_DAYS}-day free trial to put it live - cancel any time before it ends and you won&apos;t be charged.
				</p>
			) : null}

			{/* Current plan */}
			<section className={`${styles.card} ${styles.billCurrent}`}>
				<div className={styles.cardHead}>
					<div>
						<p className={styles.billEyebrow}>Current plan</p>
						<h2 className={styles.cardTitle}>
							{current ? `${current.name} - $${current.price}/mo` : billing.required ? "No plan yet" : "Early access - free for now"}
						</h2>
					</div>
					{status ? <span className={status.badge}>{status.label}</span> : null}
				</div>
				<p className={styles.muted}>
					{status?.note ?? (billing.required
						? `Every plan starts with a ${TRIAL_DAYS}-day free trial.`
						: "Plans are coming soon. Your store has full access until then.")}
				</p>
				{current ? (
					<div className={styles.billUsage}>
						<div className={styles.row}>
							<span className={styles.muted}>Products in your store</span>
							<strong>{billing.listings}{limit !== null ? ` / ${limit}` : ""}</strong>
						</div>
						{limit !== null ? (
							<div aria-hidden="true" className={styles.billMeter}>
								<span style={{ width: `${Math.min(100, (billing.listings / limit) * 100)}%` }} />
							</div>
						) : null}
					</div>
				) : null}
				{subscription?.manageUrl ? (
					<a className={`${styles.ghost} ${styles.btnSm} ${styles.billManage}`} href={subscription.manageUrl} rel="noopener noreferrer" target="_blank">
						<CreditCard size={15} /> Manage billing <ExternalLink size={13} />
					</a>
				) : null}
			</section>

			{/* Plans */}
			<div className={styles.billPlans}>
				{PLAN_KEYS.map((key) => {
					const plan = PLANS[key];
					const isCurrent = current?.key === key;
					return (
						<section className={styles.billPlan} data-current={isCurrent || undefined} data-featured={key === "pro" || undefined} key={key}>
							{key === "pro" ? <span className={styles.billTag}>Most popular</span> : null}
							<h3 className={styles.billPlanName}>{plan.name}</h3>
							<p className={styles.billPrice}><strong>${plan.price}</strong> /month</p>
							<p className={styles.muted}>{plan.blurb}</p>
							<ul className={styles.billFeatures}>
								{plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}
							</ul>
							{isCurrent ? (
								<span className={`${styles.badgeGreen} ${styles.billCurrentTag}`}><Check size={13} /> Your plan</span>
							) : hasAccess ? (
								subscription?.manageUrl ? (
									<a className={`${styles.ghost} ${styles.btnBlock}`} href={subscription.manageUrl} rel="noopener noreferrer" target="_blank">
										Switch in Manage billing
									</a>
								) : (
									<p className={styles.muted}>To switch plans, contact support.</p>
								)
							) : (
								<button
									className={`${styles.btn} ${styles.btnBlock}`}
									disabled={!billing.configured || busy !== null}
									onClick={() => void start(key)}
									type="button"
								>
									{busy === key ? <Loader2 className={styles.spin} size={16} /> : null}
									{billing.configured ? `Start ${TRIAL_DAYS}-day free trial` : "Opening soon"}
								</button>
							)}
						</section>
					);
				})}
			</div>
			<p className={`${styles.muted} ${styles.billSecure}`}>
				<Lock size={13} /> Secure checkout and billing. Plans from ${PLANS.starter.price} a month after your free trial - cancel any time.
			</p>
		</div>
	);
}
