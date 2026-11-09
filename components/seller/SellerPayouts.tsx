"use client";

import { ArrowRight, Banknote, Building2, Check, Clock3, Copy, Info, Landmark, Loader2, ShieldCheck, Smartphone, Wallet, X } from "lucide-react";
import { useId, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import type { Overview } from "./SellerDashboard";
import { money, sellerRequest, SellerApiError } from "./sellerApi";
import styles from "./seller.module.css";

type Payout = {
	adminNote: string;
	amount: number;
	id: string;
	payoutDetails: { method?: string; upiId?: string; accountNumber?: string; bankName?: string };
	processedAt: string | null;
	reference: string;
	requestedAt: string;
	status: "paid" | "rejected" | "requested";
};
const EMPTY: Payout[] = [];
const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });

export default function SellerPayouts({ data, onToast }: { data: Overview; onToast: (message: string) => void }) {
	const id = useId();
	const { balances, settings, store } = data;
	const payouts = useLiveResource<Payout[]>({
		endpoint: "/api/seller/payouts",
		initialData: EMPTY,
		topics: ["resellers"],
	});
	const openRequest = payouts.data.find((payout) => payout.status === "requested");
	// The overview already knows about an open request; don't wait for the
	// history to load before saying so.
	const openAmount = openRequest?.amount ?? (balances.requested > 0 ? balances.requested : null);
	const hasDetails = "method" in store.payoutDetails;
	// Starts at the whole balance: one tap withdraws everything (editable).
	const [amount, setAmount] = useState(() => (balances.withdrawable > 0 ? balances.withdrawable.toFixed(2) : ""));
	const [requesting, setRequesting] = useState(false);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [editingDetails, setEditingDetails] = useState(!hasDetails);

	const blockedReason =
		store.status === "suspended"
			? "Payouts are paused while your store is suspended."
			: store.payoutsBlocked
				? "Payouts are on hold for your store. Contact support for details."
				: openAmount !== null
					? `Your request for ${money(openAmount)} is being processed.`
					: !hasDetails
						? "Add your UPI or bank details under Payout method to withdraw."
						: balances.withdrawable < settings.minPayout
							? `You can withdraw once you have ${money(settings.minPayout)} ready.`
							: null;

	async function request(event: React.FormEvent) {
		event.preventDefault();
		setRequestError(null);
		setRequesting(true);
		try {
			await sellerRequest("POST", "/api/seller/payouts", { amount: Number(amount) });
			setAmount("");
			await payouts.refresh();
			onToast("Payout requested - we'll notify you when it's sent");
		} catch (caught) {
			setRequestError((caught as Error).message);
		} finally {
			setRequesting(false);
		}
	}

	// Where the seller's money is right now, left to right: earning → ready → on its way → paid.
	const flow = [
		{ amount: balances.pending, key: "pending", label: "Pending", note: `Unlocks ${settings.holdDays} days after delivery` },
		{ amount: balances.withdrawable, key: "ready", label: "Ready", note: "Yours to withdraw now" },
		{ amount: balances.requested, key: "processing", label: "Processing", note: "Requested, on its way" },
		{ amount: balances.paid, key: "paid", label: "Paid out", note: "Sent to your account" },
	];
	const flowTotal = flow.reduce((sum, part) => sum + Math.max(0, part.amount), 0);
	const toMinimum = Math.max(0, settings.minPayout - balances.withdrawable);
	const quickAmounts = [
		balances.withdrawable >= settings.minPayout * 2 ? { label: "Half", value: balances.withdrawable / 2 } : null,
		{ label: "All", value: balances.withdrawable },
	].filter((entry): entry is { label: string; value: number } => Boolean(entry));
	const amountNumber = Number(amount);
	const amountProblem =
		amount && Number.isFinite(amountNumber)
			? amountNumber < settings.minPayout
				? `The minimum is ${money(settings.minPayout)}.`
				: amountNumber > balances.withdrawable
					? `You have ${money(balances.withdrawable)} ready.`
					: null
			: null;
	const details = store.payoutDetails;

	return (
		<section className={styles.poPage}>
			<div className={styles.poMain}>
				<form className={styles.poHero} noValidate onSubmit={request}>
					<div className={styles.poHeroTop}>
						<span aria-hidden="true" className={styles.poHeroIcon}><Wallet size={20} /></span>
						<div>
							<p className={styles.poHeroLabel}>Ready to withdraw</p>
							<p className={styles.poHeroValue}>{money(balances.withdrawable)}</p>
						</div>
						<span className={styles.poHeroMin}>Min. {money(settings.minPayout)}</span>
					</div>

					{blockedReason ? (
						<div className={styles.poBlocked} data-tone={openAmount !== null ? "info" : undefined}>
							<p>{openAmount !== null ? <Clock3 aria-hidden="true" size={16} /> : <Info aria-hidden="true" size={16} />} {blockedReason}</p>
							{toMinimum > 0 && openAmount === null && hasDetails && store.status !== "suspended" && !store.payoutsBlocked ? (
								<>
									<span aria-hidden="true" className={styles.poMeter}><span style={{ width: `${Math.min(100, (balances.withdrawable / settings.minPayout) * 100)}%` }} /></span>
									<small>{money(toMinimum)} to go{balances.pending > 0 ? ` · ${money(balances.pending)} is on its way from recent orders` : ""}</small>
								</>
							) : null}
						</div>
					) : (
						<div className={styles.poWithdraw}>
							<label className="visually-hidden" htmlFor={`${id}-amount`}>Amount to withdraw</label>
							<div className={styles.poAmount}>
								<span aria-hidden="true">$</span>
								<input
									aria-describedby={`${id}-amount-msg`}
									aria-invalid={Boolean(requestError || amountProblem) || undefined}
									id={`${id}-amount`}
									inputMode="decimal"
									max={balances.withdrawable}
									min={settings.minPayout}
									onChange={(event) => setAmount(event.target.value)}
									placeholder={balances.withdrawable.toFixed(2)}
									step="0.01"
									type="number"
									value={amount}
								/>
								<div className={styles.poQuick}>
									{quickAmounts.map((entry) => (
										<button aria-pressed={amount === entry.value.toFixed(2)} key={entry.label} onClick={() => setAmount(entry.value.toFixed(2))} type="button">{entry.label}</button>
									))}
								</div>
							</div>
							<button className={styles.poRequest} disabled={requesting || !amount || Boolean(amountProblem)} type="submit">
								{requesting ? <Loader2 className={styles.spin} size={18} /> : <Banknote size={18} />} Request payout
							</button>
							<p className={styles.poHeroNote} id={`${id}-amount-msg`} role={requestError || amountProblem ? "alert" : undefined}>
								{requestError ?? amountProblem ?? `Sent to ${details.method === "upi" ? `UPI ${details.upiId}` : details.method === "bank" ? `${details.bankName} ···${details.accountNumber.slice(-4)}` : "your account"}, usually within 1-3 business days.`}
							</p>
						</div>
					)}
				</form>

				<section className={styles.card}>
					<div className={styles.cardHead}>
						<h2 className={styles.cardTitle}>Payout history</h2>
						{payouts.data.length ? <span className={styles.hint}>{money(balances.paid)} paid in total</span> : null}
					</div>
					{!payouts.hasData ? (
						<div className={styles.skeleton} style={{ height: 72 }} />
					) : payouts.error && !payouts.data.length ? (
						<p className={styles.alert} role="alert">{payouts.error}</p>
					) : !payouts.data.length ? (
						<div className={styles.poEmpty}>
							<span aria-hidden="true"><Banknote size={22} /></span>
							<p><strong>No payouts yet</strong></p>
							<p className={styles.hint}>Once you have {money(settings.minPayout)} ready, request your first payout above.</p>
						</div>
					) : (
						<ol className={styles.poHistory}>
							{payouts.data.map((payout) => <PayoutRow key={payout.id} payout={payout} />)}
						</ol>
					)}
				</section>
			</div>

			<aside className={styles.poSide}>
				<section className={styles.card}>
					<div className={styles.cardHead}>
						<h2 className={styles.cardTitle}>Where your money is</h2>
					</div>
					<div aria-hidden="true" className={styles.poFlowBar}>
						{flowTotal > 0
							? flow.map((part) => (part.amount > 0 ? <span data-part={part.key} key={part.key} style={{ flexGrow: part.amount }} /> : null))
							: <span data-part="empty" />}
					</div>
					<ul className={styles.poFlow}>
						{flow.map((part) => (
							<li data-part={part.key} key={part.key}>
								<i aria-hidden="true" />
								<span>
									<strong>{part.label}</strong>
									<small>{part.note}</small>
								</span>
								<b>{money(part.amount)}</b>
							</li>
						))}
					</ul>
					<p className={styles.poLifetime}>Lifetime earnings <strong>{money(balances.lifetime)}</strong></p>
				</section>

				<section className={styles.card}>
					<div className={styles.cardHead}>
						<h2 className={styles.cardTitle}>Payout method</h2>
						{hasDetails && !editingDetails ? (
							<button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => setEditingDetails(true)} type="button">Change</button>
						) : null}
					</div>
					{hasDetails && !editingDetails ? (
						<div className={styles.poMethod} data-method={details.method}>
							<span aria-hidden="true" className={styles.poMethodIcon}>{details.method === "upi" ? <Smartphone size={18} /> : <Landmark size={18} />}</span>
							<div className={styles.poMethodBody}>
								<small>{details.method === "upi" ? "UPI" : "Bank transfer"}</small>
								<strong>{details.method === "upi" ? details.upiId : details.method === "bank" ? `${details.bankName} ···${details.accountNumber.slice(-4)}` : ""}</strong>
								<span>{"accountName" in details ? details.accountName : ""}{details.method === "bank" ? ` · ${details.ifsc}` : ""}</span>
							</div>
							<ShieldCheck aria-label="Verified details" className={styles.poMethodCheck} size={18} />
						</div>
					) : (
						<PayoutDetailsForm
							onCancel={hasDetails ? () => setEditingDetails(false) : undefined}
							onSaved={() => {
								setEditingDetails(false);
								onToast("Payout details saved");
							}}
						/>
					)}
				</section>

				<section className={`${styles.card} ${styles.poHow}`}>
					<h2 className={styles.cardTitle}>How payouts work</h2>
					<ol>
						<li><span>1</span><p>A shopper&apos;s order is delivered - its margin shows as <strong>Pending</strong>.</p></li>
						<li><span>2</span><p>After the {settings.holdDays}-day return window it becomes <strong>Ready</strong>.</p></li>
						<li><span>3</span><p>Request {money(settings.minPayout)} or more - it&apos;s sent to your {hasDetails && details.method === "bank" ? "bank account" : "UPI or bank account"}.</p></li>
					</ol>
				</section>
			</aside>
		</section>
	);
}

