"use client";

import { CheckCircle2, Copy, ExternalLink, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import { SellerApiError, sellerRequest } from "./sellerApi";
import styles from "./seller.module.css";

type DomainState = {
	apexNote?: string | null;
	domain: {
		domain: string;
		lastCheckedAt: string | null;
		lastError: string;
		status: "active" | "failed" | "pending";
		verifiedAt: string | null;
	} | null;
	records: { name: string; purpose: string; type: string; value: string }[];
	target: string;
};

const time = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function CopyCell({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className={styles.dnsValue}>
			<code>{value}</code>
			<button
				aria-label={`Copy ${value}`}
				className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`}
				onClick={async () => {
					await navigator.clipboard?.writeText(value);
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1500);
				}}
				type="button"
			>
				{copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
			</button>
		</div>
	);
}

const STEPS = ["Add your domain", "Point DNS records", "Live on your domain"];

/** Where the seller is in connecting a domain: 1 add it, 2 set DNS, 3 live. */
function DomainSteps({ step, failed = false }: { failed?: boolean; step: 1 | 2 | 3 }) {
	return (
		<ol aria-label="Connection progress" className={styles.domainSteps}>
			{STEPS.map((label, index) => {
				const number = index + 1;
				const state = number < step || step === 3 ? "done" : number === step ? (failed ? "failed" : "current") : "todo";
				return (
					<li aria-current={state === "current" || state === "failed" ? "step" : undefined} data-state={state} key={label}>
						<span aria-hidden="true">{state === "done" ? <CheckCircle2 size={14} /> : number}</span>
						{label}
					</li>
				);
			})}
		</ol>
	);
}

/** Connect shop.yourbrand.com to the store: add it, create two DNS records, verify. */
export default function CustomDomainCard({ onToast }: { onToast: (message: string) => void }) {
	const id = useId();
	// Live: an admin disconnecting the domain shows up here immediately.
	const resource = useLiveResource<DomainState | null>({
		endpoint: "/api/seller/domain",
		initialData: null,
		topics: ["resellers"],
	});
	// The latest action's result wins until the live resource catches up.
	const [actionResult, setState] = useState<DomainState | null>(null);
	const state = actionResult ?? resource.data;
	const [input, setInput] = useState("");
	const [busy, setBusy] = useState<"check" | "remove" | "save" | null>(null);
	const [actionError, setError] = useState<string | null>(null);
	const error = actionError ?? resource.error;

	async function run(kind: "check" | "remove" | "save", action: () => Promise<DomainState>, message?: (next: DomainState) => string) {
		setBusy(kind);
		setError(null);
		try {
			const next = await action();
			setState(next);
			void resource.refresh().then(() => setState(null));
			const text = message?.(next);
			if (text) onToast(text);
		} catch (caught) {
			setError((caught as SellerApiError).message);
		} finally {
			setBusy(null);
		}
	}

	if (!state) {
		return error ? <p className={styles.alert} role="alert">{error}</p> : <div className={styles.skeleton} style={{ height: 120 }} />;
	}

	const domain = state.domain;

	if (!domain) {
		return (
			<form
				className={styles.stack}
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					void run("save", () => sellerRequest<DomainState>("PUT", "/api/seller/domain", { domain: input }), () => "Domain added - now add the DNS records");
				}}
			>
				<DomainSteps step={1} />
				<p className={styles.muted}>
					Use your own web address, like <strong>shop.yourbrand.com</strong>. You&apos;ll need access to your
					domain&apos;s DNS settings (GoDaddy, Namecheap, Cloudflare, Hostinger…).
				</p>
				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-domain`}>Your domain</label>
					<div className={styles.inputGroup}>
						<span className={styles.prefix}>https://</span>
						<input
							aria-invalid={Boolean(error) || undefined}
							autoCapitalize="none"
							autoCorrect="off"
							className={styles.input}
							id={`${id}-domain`}
							inputMode="url"
							onChange={(event) => setInput(event.target.value)}
							placeholder="shop.yourbrand.com"
							spellCheck={false}
							value={input}
						/>
					</div>
				</div>
				{error ? <p className={styles.alert} role="alert">{error}</p> : null}
				<button className={styles.btn} disabled={busy !== null || !input.trim()} type="submit">
					{busy === "save" ? <Loader2 className={styles.spin} size={18} /> : <Globe size={18} />} Connect domain
				</button>
			</form>
		);
	}

	const live = domain.status === "active";
	return (
		<div className={styles.stack}>
			<DomainSteps failed={domain.status === "failed"} step={live ? 3 : 2} />
			<div className={styles.row} style={{ justifyContent: "space-between" }}>
				<div className={styles.row} style={{ gap: 8 }}>
					<Globe size={20} />
					<strong style={{ fontSize: 17 }}>{domain.domain}</strong>
					<span className={live ? styles.badgeGreen : domain.status === "failed" ? styles.badgeRed : styles.badgeAmber}>
						{live ? "Live" : domain.status === "failed" ? "Needs attention" : "Waiting for DNS"}
					</span>
				</div>
				{live ? (
					<a className={`${styles.ghost} ${styles.btnSm}`} href={`https://${domain.domain}`} rel="noopener" target="_blank">
						<ExternalLink size={14} /> Open
					</a>
				) : null}
			</div>

			{live ? (
				<p className={styles.success}>
					Your store is live at <strong>https://{domain.domain}</strong>. Share links now use it, and your Avokarto
					link keeps working too.
				</p>
			) : (
				<>
					<p className={styles.muted}>
						Add these two records in your domain&apos;s DNS settings, then press <strong>Check DNS</strong>. Changes
						usually show up within minutes but can take up to 48 hours.
					</p>
					<div className={styles.dnsTable} role="table" aria-label="DNS records to add">
						<div className={styles.dnsHead} role="row">
							<span role="columnheader">Type</span>
							<span role="columnheader">Name / Host</span>
							<span role="columnheader">Value / Points to</span>
						</div>
						{state.records.map((record) => (
							<div className={styles.dnsRow} key={record.type} role="row">
								<span role="cell"><span className={styles.badge}>{record.type}</span></span>
								<span role="cell"><CopyCell value={record.name} /></span>
								<span role="cell">
									<CopyCell value={record.value} />
									<span className={styles.hint}>{record.purpose}</span>
								</span>
							</div>
						))}
					</div>
					{state.apexNote ? <p className={styles.notice}>{state.apexNote}</p> : null}
					{domain.lastError ? <p className={styles.notice} role="status">{domain.lastError}</p> : null}
				</>
			)}

			{domain.lastCheckedAt ? <p className={styles.hint}>Last checked {time.format(new Date(domain.lastCheckedAt))}</p> : null}
			{error ? <p className={styles.alert} role="alert">{error}</p> : null}

			<div className={styles.row}>
				<button
					className={live ? styles.ghost : styles.btn}
					disabled={busy !== null}
					onClick={() =>
						void run("check", () => sellerRequest<DomainState>("POST", "/api/seller/domain/check"), (next) =>
							next.domain?.status === "active" ? "Domain verified - your store is live on it!" : "DNS checked - see what's still missing",
						)
					}
					type="button"
				>
					{busy === "check" ? <Loader2 className={styles.spin} size={18} /> : <RefreshCw size={18} />} {live ? "Re-check DNS" : "Check DNS"}
				</button>
				<button
					className={styles.danger}
					disabled={busy !== null}
					onClick={() => {
						if (window.confirm(`Disconnect ${domain.domain}? Visitors to it will no longer reach your store.`)) {
							void run("remove", () => sellerRequest<DomainState>("DELETE", "/api/seller/domain"), () => "Domain disconnected");
						}
					}}
					type="button"
				>
					<Trash2 size={16} /> Disconnect
				</button>
			</div>
		</div>
	);
}
