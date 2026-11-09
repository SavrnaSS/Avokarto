"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { marginProblem, maxMargin, resellerPrice, type MarginType } from "@/lib/resellerPricing";
import { money, type SellerSettings } from "./sellerApi";
import styles from "./seller.module.css";

/**
 * Set a product's margin with a live "customer pays / you earn" preview.
 * The same pricing helper runs on the server, so the preview is exact.
 */
export default function MarginSheet({
	basePrice,
	initialType = "percent",
	initialValue,
	onClose,
	onSave,
	productName,
	saveLabel,
	settings,
}: {
	basePrice: number;
	initialType?: MarginType;
	initialValue: number;
	onClose: () => void;
	onSave: (marginType: MarginType, marginValue: number) => Promise<void>;
	productName: string;
	saveLabel: string;
	settings: SellerSettings;
}) {
	const id = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [type, setType] = useState<MarginType>(initialType);
	const [value, setValue] = useState(String(initialValue));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const numeric = value.trim() === "" ? Number.NaN : Number(value);
	const problem = marginProblem(basePrice, type, numeric, settings.maxMarginPercent);
	const price = resellerPrice(basePrice, type, Number.isFinite(numeric) ? numeric : 0, settings);
	const cap = maxMargin(basePrice, settings.maxMarginPercent);

	useEffect(() => {
		inputRef.current?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = overflow;
		};
	}, [onClose]);

	async function save(event: React.FormEvent) {
		event.preventDefault();
		if (problem) return;
		setSaving(true);
		setError(null);
		try {
			await onSave(type, numeric);
		} catch (caught) {
			setError((caught as Error).message);
			setSaving(false);
		}
	}

	return (
		<div className={styles.overlay} onClick={(event) => event.target === event.currentTarget && onClose()}>
			<form aria-labelledby={`${id}-title`} aria-modal="true" className={`${styles.sheet} ${styles.stack}`} onSubmit={save} role="dialog">
				<div className={styles.cardHead} style={{ marginBottom: 0 }}>
					<div style={{ minWidth: 0 }}>
						<p className={styles.hint}>Set your margin</p>
						<h2 className={styles.cardTitle} id={`${id}-title`}>{productName}</h2>
					</div>
					<button aria-label="Close" className={`${styles.ghost} ${styles.btnSm}`} onClick={onClose} type="button">
						<X size={16} />
					</button>
				</div>

				<div className={styles.segment}>
					{(["percent", "fixed"] as const).map((option) => (
						<button
							aria-pressed={type === option}
							key={option}
							onClick={() => {
								// Keep the same earning when switching units.
								if (option !== type && Number.isFinite(numeric)) {
									setValue(
										option === "fixed"
											? (basePrice * (numeric / 100)).toFixed(2)
											: basePrice > 0 ? String(Math.round((numeric / basePrice) * 100)) : "0",
									);
								}
								setType(option);
							}}
							type="button"
						>
							{option === "percent" ? "Percentage %" : "Fixed amount $"}
						</button>
					))}
				</div>

				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-value`}>
						{type === "percent" ? "Margin (%)" : "Margin ($ per unit)"}
					</label>
					<div className={styles.inputGroup}>
						<input
							aria-describedby={`${id}-help`}
							aria-invalid={Boolean(problem && value) || undefined}
							className={styles.input}
							id={`${id}-value`}
							inputMode="decimal"
							min={0}
							onChange={(event) => setValue(event.target.value)}
							ref={inputRef}
							step={type === "percent" ? 1 : 0.01}
							type="number"
							value={value}
						/>
						<span className={styles.addon}>{type === "percent" ? "%" : "USD"}</span>
					</div>
					<p className={problem && value ? styles.error : styles.hint} id={`${id}-help`}>
						{problem && value ? problem : `Up to ${settings.maxMarginPercent}% (${money(cap)}) on this product.`}
					</p>
					{type === "percent" ? (
						<input
							aria-label="Margin percentage"
							className={styles.slider}
							max={settings.maxMarginPercent}
							min={0}
							onChange={(event) => setValue(event.target.value)}
							type="range"
							value={Number.isFinite(numeric) ? Math.min(numeric, settings.maxMarginPercent) : 0}
						/>
					) : null}
				</div>

				<div aria-live="polite" className={styles.preview}>
					<div className={styles.previewRow}><span>Avokarto price</span><strong>{money(basePrice)}</strong></div>
					<div className={styles.previewRow}><span>Your margin</span><strong>+ {money(price.margin)}</strong></div>
					<div className={styles.previewRow}><span>Customer pays</span><strong>{money(price.salePrice)}</strong></div>
					{price.platformFee > 0 ? (
						<div className={styles.previewRow}><span>Platform fee ({settings.platformFeePercent}%)</span><strong>− {money(price.platformFee)}</strong></div>
					) : null}
					<div className={styles.previewTotal}><span>You earn per sale</span><strong>{money(price.net)}</strong></div>
				</div>

				{error ? <p className={styles.alert} role="alert">{error}</p> : null}
				<button className={`${styles.btn} ${styles.btnBlock}`} disabled={saving || Boolean(problem)} type="submit">
					{saving ? <Loader2 className={styles.spin} size={18} /> : null}
					{saveLabel}
				</button>
			</form>
		</div>
	);
}