/** One payout: status icon, amount, when it was requested and settled, and its bank reference. */
function PayoutRow({ payout }: { payout: Payout }) {
	const [copied, setCopied] = useState(false);
	const label = payout.status === "paid" ? "Paid" : payout.status === "rejected" ? "Declined" : "Processing";
	return (
		<li className={styles.poRow} data-status={payout.status}>
			<span aria-hidden="true" className={styles.poRowIcon}>
				{payout.status === "paid" ? <Check size={16} strokeWidth={3} /> : payout.status === "rejected" ? <X size={16} strokeWidth={3} /> : <Clock3 size={16} />}
			</span>
			<div className={styles.poRowBody}>
				<div className={styles.poRowTop}>
					<strong>{money(payout.amount)}</strong>
					<span className={payout.status === "paid" ? styles.badgeGreen : payout.status === "rejected" ? styles.badgeRed : styles.badgeAmber}>{label}</span>
				</div>
				<p className={styles.hint}>
					Requested {date.format(new Date(payout.requestedAt))}
					{payout.processedAt ? <> <ArrowRight aria-hidden="true" size={11} /> {label.toLowerCase()} {date.format(new Date(payout.processedAt))}</> : null}
				</p>
				{payout.adminNote ? <p className={styles.poRowNote}>{payout.adminNote}</p> : null}
			</div>
			{payout.reference ? (
				<button
					aria-label={`Copy reference ${payout.reference}`}
					className={styles.poRef}
					onClick={async () => {
						await navigator.clipboard?.writeText(payout.reference);
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1500);
					}}
					title="Copy bank reference"
					type="button"
				>
					<small>Ref</small> {payout.reference} {copied ? <Check size={12} /> : <Copy size={12} />}
				</button>
			) : null}
		</li>
	);
}

