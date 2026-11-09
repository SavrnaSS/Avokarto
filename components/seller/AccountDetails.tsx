"use client";

import { AtSign, Check, Home, Loader2, MapPin, Plus, RotateCcw, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useCustomerSession } from "@/hooks/use-customer-session";
import styles from "./seller.module.css";

type Address = { address1: string; city: string; country: string; postcode: string };
type Profile = {
	alternateAddress: Address;
	dateOfBirth: string | null;
	defaultAddress: Address;
	email: string;
	locale: string;
	name: string;
	phone: string;
};

const LANGUAGES = ["English", "Japanese", "Portuguese", "Bengali"];
const EMPTY_ADDRESS: Address = { address1: "", city: "", country: "", postcode: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blank = (address: Address) => !address.address1 && !address.city && !address.country && !address.postcode;
// The date input wants YYYY-MM-DD; the API may return a full timestamp.
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "");

async function request<T>(method: "GET" | "PATCH", body?: unknown): Promise<T> {
	const response = await fetch("/api/account/profile", {
		body: body === undefined ? undefined : JSON.stringify(body),
		cache: "no-store",
		credentials: "same-origin",
		headers: body === undefined ? undefined : { "Content-Type": "application/json" },
		method,
	}).catch(() => {
		throw new Error("Couldn't reach Avokarto. Check your connection and try again.");
	});
	const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string }; profile?: T };
	if (!response.ok || !payload.profile) throw new Error(payload.error?.message ?? "Something went wrong. Please try again.");
	return payload.profile;
}

/**
 * Settings > Account > Personal details, edited in place: profile, login
 * email and both delivery addresses on the same /api/account/profile the
 * shopper account page uses. Unsaved changes get a sticky save bar; a name
 * or email change refreshes the session so the dashboard shows it at once.
 */
