"use client";

import { Camera, Facebook, Globe, ImagePlus, Instagram, Loader2, Mail, Trash2, Youtube, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { initialsOf, storeThemeStyle } from "@/components/stores/storeTheme";
import SaveBar from "./SaveBar";
import { SellerApiError, sellerRequest, type SellerStore, type StoreSocials } from "./sellerApi";
import styles from "./seller.module.css";


const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

/** Upload plumbing shared by the cover and logo drop targets on the brand canvas. */
export function useImageUpload(onChange: (url: string) => void) {
	const input = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);

	async function upload(file: File) {
		setError(null);
		if (!ACCEPTED.includes(file.type)) return setError("Use a JPEG, PNG or WebP image.");
		if (file.size > MAX_BYTES) return setError("Images must be 3MB or smaller.");
		setUploading(true);
		try {
			const body = new FormData();
			body.append("file", file);
			const response = await fetch("/api/seller/uploads", { body, credentials: "same-origin", method: "POST" });
			const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string }; url?: string };
			if (!response.ok || !payload.url) throw new Error(payload.error?.message ?? "Upload failed. Try again.");
			onChange(payload.url);
		} catch (caught) {
			setError((caught as Error).message);
		} finally {
			setUploading(false);
		}
	}

	return {
		dragging,
		error,
		uploading,
		open: () => input.current?.click(),
		dropProps: {
			"data-dragging": dragging || undefined,
			onDragLeave: () => setDragging(false),
			onDragOver: (event: React.DragEvent) => {
				event.preventDefault();
				setDragging(true);
			},
			onDrop: (event: React.DragEvent) => {
				event.preventDefault();
				setDragging(false);
				const file = event.dataTransfer.files?.[0];
				if (file) void upload(file);
			},
		},
		input: (
			<input
				accept={ACCEPTED.join(",")}
				hidden
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) void upload(file);
					event.target.value = "";
				}}
				ref={input}
				type="file"
			/>
		),
	};
}

type Branding = { about: string; announcement: string; bannerUrl: string; contactEmail: string; logoUrl: string; socials: StoreSocials };

function normaliseSocials(socials: StoreSocials) {
	return { facebook: socials.facebook ?? "", instagram: socials.instagram ?? "", website: socials.website ?? "", youtube: socials.youtube ?? "" };
}

function snapshot(store: SellerStore): Branding {
	return {
		about: store.about,
		announcement: store.announcement,
		bannerUrl: store.bannerUrl,
		contactEmail: store.contactEmail,
		logoUrl: store.logoUrl,
		socials: normaliseSocials(store.socials ?? {}),
	};
}

