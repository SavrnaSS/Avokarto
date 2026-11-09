"use client";

import { Check, Loader2, Palette, Store } from "lucide-react";
import { useId, useState } from "react";
import SaveBar from "./SaveBar";
import { money, SellerApiError, sellerRequest, type SellerSettings, type SellerStore } from "./sellerApi";
import { useStoreHandle } from "./useStoreHandle";
import styles from "./seller.module.css";

export const STORE_ACCENTS = ["#3E8315", "#0F766E", "#1D4ED8", "#7C3AED", "#BE185D", "#C2410C", "#111827"];

export function initialsOf(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "S";
}

// Example product price for the "you earn" line under the margin slider.
const EXAMPLE_PRICE = 25;

/**
 * Edit the store's details from Settings (opening a store has its own
 * guided flow on /start). The store link is checked live as it's typed,
 * and the header preview updates with every change. Colour lives in Store
 * design (ThemeStudio) so the two can't overwrite each other.
 */
export default function StoreForm({
	onSaved,
	settings,
	store,
}: {
	onSaved: (store: SellerStore) => void;
	settings: SellerSettings;
	store: SellerStore;
}) {
	const id = useId();
	const [name, setName] = useState(store.name);
	const link = useStoreHandle(name, store.handle);
	const [tagline, setTagline] = useState(store.tagline);
	const [whatsapp, setWhatsapp] = useState(store.whatsapp);
	const [margin, setMargin] = useState(Math.min(store.defaultMarginPercent, settings.maxMarginPercent));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	// Last saved values - what "Discard" goes back to and what "dirty" compares against.
	const [base, setBase] = useState(() => ({
		handle: store.handle,
		margin: Math.min(store.defaultMarginPercent, settings.maxMarginPercent),
		name: store.name,
		tagline: store.tagline,
		whatsapp: store.whatsapp,
	}));
	const dirty =
		name !== base.name || link.handle !== base.handle || tagline !== base.tagline || whatsapp !== base.whatsapp || margin !== base.margin;

	function discard() {
		setName(base.name);
		link.setHandle(base.handle);
		setTagline(base.tagline);
		setWhatsapp(base.whatsapp);
		setMargin(base.margin);
		setError(null);
	}

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		if (name.trim().length < 2) {
			setError({ field: "name", message: "Give your store a name (at least 2 characters)." });
			return;
		}
		if (link.problem) {
			setError({ field: "handle", message: link.problem });
			return;
		}
		setSaving(true);
		try {
			const saved = await sellerRequest<SellerStore>("PATCH", "/api/seller/store", {
				defaultMarginPercent: margin,
				handle: link.handle,
				name: name.trim(),
				tagline: tagline.trim(),
				whatsapp: whatsapp.trim(),
			});
			setBase({ handle: saved.handle, margin: saved.defaultMarginPercent, name: saved.name, tagline: saved.tagline, whatsapp: saved.whatsapp });
			setName(saved.name);
			link.setHandle(saved.handle);
			setTagline(saved.tagline);
			setWhatsapp(saved.whatsapp);
			setMargin(saved.defaultMarginPercent);
			onSaved(saved);
		} catch (caught) {
			const apiError = caught as SellerApiError;
			setError({ field: apiError.field, message: apiError.message });
		} finally {
			setSaving(false);
		}
	}

	const host = typeof window === "undefined" ? "avokarto.com" : window.location.host;

	return (
		<form className={styles.stack} noValidate onSubmit={submit}>
			{/* Live preview of the storefront header. */}
			<div className={styles.storeHeader} style={{ "--accent": store.accentColor } as React.CSSProperties} aria-hidden="true">
				<div className={styles.storeIdentity}>
					<span className={styles.avatar}>{initialsOf(name || "My Store")}</span>
					<div style={{ minWidth: 0 }}>
						<p className={styles.storeName}>{name || "Your store name"}</p>
						<p style={{ fontSize: 14 }}>{tagline || "A short line about what you sell"}</p>
					</div>
				</div>
				<div className={styles.linkPill}>
					<Store size={16} />
					<span>{host}/store/{link.handle || "your-store"}</span>
				</div>
			</div>

			<div className={styles.grid2} style={{ alignItems: "start" }}>
				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-name`}>Store name</label>
					<input
						aria-invalid={error?.field === "name" || undefined}
						autoComplete="organization"
						className={styles.input}
						id={`${id}-name`}
						maxLength={60}
						onChange={(event) => setName(event.target.value)}
						placeholder="e.g. Riya's Picks"
						value={name}
					/>
				</div>

				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-handle`}>Store link</label>
					<div className={styles.inputGroup}>
						<span className={styles.prefix}>/store/</span>
						<input
							aria-describedby={`${id}-handle-msg`}
							aria-invalid={error?.field === "handle" || link.message?.ok === false || undefined}
							autoCapitalize="none"
							autoCorrect="off"
							className={styles.input}
							id={`${id}-handle`}
							maxLength={40}
							onChange={(event) => link.setHandle(event.target.value)}
							placeholder="riyas-picks"
							spellCheck={false}
							value={link.handle}
						/>
						{link.checking || link.message?.ok ? (
							<span className={styles.addon} aria-hidden="true">
								{link.checking ? <Loader2 className={styles.spin} size={16} /> : <Check size={16} color="#3e8315" />}
							</span>
						) : null}
					</div>
					<p aria-live="polite" className={link.message?.ok ? styles.ok : link.message ? styles.error : styles.hint} id={`${id}-handle-msg`}>
						{link.message?.text ?? "Lowercase letters, numbers and dashes. You can change it later."}
					</p>
				</div>
			</div>

			<div className={styles.field}>
				<label className={styles.label} htmlFor={`${id}-tagline`}>Tagline <span className={styles.hint}>(optional)</span></label>
				<input
					className={styles.input}
					id={`${id}-tagline`}
					maxLength={140}
					onChange={(event) => setTagline(event.target.value)}
					placeholder="Handpicked home finds, delivered to your door"
					value={tagline}
				/>
			</div>

			<div className={styles.grid2}>
				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-wa`}>WhatsApp number <span className={styles.hint}>(optional)</span></label>
					<input
						aria-invalid={error?.field === "whatsapp" || undefined}
						autoComplete="tel"
						className={styles.input}
						id={`${id}-wa`}
						inputMode="tel"
						maxLength={20}
						onChange={(event) => setWhatsapp(event.target.value.replace(/[^\d+ ]/g, ""))}
						placeholder="+91 98765 43210"
						value={whatsapp}
					/>
					<p className={styles.hint}>Shoppers can message you from your store.</p>
				</div>
				<div className={styles.field}>
					<span className={styles.label}>Store colour</span>
					<a className={styles.colourLink} href="#store-design">
						<span aria-hidden="true" style={{ background: store.accentColor }} />
						<span>
							<strong>{store.accentColor.toUpperCase()}</strong>
							<small>Change colour &amp; theme in Store design</small>
						</span>
						<Palette aria-hidden="true" size={16} />
					</a>
				</div>
			</div>

			<div className={styles.field}>
				<label className={styles.label} htmlFor={`${id}-margin`}>
					Default margin: <strong>{margin}%</strong>
				</label>
				<input
					className={styles.slider}
					id={`${id}-margin`}
					max={settings.maxMarginPercent}
					min={0}
					onChange={(event) => setMargin(Number(event.target.value))}
					step={1}
					type="range"
					value={margin}
				/>
				<p className={styles.marginExample}>
					On a {money(EXAMPLE_PRICE)} product you sell at <strong>{money(EXAMPLE_PRICE * (1 + margin / 100))}</strong> and earn{" "}
					<strong>{money((EXAMPLE_PRICE * margin) / 100)}</strong>.
				</p>
				<p className={styles.hint}>
					Added on top of Avokarto&apos;s price when you add a product - you can change it per product.
					Up to {settings.maxMarginPercent}%.
				</p>
			</div>

			{error ? <p className={styles.alert} role="alert">{error.message}</p> : null}

			<SaveBar dirty={dirty} label="Save details" onDiscard={discard} saving={saving} />
		</form>
	);
}
