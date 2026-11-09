"use client";

import { AlertTriangle, Check, ExternalLink, Loader2, Monitor, Palette, Smartphone, Tablet, Undo2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { contrastRatio, readableOn, storeThemeStyle } from "@/components/stores/storeTheme";
import storefront from "@/components/stores/storefront.module.css";
import { STORE_THEMES, STORE_THEME_INFO, type StoreTheme } from "@/lib/storeThemes";
import { SellerApiError, sellerRequest, type SellerStore } from "./sellerApi";
import styles from "./seller.module.css";

const BRAND_COLOURS = ["#3E8315", "#0F766E", "#1D4ED8", "#7C3AED", "#BE185D", "#C2410C", "#111827"];

// Smallest to largest - the switcher shows them in this order.
const DEVICES = {
	phone: { height: 760, icon: Smartphone, label: "Phone", width: 390 },
	tablet: { height: 1024, icon: Tablet, label: "Tablet", width: 820 },
	desktop: { height: 820, icon: Monitor, label: "Desktop", width: 1280 },
} as const;
type Device = keyof typeof DEVICES;
// Frame around the viewport (top, sides, bottom): phone/tablet bezels, a
// browser bar for desktop. The page inside stays at the device's true width.
const BEZEL: Record<Device, [number, number, number]> = { desktop: [30, 1, 1], phone: [12, 12, 12], tablet: [14, 14, 14] };

export type Look = { accent: string; theme: StoreTheme };
export type SaveState = { kind: "error"; message: string } | { kind: "idle" | "saved" | "saving" };

const sameLook = (a: Look, b: Look) => a.theme === b.theme && a.accent.toLowerCase() === b.accent.toLowerCase();

/**
 * One-tap store design: tap a theme or colour and it's live - on the
 * preview immediately and on the real store a moment later (auto-saved,
 * with undo). The preview is the actual storefront in an iframe, shown in
 * a phone, tablet or desktop frame and scaled to fit whatever space the
 * dashboard has.
 */
export default function ThemeStudio({ onSaved, store }: { onSaved: (store: SellerStore) => void; store: SellerStore }) {
	const [look, setLook] = useState<Look>({ accent: store.accentColor, theme: store.theme });
	const [undo, setUndo] = useState<Look | null>(null);
	const [save, setSave] = useState<SaveState>({ kind: "idle" });
	const persisted = useRef<Look>({ accent: store.accentColor, theme: store.theme });
	const requestSeq = useRef(0);
	const onSavedRef = useRef(onSaved);
	useEffect(() => {
		onSavedRef.current = onSaved;
	}, [onSaved]);

	// Apply a new look; remember the previous one for undo.
	const choose = useCallback((next: Partial<Look>) => {
		setLook((current) => {
			const merged = { ...current, ...next };
			if (!sameLook(current, merged)) setUndo(current);
			return merged;
		});
	}, []);

	// Auto-save, debounced so sliding the colour picker or tapping through
	// themes sends one request. Stale responses are ignored.
	useEffect(() => {
		if (sameLook(look, persisted.current)) return;
		setSave({ kind: "saving" });
		const timer = window.setTimeout(async () => {
			const seq = ++requestSeq.current;
			try {
				const saved = await sellerRequest<SellerStore>("PATCH", "/api/seller/store/branding", { accentColor: look.accent, theme: look.theme });
				if (seq !== requestSeq.current) return;
				persisted.current = { accent: saved.accentColor, theme: saved.theme };
				setSave({ kind: "saved" });
				onSavedRef.current(saved);
			} catch (caught) {
				if (seq !== requestSeq.current) return;
				setSave({ kind: "error", message: (caught as SellerApiError).message });
			}
		}, 450);
		return () => window.clearTimeout(timer);
	}, [look]);

	return (
		<div className={styles.studio}>
			<div className={styles.studioGrid}>
				<LivePreview handle={store.handle} look={look} save={save} />

				<div className={styles.studioControls}>
					<ThemeGallery accent={look.accent} onChoose={(theme) => choose({ theme })} value={look.theme} />

					<ColourPicker accent={look.accent} onChoose={(accent) => choose({ accent })} theme={look.theme} />

					<div className={styles.studioStatus} role="status">
						{save.kind === "saving" ? <><Loader2 className={styles.spin} size={14} /> Applying to your store…</> : null}
						{save.kind === "saved" ? <><Check size={14} /> Live on your store</> : null}
						{save.kind === "error" ? <span className={styles.error}>{save.message}</span> : null}
						{save.kind === "idle" ? <span className={styles.hint}>Tap a theme or colour - it goes live instantly.</span> : null}
						{undo && save.kind !== "saving" ? (
							<button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => { setLook(undo); setUndo(null); }} type="button">
								<Undo2 size={14} /> Undo
							</button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

/** The store colour: the theme's suggested colours first, then brand classics, then any colour. */
export function ColourPicker({ accent, idPrefix = "studio", onChoose, theme }: { accent: string; idPrefix?: string; onChoose: (accent: string) => void; theme: StoreTheme }) {
	const info = STORE_THEME_INFO[theme];
	const swatches = [...new Set([...info.accents, ...BRAND_COLOURS].map((colour) => colour.toUpperCase()))];
	const lowContrast = contrastRatio(accent, info.background) < 2.2;
	return (
		<div className={styles.field}>
			<span className={styles.label} id={`${idPrefix}-colour`}>
				<Palette aria-hidden="true" size={14} /> Store colour
			</span>
			<div aria-labelledby={`${idPrefix}-colour`} className={styles.swatches} role="radiogroup">
				{swatches.map((colour, index) => (
					<button
						aria-checked={accent.toUpperCase() === colour}
						aria-label={`${colour}${index < info.accents.length ? `, suggested for ${info.label}` : ""}`}
						className={styles.swatch}
						data-suggested={index < info.accents.length || undefined}
						key={colour}
						onClick={() => onChoose(colour)}
						role="radio"
						style={{ "--swatch": colour, "--swatch-on": readableOn(colour) } as React.CSSProperties}
						type="button"
					>
						{accent.toUpperCase() === colour ? <Check size={14} /> : null}
					</button>
				))}
				<label className={styles.swatchCustom} title="Pick any colour">
					<span className="visually-hidden">Custom colour</span>
					<input onChange={(event) => onChoose(event.target.value.toUpperCase())} type="color" value={accent.toLowerCase()} />
				</label>
			</div>
			{lowContrast ? (
				<p className={styles.contrastWarn}>
					<AlertTriangle aria-hidden="true" size={14} /> This colour is hard to see on {info.label}&apos;s background - buttons may fade out.
				</p>
			) : (
				<p className={styles.hint}>The first {info.accents.length} are picked to suit {info.label}. Button text switches to black or white automatically.</p>
			)}
		</div>
	);
}

/** Theme cards drawn with the real theme tokens, as an arrow-key radio group. */
export function ThemeGallery({ accent, onChoose, value }: { accent: string; onChoose: (theme: StoreTheme) => void; value: StoreTheme }) {
	const list = useRef<HTMLDivElement>(null);

	// Keep the selected card centred in the phone carousel. Scrolls only the
	// carousel itself (scrollIntoView would also scroll the page).
	const settled = useRef(false);
	useEffect(() => {
		const track = list.current;
		const card = track?.querySelector<HTMLElement>('[aria-checked="true"]');
		if (!track || !card || track.scrollWidth <= track.clientWidth) return;
		track.scrollTo({ behavior: settled.current ? "smooth" : "auto", left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2 });
		settled.current = true;
	}, [value]);

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const step = { ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1 }[event.key];
		if (!step) return;
		event.preventDefault();
		const index = (STORE_THEMES.indexOf(value) + step + STORE_THEMES.length) % STORE_THEMES.length;
		onChoose(STORE_THEMES[index]);
		list.current?.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus();
	};

	return (
		<fieldset className={styles.field} style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}>
			<legend className={styles.label} style={{ marginBottom: 8 }}>Theme</legend>
			<div className={styles.themeGallery} onKeyDown={onKeyDown} ref={list} role="radiogroup" aria-label="Store theme">
				{STORE_THEMES.map((key) => {
					const theme = STORE_THEME_INFO[key];
					const checked = key === value;
					return (
						<button
							aria-checked={checked}
							className={styles.themeOption}
							key={key}
							onClick={() => onChoose(key)}
							role="radio"
							tabIndex={checked ? 0 : -1}
							type="button"
						>
							<span aria-hidden="true" className={`${storefront.themeScope} ${styles.themeMock}`} data-theme={key} style={storeThemeStyle(accent)}>
								<span className={styles.mockHeader}><i /><b /></span>
								<span className={styles.mockHero}>
									<strong>Aa</strong>
									<em />
								</span>
								<span className={styles.mockGrid}><i /><i /><i /></span>
							</span>
							<span className={styles.themeMeta}>
								<strong>{theme.label}</strong>
								<small>{theme.description}</small>
							</span>
							<span className={styles.themeMood}>{theme.mood}</span>
							{checked ? <span className={styles.themeCheck}><Check size={13} /></span> : null}
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}

/**
 * The real store, framed as a device and scaled to fit. Talks to the store
 * page (StoreShell's useStudioPreview) by postMessage, so trying a theme
 * restyles it in place - no reload, scroll position kept.
 */
export function LivePreview({
	draft,
	handle,
	label,
	look,
	maxHeight: fitHeight,
	save,
}: {
	/** Unpublished store details to show (the customizer); the store page validates them. */
	draft?: Record<string, unknown>;
	handle: string;
	/** Badge text beside the device switch (default: "Saving" / "Live"). */
	label?: string;
	look: Look;
	/** Height the frame must fit in (a full-height editor); otherwise sized from the window. */
	maxHeight?: number;
	save: SaveState;
}) {
	const stage = useRef<HTMLDivElement>(null);
	const frame = useRef<HTMLIFrameElement>(null);
	// The seller's pick, once they make one; until then it follows the space available.
	const [pickedDevice, setPickedDevice] = useState<Device | null>(null);
	const [box, setBox] = useState({ viewportHeight: 800, viewportWidth: 1280, width: 0 });
	const [ready, setReady] = useState(0);
	const [loaded, setLoaded] = useState(false);
	// Narrow panes show a phone; wide ones a desktop - unless the pane is tall
	// and narrow (a portrait tablet), where a tablet frame fills it far better.
	const autoDevice: Device = box.width < 640 ? "phone" : fitHeight && fitHeight > box.width * 1.05 ? "tablet" : "desktop";
	const device = pickedDevice ?? autoDevice;
	const src = `/store/${encodeURIComponent(handle)}`;
	const spec = DEVICES[device];
	const [padTop, padSide, padBottom] = BEZEL[device];
	const outer = { height: spec.height + padTop + padBottom, width: spec.width + padSide * 2 };

	useLayoutEffect(() => {
		const element = stage.current;
		if (!element) return;
		const measure = () => {
			const next = { viewportHeight: window.innerHeight, viewportWidth: window.innerWidth, width: element.clientWidth };
			setBox((current) =>
				current.width === next.width && current.viewportHeight === next.viewportHeight && current.viewportWidth === next.viewportWidth ? current : next,
			);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		window.addEventListener("resize", measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, []);

	// Scale by width, and by height so the frame never outgrows the screen:
	// on a phone the preview stays short enough to tap themes below it.
	const maxHeight = fitHeight ?? (box.viewportWidth < 1100 ? Math.max(320, box.viewportHeight * 0.52) : box.viewportHeight - 150);
	const scale = box.width ? Math.min(1, (box.width - 2) / outer.width, maxHeight / outer.height) : 0.3;

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
			if ((event.data as { source?: string; type?: string } | null)?.source === "avk-store") setReady((count) => count + 1);
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	// Push the look whenever it changes, and again whenever the page (re)loads.
	useEffect(() => {
		if (!ready) return;
		frame.current?.contentWindow?.postMessage({ accent: look.accent, source: "avk-theme-studio", store: draft, theme: look.theme }, window.location.origin);
	}, [draft, look, ready]);

	return (
		<section aria-label="Live preview" className={styles.studioPreview}>
			<div className={styles.previewBar}>
				<div aria-label="Preview size" className={styles.deviceSwitch} role="group">
					{(Object.keys(DEVICES) as Device[]).map((key) => {
						const Icon = DEVICES[key].icon;
						return (
							<button
								aria-label={DEVICES[key].label}
								aria-pressed={device === key}
								key={key}
								onClick={() => {
									setPickedDevice(key);
								}}
								title={DEVICES[key].label}
								type="button"
							>
								<Icon size={16} />
							</button>
						);
					})}
				</div>
				<span className={styles.previewState} data-state={save.kind}>
					<span aria-hidden="true" /> {label ?? (save.kind === "saving" ? "Saving" : "Live")}
				</span>
				<a aria-label="Open your store in a new tab" className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`} href={src} rel="noopener" target="_blank" title="Open store">
					<ExternalLink size={14} />
				</a>
			</div>
			<div className={styles.stage} ref={stage} style={{ height: Math.round(outer.height * scale) + 2 }}>
				<div
					className={styles.device}
					data-device={device}
					style={{
						height: outer.height,
						padding: `${padTop}px ${padSide}px ${padBottom}px`,
						transform: `translateX(-50%) scale(${scale})`,
						width: outer.width,
					}}
				>
					{!loaded ? <div className={styles.deviceLoading}><Loader2 className={styles.spin} size={28} /></div> : null}
					<iframe
						onLoad={() => setLoaded(true)}
						ref={frame}
						src={src}
						title="Live preview of your store"
					/>
				</div>
			</div>
		</section>
	);
}