/** Logo, banner and storefront content - what makes the store look like its own website. (Theme and colour: ThemeStudio.) */
export default function BrandingForm({ onSaved, store }: { onSaved: (store: SellerStore) => void; store: SellerStore }) {
	const id = useId();
	const [logoUrl, setLogoUrl] = useState(store.logoUrl);
	const [bannerUrl, setBannerUrl] = useState(store.bannerUrl);
	const [announcement, setAnnouncement] = useState(store.announcement);
	const [about, setAbout] = useState(store.about);
	const [contactEmail, setContactEmail] = useState(store.contactEmail);
	const [socials, setSocials] = useState<StoreSocials>(store.socials);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	const cover = useImageUpload(setBannerUrl);
	const logo = useImageUpload(setLogoUrl);
	const uploadError = cover.error ?? logo.error;
	// Last saved values - what "Discard" goes back to and what "dirty" compares against.
	const [base, setBase] = useState(() => snapshot(store));
	const current = { about, announcement, bannerUrl, contactEmail, logoUrl, socials: normaliseSocials(socials) };
	const dirty = JSON.stringify(current) !== JSON.stringify(base);

	function apply(values: Branding) {
		setLogoUrl(values.logoUrl);
		setBannerUrl(values.bannerUrl);
		setAnnouncement(values.announcement);
		setAbout(values.about);
		setContactEmail(values.contactEmail);
		setSocials(values.socials);
	}

	async function save(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const saved = await sellerRequest<SellerStore>("PATCH", "/api/seller/store/branding", {
				about,
				announcement,
				bannerUrl,
				contactEmail,
				logoUrl,
				socials: normaliseSocials(socials),
			});
			const next = snapshot(saved);
			setBase(next);
			apply(next);
			onSaved(saved);
		} catch (caught) {
			const apiError = caught as SellerApiError;
			setError({ field: apiError.field, message: apiError.message });
		} finally {
			setSaving(false);
		}
	}

	const socialInput = (key: keyof StoreSocials, label: string, placeholder: string, Icon: LucideIcon) => (
		<div className={styles.field} key={key}>
			<label className={styles.label} htmlFor={`${id}-${key}`}>{label}</label>
			<div className={styles.inputGroup}>
				<span aria-hidden="true" className={styles.prefix}><Icon size={16} /></span>
				<input
					aria-invalid={error?.field === `socials.${key}` || undefined}
					className={styles.input}
					id={`${id}-${key}`}
					inputMode="url"
					onChange={(event) => setSocials((values) => ({ ...values, [key]: event.target.value }))}
					placeholder={placeholder}
					type="url"
					value={socials[key] ?? ""}
				/>
			</div>
		</div>
	);

	return (
		<form className={styles.stack} noValidate onSubmit={save}>
			{/* The store's header as shoppers see it - click the cover or logo to change them. */}
			<div className={styles.brandCanvas} style={storeThemeStyle(store.accentColor)}>
				{announcement ? <div aria-hidden="true" className={styles.brandPreviewBar}>{announcement}</div> : null}
				<div className={styles.brandCover} data-empty={!bannerUrl || undefined} {...cover.dropProps}>
					{bannerUrl ? <Image alt="" fill sizes="(min-width: 980px) 900px, 100vw" src={bannerUrl} style={{ objectFit: "cover" }} /> : null}
					{!bannerUrl ? (
						<span aria-hidden="true" className={styles.brandCoverEmpty}>
							<ImagePlus size={22} />
							<strong>Add a cover banner</strong>
							<small>Drop an image or click · about 1600×600px</small>
						</span>
					) : null}
					{cover.uploading ? <span className={styles.dropBusy}><Loader2 className={styles.spin} size={22} /></span> : null}
					<button aria-label={bannerUrl ? "Replace cover banner" : "Upload cover banner"} className={styles.dropButton} disabled={cover.uploading} onClick={cover.open} type="button" />
					{bannerUrl ? (
						<span className={styles.brandCoverTools}>
							<button disabled={cover.uploading} onClick={cover.open} type="button"><Camera size={14} /> Change</button>
							<button aria-label="Remove cover banner" disabled={cover.uploading} onClick={() => setBannerUrl("")} type="button"><Trash2 size={14} /></button>
						</span>
					) : null}
					{cover.input}
				</div>

				<div className={styles.brandIdentity}>
					<div className={styles.brandLogo} {...logo.dropProps}>
						{logoUrl ? <Image alt="" fill sizes="96px" src={logoUrl} style={{ objectFit: "cover" }} /> : <span aria-hidden="true">{initialsOf(store.name)}</span>}
						<span aria-hidden="true" className={styles.brandLogoEdit}><Camera size={16} /></span>
						{logo.uploading ? <span className={styles.dropBusy}><Loader2 className={styles.spin} size={18} /></span> : null}
						<button aria-label={logoUrl ? "Replace logo" : "Upload logo"} className={styles.dropButton} disabled={logo.uploading} onClick={logo.open} type="button" />
						{logo.input}
					</div>
					<div className={styles.brandIdentityText}>
						<p className={styles.brandIdentityName}>{store.name}</p>
						<p className={styles.hint}>{store.tagline || "Add a tagline in Store details"}</p>
					</div>
					{logoUrl ? (
						<button className={`${styles.ghost} ${styles.btnSm}`} disabled={logo.uploading} onClick={() => setLogoUrl("")} type="button">
							<Trash2 size={14} /> <span className={styles.hideXs}>Remove logo</span>
						</button>
					) : null}
				</div>
			</div>
			<p className={uploadError ? styles.error : styles.hint} role={uploadError ? "alert" : undefined}>
				{uploadError ?? "Click the cover or logo to upload - logo square, 400×400px or bigger. JPEG, PNG or WebP up to 3MB."}
			</p>

			<fieldset className={styles.formGroup}>
				<legend>Storefront text <span className={styles.hint}>(optional)</span></legend>
				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-announcement`}>Announcement bar</label>
					<input
						aria-invalid={error?.field === "announcement" || undefined}
						className={styles.input}
						id={`${id}-announcement`}
						maxLength={140}
						onChange={(event) => setAnnouncement(event.target.value)}
						placeholder="Festive sale - free delivery over $100"
						value={announcement}
					/>
					<p className={styles.hint}>
						A short strip across the top of every page.{" "}
						<span className={styles.counter} data-near={announcement.length > 120 || undefined}>{announcement.length}/140</span>
					</p>
				</div>

				<div className={styles.field}>
					<label className={styles.label} htmlFor={`${id}-about`}>About your store</label>
					<textarea
						aria-invalid={error?.field === "about" || undefined}
						className={`${styles.input} ${styles.textarea}`}
						id={`${id}-about`}
						maxLength={1000}
						onChange={(event) => setAbout(event.target.value)}
						placeholder="Tell shoppers who you are and why you love these products."
						rows={5}
						value={about}
					/>
					<p className={styles.hint}><span className={styles.counter} data-near={about.length > 900 || undefined}>{about.length}/1000</span></p>
				</div>
			</fieldset>

			<fieldset className={styles.formGroup}>
				<legend>Contact &amp; socials <span className={styles.hint}>(optional)</span></legend>
				<div className={styles.grid2}>
					<div className={styles.field}>
						<label className={styles.label} htmlFor={`${id}-email`}>Contact email</label>
						<div className={styles.inputGroup}>
							<span aria-hidden="true" className={styles.prefix}><Mail size={16} /></span>
							<input
								aria-invalid={error?.field === "contactEmail" || undefined}
								autoComplete="email"
								className={styles.input}
								id={`${id}-email`}
								inputMode="email"
								onChange={(event) => setContactEmail(event.target.value)}
								placeholder="hello@yourstore.com"
								type="email"
								value={contactEmail}
							/>
						</div>
					</div>
					{socialInput("instagram", "Instagram", "https://instagram.com/yourstore", Instagram)}
					{socialInput("facebook", "Facebook", "https://facebook.com/yourstore", Facebook)}
					{socialInput("youtube", "YouTube", "https://youtube.com/@yourstore", Youtube)}
					{socialInput("website", "Website", "https://yourstore.com", Globe)}
				</div>
			</fieldset>

			{error ? <p className={styles.alert} role="alert">{error.message}</p> : null}
			<SaveBar
				dirty={dirty}
				label="Save branding"
				onDiscard={() => {
					apply(base);
					setError(null);
				}}
				saving={saving}
			/>
		</form>
	);
}
