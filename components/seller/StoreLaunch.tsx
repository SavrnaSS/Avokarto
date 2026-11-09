"use client";

import { ArrowRight, Check, CircleAlert, ExternalLink, Globe, Loader2, LoaderCircle, Lock, Palette, RotateCcw, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { StoreTheme } from "@/lib/storeThemes";
import DeviceScene from "./DeviceScene";
import d from "./device-scene.module.css";
import s from "./launch.module.css";

export type StoreLaunchPhase = "creating" | "branding" | "ready" | "branding-error";

type StoreLaunchProps = {
	phase: StoreLaunchPhase;
	name: string;
	handle: string;
	/** Shown before the link, e.g. "avokarto.com". */
	host: string;
	theme: StoreTheme;
	accent: string;
	margin: number;
	error?: string;
	onRetryBranding: () => void;
	onDashboard: () => void;
	/** When set, the ready screen's main button does this instead (e.g. start the plan's free trial). */
	primaryAction?: { busy?: boolean; error?: string; label: string; note?: string; onClick: () => void };
	/** Adds the tablet to the devices; for wide screens. */
	wide?: boolean;
};

const PHASES = [
	{ icon: Store, label: "Creating your store", detail: "A home for your brand" },
	{ icon: Palette, label: "Applying your look", detail: "Your theme and colour" },
	{ icon: Globe, label: "Your store is ready", detail: "Your link is ready to share" },
] as const;

/**
 * The last page of the builder, in the same shell: the panel follows the real
 * API work, and the same devices show the store it creates. Only the caller
 * can advance progress or declare the store ready.
 */
export default function StoreLaunch({ phase, name, handle, host, theme, accent, margin, error, onRetryBranding, onDashboard, primaryAction, wide = false }: StoreLaunchProps) {
	const ready = phase === "ready";
	const brandingError = phase === "branding-error";
	const pending = phase === "creating" || phase === "branding";
	const phaseIndex = phase === "creating" ? 0 : ready ? 2 : 1;
	const heading = useRef<HTMLHeadingElement>(null);
	const storeName = name.trim() || "Your store";
	const status = ready
		? "Your store is ready."
		: brandingError
			? "Your store was created. Your chosen look still needs to be applied."
			: PHASES[phaseIndex].label;

	useEffect(() => {
		heading.current?.focus({ preventScroll: true });
	}, [ready, brandingError]);

	return (
		<section aria-labelledby="store-launch-title" className={s.scene} data-launch-phase={phase} data-phase={phase}>
			<header className={s.top}>
				<span aria-label="Avokarto Store Studio" className={s.brand}>
					<Image alt="" height={32} src="/assets/images/logo/avokarto-logo-mark.webp" width={32} />
					<span>avokarto<small>Store studio</small></span>
				</span>
			</header>

			<div className={s.grid}>
				<div aria-hidden="true" className={s.canvas}>
					<div className={d.stage}>
						<div className={d.bar}>
							<span className={s.url}><Lock size={12} /><span>{host}/store/<b>{handle || "your-store"}</b></span></span>
						</div>
						<div className={d.sceneSlot}><DeviceScene accent={accent} changeKey={phase} focus="top" margin={margin} name={storeName} tablet={wide} theme={theme} /></div>
					</div>
				</div>

				<div className={s.panel}>
					<h1 className={s.title} id="store-launch-title" ref={heading} tabIndex={-1}>
						{ready ? "Your store is ready" : brandingError ? "Your store is created. One last step" : `Opening ${storeName}`}
					</h1>
					<p className={s.intro}>
						{ready
							? <><strong>{storeName}</strong> has its own link now. Step inside and make it yours.</>
							: brandingError
								? "Retry your chosen style, or finish the look from your dashboard."
								: "Keep this tab open while we set it up."}
					</p>

					<ol aria-busy={pending} aria-label="Store creation progress" className={s.phases}>
						{PHASES.map(({ icon: Icon, label, detail }, index) => {
							const complete = index < phaseIndex || ready;
							const current = index === phaseIndex && !ready;
							const failed = current && brandingError;
							return (
								<li aria-current={current ? "step" : undefined} data-state={complete ? "complete" : failed ? "error" : current ? "active" : "waiting"} key={label}>
									<span aria-hidden="true" className={s.phaseIcon}>
										{complete ? <Check size={16} /> : failed ? <CircleAlert size={16} /> : current ? <LoaderCircle className={s.spin} size={16} /> : <Icon size={16} />}
									</span>
									<span className={s.phaseText}>
										<strong>{label}</strong>
										<small>{failed ? "Your store is saved; styling needs a retry" : detail}</small>
									</span>
									{complete ? <span className={s.srOnly}> - complete</span> : null}
								</li>
							);
						})}
					</ol>
					<p aria-atomic="true" aria-live="polite" className={s.srOnly} role="status">{status}</p>

					{brandingError ? <p className={s.error} role="alert">{error || "We couldn’t save your chosen theme. You can retry without creating another store."}</p> : null}
					{ready && primaryAction?.error ? <p className={s.error} role="alert">{primaryAction.error}</p> : null}
					{ready || brandingError ? (
						<div className={s.actions}>
							{ready && primaryAction ? (
								<button className={s.primary} disabled={primaryAction.busy} onClick={primaryAction.onClick} type="button">
									{primaryAction.busy ? <Loader2 className={s.spin} size={17} /> : null} {primaryAction.label} {primaryAction.busy ? null : <ArrowRight size={17} />}
								</button>
							) : (
								<button className={s.primary} onClick={brandingError ? onRetryBranding : onDashboard} type="button">
									{brandingError ? <><RotateCcw size={17} /> Retry styling</> : <>Enter my dashboard <ArrowRight size={17} /></>}
								</button>
							)}
							{ready ? (
								<Link className={s.secondary} href={`/store/${encodeURIComponent(handle)}`}>View my store <ExternalLink size={16} /></Link>
							) : (
								<button className={s.secondary} onClick={onDashboard} type="button">Continue to dashboard <ArrowRight size={16} /></button>
							)}
						</div>
					) : null}
					{ready && primaryAction?.note ? <p className={s.note}>{primaryAction.note}</p> : null}
				</div>
			</div>
		</section>
	);
}