function PayoutDetailsForm({ onCancel, onSaved }: { onCancel?: () => void; onSaved: () => void }) {
	const id = useId();
	const [method, setMethod] = useState<"bank" | "upi">("upi");
	const [values, setValues] = useState({ accountName: "", accountNumber: "", bankName: "", ifsc: "", upiId: "" });
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
		setValues((current) => ({ ...current, [key]: event.target.value }));

	async function save(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError(null);
		try {
			await sellerRequest(
				"PUT",
				"/api/seller/payout-details",
				method === "upi"
					? { accountName: values.accountName, method, upiId: values.upiId }
					: { accountName: values.accountName, accountNumber: values.accountNumber, bankName: values.bankName, ifsc: values.ifsc, method },
			);
			onSaved();
		} catch (caught) {
			const apiError = caught as SellerApiError;
			setError({ field: apiError.field, message: apiError.message });
		} finally {
			setSaving(false);
		}
	}

	const input = (key: keyof typeof values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
		<div className={styles.field}>
			<label className={styles.label} htmlFor={`${id}-${key}`}>{label}</label>
			<input aria-invalid={error?.field === key || undefined} className={styles.input} id={`${id}-${key}`} onChange={set(key)} value={values[key]} {...props} />
		</div>
	);

	return (
		<form className={styles.stack} noValidate onSubmit={save}>
			<div className={styles.segment}>
				<button aria-pressed={method === "upi"} onClick={() => setMethod("upi")} type="button"><Smartphone size={14} /> UPI</button>
				<button aria-pressed={method === "bank"} onClick={() => setMethod("bank")} type="button"><Building2 size={14} /> Bank account</button>
			</div>
			{input("accountName", "Account holder name", { autoComplete: "name", placeholder: "As on your bank account" })}
			{method === "upi" ? (
				input("upiId", "UPI ID", { autoCapitalize: "none", placeholder: "name@bank" })
			) : (
				<div className={styles.grid2}>
					{input("bankName", "Bank name", { placeholder: "HDFC Bank" })}
					{input("ifsc", "IFSC code", { autoCapitalize: "characters", maxLength: 11, placeholder: "HDFC0001234" })}
					{input("accountNumber", "Account number", { autoComplete: "off", inputMode: "numeric", maxLength: 20 })}
				</div>
			)}
			{error ? <p className={styles.alert} role="alert">{error.message}</p> : null}
			<p className={styles.hint}>Only Avokarto&apos;s payout team sees the full account number.</p>
			<div className={styles.row}>
				<button className={styles.btn} disabled={saving} type="submit">
					{saving ? <Loader2 className={styles.spin} size={18} /> : null} Save payout details
				</button>
				{onCancel ? <button className={styles.ghost} onClick={onCancel} type="button">Cancel</button> : null}
			</div>
		</form>
	);
}