export default function AccountDetails({ onToast }: { onToast: (message: string) => void }) {
	const id = useId();
	const refreshSession = useCustomerSession((state) => state.refresh);
	const [saved, setSaved] = useState<Profile | null>(null);
	const [draft, setDraft] = useState<Profile | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [showSecond, setShowSecond] = useState(false);

	useEffect(() => {
		let active = true;
		request<Profile>("GET")
			.then((profile) => {
				if (!active) return;
				setSaved(profile);
				setDraft(profile);
				setShowSecond(!blank(profile.alternateAddress));
			})
			.catch((error: Error) => {
				if (active) setLoadError(error.message);
			});
		return () => {
			active = false;
		};
	}, []);

	if (loadError) {
		return <p className={styles.alert} role="alert">{loadError}</p>;
	}
	if (!draft || !saved) {
		return (
			<div aria-busy="true" className={styles.pdLoading}>
				<Loader2 className={styles.spin} size={16} /> Loading your details…
			</div>
		);
	}

	const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
		setSaveError(null);
		setDraft((current) => (current ? { ...current, [key]: value } : current));
	};
	const setAddress = (key: "alternateAddress" | "defaultAddress", field: keyof Address, value: string) =>
		set(key, { ...draft[key], [field]: value });

	const nameError = draft.name.trim() ? null : "Your name can't be empty.";
	const emailError = EMAIL.test(draft.email.trim()) ? null : "Enter a valid email address.";
	const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
	const emailChanged = draft.email.trim().toLowerCase() !== saved.email.toLowerCase();

	async function save(event: React.FormEvent) {
		event.preventDefault();
		if (!draft || nameError || emailError || !dirty) return;
		setSaving(true);
		setSaveError(null);
		try {
			const profile = await request<Profile>("PATCH", {
				alternateAddress: showSecond ? draft.alternateAddress : EMPTY_ADDRESS,
				dateOfBirth: draft.dateOfBirth || null,
				defaultAddress: draft.defaultAddress,
				email: draft.email.trim(),
				locale: draft.locale,
				name: draft.name.trim(),
				phone: draft.phone.trim(),
			});
			setSaved(profile);
			setDraft(profile);
			await refreshSession();
			onToast("Personal details saved");
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Couldn't save your details.");
		} finally {
			setSaving(false);
		}
	}

	const addressFields = (key: "alternateAddress" | "defaultAddress", label: string) => (
		<div className={styles.pdGrid}>
			<label className={`${styles.pdField} ${styles.pdWide}`}>
				<span>Street address</span>
				<input autoComplete={`${key === "defaultAddress" ? "shipping" : "billing"} street-address`} className={styles.input} maxLength={200} onChange={(event) => setAddress(key, "address1", event.target.value)} placeholder="House number, street, area" value={draft[key].address1} aria-label={`${label} street address`} />
			</label>
			<label className={styles.pdField}>
				<span>City</span>
				<input autoComplete={`${key === "defaultAddress" ? "shipping" : "billing"} address-level2`} className={styles.input} maxLength={120} onChange={(event) => setAddress(key, "city", event.target.value)} value={draft[key].city} aria-label={`${label} city`} />
			</label>
			<label className={styles.pdField}>
				<span>Postcode</span>
				<input autoComplete={`${key === "defaultAddress" ? "shipping" : "billing"} postal-code`} className={styles.input} maxLength={30} onChange={(event) => setAddress(key, "postcode", event.target.value)} value={draft[key].postcode} aria-label={`${label} postcode`} />
			</label>
			<label className={`${styles.pdField} ${styles.pdWide}`}>
				<span>Country</span>
				<input autoComplete={`${key === "defaultAddress" ? "shipping" : "billing"} country-name`} className={styles.input} maxLength={120} onChange={(event) => setAddress(key, "country", event.target.value)} value={draft[key].country} aria-label={`${label} country`} />
			</label>
		</div>
	);

	return (
		<form className={styles.pdForm} noValidate onSubmit={save}>
			<Group icon={UserRound} note="How you appear to Avokarto and your customers." title="Profile">
				<div className={styles.pdGrid}>
					<label className={styles.pdField}>
						<span>Full name</span>
						<input aria-describedby={nameError ? `${id}-name` : undefined} aria-invalid={Boolean(nameError) || undefined} autoComplete="name" className={styles.input} maxLength={200} onChange={(event) => set("name", event.target.value)} value={draft.name} />
						{nameError ? <small className={styles.pdError} id={`${id}-name`}>{nameError}</small> : null}
					</label>
					<label className={styles.pdField}>
						<span>Phone</span>
						<input autoComplete="tel" className={styles.input} inputMode="tel" maxLength={40} onChange={(event) => set("phone", event.target.value.replace(/[^\d+()\- ]/g, ""))} placeholder="+91 98765 43210" type="tel" value={draft.phone} />
					</label>
					<label className={styles.pdField}>
						<span>Date of birth <em>Optional</em></span>
						<input autoComplete="bday" className={styles.input} data-empty={!draft.dateOfBirth || undefined} max={new Date().toISOString().slice(0, 10)} onChange={(event) => set("dateOfBirth", event.target.value || null)} type="date" value={toDateInput(draft.dateOfBirth)} />
					</label>
					<label className={styles.pdField}>
						<span>Language</span>
						<select className={styles.input} onChange={(event) => set("locale", event.target.value)} value={LANGUAGES.includes(draft.locale) ? draft.locale : "English"}>
							{LANGUAGES.map((language) => <option key={language}>{language}</option>)}
						</select>
					</label>
				</div>
			</Group>

			<Group icon={AtSign} note="Where you sign in and get order updates." title="Login email">
				<label className={styles.pdField}>
					<span>Email address</span>
					<input aria-describedby={`${id}-email`} aria-invalid={Boolean(emailError) || undefined} autoComplete="email" className={styles.input} inputMode="email" maxLength={200} onChange={(event) => set("email", event.target.value)} type="email" value={draft.email} />
					<small className={emailError ? styles.pdError : styles.pdHint} id={`${id}-email`}>
						{emailError ?? (emailChanged ? "You'll sign in with this new email from now on." : "Changing it changes how you sign in.")}
					</small>
				</label>
			</Group>

			<Group icon={Home} note="Used for returns and anything we need to send you." title="Main address">
				{addressFields("defaultAddress", "Main address")}
			</Group>

			{showSecond ? (
				<Group
					action={<button className={styles.pdGroupAction} onClick={() => { setShowSecond(false); set("alternateAddress", EMPTY_ADDRESS); }} type="button">Remove</button>}
					icon={MapPin}
					note="A second place you can receive deliveries."
					title="Second address"
				>
					{addressFields("alternateAddress", "Second address")}
				</Group>
			) : (
				<button className={styles.pdAddAddress} onClick={() => setShowSecond(true)} type="button"><Plus size={15} /> Add a second address</button>
			)}

			{/* Sticky while there's something to save; quiet confirmation otherwise. */}
			<div className={styles.pdBar} data-dirty={dirty || undefined}>
				<span className={styles.pdBarState} role="status">
					{saveError ? <span className={styles.pdError}>{saveError}</span> : dirty ? "Unsaved changes" : <><Check size={15} /> All changes saved</>}
				</span>
				<div className={styles.pdBarActions}>
					{dirty ? (
						<button className={styles.pdDiscard} disabled={saving} onClick={() => { setDraft(saved); setSaveError(null); setShowSecond(!blank(saved.alternateAddress)); }} type="button">
							<RotateCcw size={14} /> Discard
						</button>
					) : null}
					<button className={styles.pdSave} disabled={!dirty || saving || Boolean(nameError || emailError)} type="submit">
						{saving ? <Loader2 className={styles.spin} size={15} /> : <Check size={15} />}
						{saving ? "Saving…" : "Save details"}
					</button>
				</div>
			</div>
		</form>
	);
}

/** One titled block of the form - heading and note on top, fields below. */
function Group({ action, children, icon: Icon, note, title }: { action?: React.ReactNode; children: React.ReactNode; icon: LucideIcon; note: string; title: string }) {
	const headingId = useId();
	return (
		<section aria-labelledby={headingId} className={styles.pdGroup}>
			<header className={styles.pdGroupHead}>
				<span aria-hidden="true" className={styles.pdGroupIcon}><Icon size={15} /></span>
				<div className={styles.pdGroupText}>
					<h3 id={headingId}>{title}</h3>
					<p>{note}</p>
				</div>
				{action}
			</header>
			{children}
		</section>
	);
}
