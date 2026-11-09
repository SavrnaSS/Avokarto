"use client";

import {
	AtSign,
	BookOpen,
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	Code2,
	Copy,
	FileCode2,
	Download,
	Eye,
	Facebook,
	Globe,
	ImagePlus,
	Instagram,
	Keyboard,
	LayoutTemplate,
	Loader2,
	Megaphone,
	Palette,
	PanelLeftClose,
	PanelLeftOpen,
	Pencil,
	Redo2,
	Rows2,
	Search,
	Store,
	Trash2,
	Type,
	Undo2,
	Upload,
	X,
	Youtube,
	type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { storeFontFamilies } from "@/components/stores/storeFontFaces";
import storefront from "@/components/stores/storefront.module.css";
import { initialsOf, storeThemeStyle } from "@/components/stores/storeTheme";
import { CUSTOM_CSS_MAX, customCssProblem } from "@/lib/storeCustomCss";
import { STORE_FONTS, STORE_FONT_INFO, isStoreFont, type StoreFont } from "@/lib/storeFonts";
import { STORE_THEME_INFO, isStoreTheme, type StoreTheme } from "@/lib/storeThemes";
import { useImageUpload } from "./BrandingForm";
import { SellerApiError, sellerRequest, storeUrl, type SellerStore } from "./sellerApi";
import { ColourPicker, LivePreview, ThemeGallery } from "./ThemeStudio";
import styles from "./seller.module.css";

/* ------------------------------------------------------------------ */
/* Draft model                                                         */
/* ------------------------------------------------------------------ */

type Socials = { facebook: string; instagram: string; website: string; youtube: string };
export type Draft = {
	about: string;
	accent: string;
	announcement: string;
	bannerUrl: string;
	contactEmail: string;
	customCss: string;
	font: StoreFont;
	logoUrl: string;
	name: string;
	socials: Socials;
	tagline: string;
	theme: StoreTheme;
	whatsapp: string;
};

const SOCIAL_KEYS = ["instagram", "facebook", "youtube", "website"] as const;
const BRANDING_KEYS = ["theme", "accent", "font", "customCss", "logoUrl", "bannerUrl", "announcement", "about", "contactEmail", "socials"] as const;
const DETAIL_KEYS = ["name", "tagline", "whatsapp"] as const;

function draftFrom(store: SellerStore): Draft {
	return {
		about: store.about,
		accent: store.accentColor.toUpperCase(),
		announcement: store.announcement,
		bannerUrl: store.bannerUrl,
		contactEmail: store.contactEmail,
		customCss: store.customCss ?? "",
		font: store.font ?? "theme",
		logoUrl: store.logoUrl,
		name: store.name,
		socials: { facebook: store.socials.facebook ?? "", instagram: store.socials.instagram ?? "", website: store.socials.website ?? "", youtube: store.socials.youtube ?? "" },
		tagline: store.tagline,
		theme: store.theme,
		whatsapp: store.whatsapp,
	};
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A pasted/imported settings file, reduced to known keys with the right
 * types. Anything else is ignored; the server validates again on publish.
 */
function draftFromJson(text: string, base: Draft): Draft {
	const raw = JSON.parse(text) as unknown;
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Expected a JSON object.");
	const input = raw as Record<string, unknown>;
	const next: Draft = { ...base, socials: { ...base.socials } };
	for (const key of ["about", "announcement", "bannerUrl", "contactEmail", "customCss", "logoUrl", "name", "tagline", "whatsapp"] as const) {
		if (typeof input[key] === "string") next[key] = input[key] as string;
	}
	if (input.font !== undefined) {
		if (!isStoreFont(input.font)) throw new Error(`Unknown font "${String(input.font)}". Use one of: ${STORE_FONTS.join(", ")}.`);
		next.font = input.font;
	}
	if (typeof input.accent === "string" && /^#[0-9a-f]{6}$/i.test(input.accent)) next.accent = input.accent.toUpperCase();
	if (input.theme !== undefined) {
		if (!isStoreTheme(input.theme)) throw new Error(`Unknown theme "${String(input.theme)}".`);
		next.theme = input.theme;
	}
	if (input.socials && typeof input.socials === "object") {
		for (const key of SOCIAL_KEYS) {
			const value = (input.socials as Record<string, unknown>)[key];
			if (typeof value === "string") next.socials[key] = value;
		}
	}
	return next;
}

/* Undo/redo history. Typing into one field within a moment is one step. */
type History = { future: Draft[]; lastKey: string; lastAt: number; past: Draft[]; present: Draft };
type Action =
	| { key: string; patch: Partial<Draft>; type: "set" }
	| { draft: Draft; type: "replace" }
	| { type: "undo" }
	| { type: "redo" };

function historyReducer(state: History, action: Action): History {
	if (action.type === "undo") {
		const previous = state.past.at(-1);
		return previous ? { future: [state.present, ...state.future], lastAt: 0, lastKey: "", past: state.past.slice(0, -1), present: previous } : state;
	}
	if (action.type === "redo") {
		const [next, ...rest] = state.future;
		return next ? { future: rest, lastAt: 0, lastKey: "", past: [...state.past, state.present], present: next } : state;
	}
	const present = action.type === "replace" ? action.draft : { ...state.present, ...action.patch };
	if (same(present, state.present)) return state;
	const now = Date.now();
	const key = action.type === "set" ? action.key : "";
	const coalesce = key && key === state.lastKey && now - state.lastAt < 900;
	return {
		future: [],
		lastAt: now,
		lastKey: key,
		past: coalesce ? state.past : [...state.past, state.present].slice(-80),
		present,
	};
}

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

type PanelId = "theme" | "colours" | "typography" | "identity" | "announcement" | "banner" | "about" | "contact" | "css" | "developer";
// `short`: the label under each icon on phones.
const PANELS: { icon: LucideIcon; id: PanelId; keywords: string; short: string; title: string }[] = [
	{ icon: LayoutTemplate, id: "theme", keywords: "theme layout style look design", short: "Theme", title: "Theme" },
	{ icon: Palette, id: "colours", keywords: "colour color accent brand palette", short: "Colours", title: "Colours" },
	{ icon: Type, id: "typography", keywords: "font fonts typography typeface heading body text serif sans", short: "Fonts", title: "Typography" },
	{ icon: Store, id: "identity", keywords: "name tagline logo identity brand favicon", short: "Identity", title: "Site identity" },
	{ icon: Megaphone, id: "announcement", keywords: "announcement bar header promo sale strip", short: "Announce", title: "Announcement bar" },
	{ icon: ImagePlus, id: "banner", keywords: "homepage hero banner cover image", short: "Banner", title: "Homepage banner" },
	{ icon: BookOpen, id: "about", keywords: "about story description", short: "About", title: "About & story" },
	{ icon: AtSign, id: "contact", keywords: "contact email whatsapp social instagram facebook youtube website", short: "Contact", title: "Contact & socials" },
	{ icon: FileCode2, id: "css", keywords: "css custom additional style stylesheet code advanced", short: "CSS", title: "Additional CSS" },
	{ icon: Code2, id: "developer", keywords: "developer json export import tokens css variables shortcuts api", short: "Dev", title: "Developer tools" },
];

const DRAFT_KEY = (handle: string) => `avk-customizer-draft:${handle}`;

/**
 * Full-screen store customizer (WordPress-Customizer style): drill-in
 * panels on the left, the real store live on the right, previewing the
 * draft before anything is published. Publish saves everything at once;
 * undo/redo, keyboard shortcuts, a local draft backup and JSON
 * import/export make it quick to work with. Phones switch between
 * editing and a full-screen preview.
 */
export default function StoreCustomizer({ onClose, onPublished, store }: { onClose: () => void; onPublished: (store: SellerStore) => void; store: SellerStore }) {
	const [base, setBase] = useState(() => draftFrom(store));
	const [history, dispatch] = useReducer(historyReducer, base, (present): History => ({ future: [], lastAt: 0, lastKey: "", past: [], present }));
	const draft = history.present;
	const dirty = !same(draft, base);
	const [panel, setPanel] = useState<PanelId | null>(null);
	const [direction, setDirection] = useState<"in" | "out">("in");
	const [collapsed, setCollapsed] = useState(false);
	// Phones: preview on top with the controls below ("split"), or either one full screen.
	const [mobileView, setMobileView] = useState<"edit" | "split" | "preview">("split");
	// While typing on a phone the keyboard takes half the screen: the preview shrinks to a strip.
	const [typing, setTyping] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [justPublished, setJustPublished] = useState(false);
	const [confirmClose, setConfirmClose] = useState(false);
	// An unpublished draft left from a closed tab or a crash, offered back on open.
	const [restore, setRestore] = useState<{ draft: Draft; savedAt: number } | null>(() => {
		if (typeof window === "undefined") return null;
		try {
			const saved = JSON.parse(window.localStorage.getItem(DRAFT_KEY(store.handle)) ?? "null") as { draft: Draft; savedAt: number } | null;
			return saved?.draft && !same(saved.draft, draftFrom(store)) ? saved : null;
		} catch {
			return null; // No storage (private mode): nothing to restore.
		}
	});
	const panelBody = useRef<HTMLDivElement>(null);

	const set = useCallback((key: string, patch: Partial<Draft>) => dispatch({ key, patch, type: "set" }), []);

	// Lock the page behind the editor.
	useEffect(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, []);

	// Keep a local backup of the draft while it differs from what's live.
	useEffect(() => {
		try {
			if (dirty) window.localStorage.setItem(DRAFT_KEY(store.handle), JSON.stringify({ draft, savedAt: Date.now() }));
			// Keep an older backup while it's still being offered for restore.
			else if (!restore) window.localStorage.removeItem(DRAFT_KEY(store.handle));
		} catch {
			// Storage blocked: the editor still works, just without a backup.
		}
	}, [dirty, draft, restore, store.handle]);

	const publish = useCallback(async () => {
		if (!dirty || publishing) return;
		if (draft.name.trim().length < 2) {
			setError("Give your store a name (at least 2 characters) before publishing.");
			return;
		}
		const cssProblem = customCssProblem(draft.customCss);
		if (cssProblem) {
			setError(`Additional CSS: ${cssProblem}`);
			return;
		}
		setPublishing(true);
		setError(null);
		try {
			let saved: SellerStore | null = null;
			const changed = (key: keyof Draft) => !same(draft[key], base[key]);
			if (BRANDING_KEYS.some(changed)) {
				saved = await sellerRequest<SellerStore>("PATCH", "/api/seller/store/branding", {
					about: draft.about,
					accentColor: draft.accent,
					announcement: draft.announcement,
					bannerUrl: draft.bannerUrl,
					contactEmail: draft.contactEmail,
					customCss: draft.customCss,
					font: draft.font,
					logoUrl: draft.logoUrl,
					socials: draft.socials,
					theme: draft.theme,
				});
			}
			if (DETAIL_KEYS.some(changed)) {
				saved = await sellerRequest<SellerStore>("PATCH", "/api/seller/store", {
					handle: store.handle,
					name: draft.name.trim(),
					tagline: draft.tagline.trim(),
					whatsapp: draft.whatsapp.trim(),
				});
			}
			if (saved) {
				const next = draftFrom(saved);
				setBase(next);
				dispatch({ draft: next, type: "replace" });
				onPublished(saved);
			}
			setJustPublished(true);
			window.setTimeout(() => setJustPublished(false), 2200);
		} catch (caught) {
			setError((caught as SellerApiError).message);
		} finally {
			setPublishing(false);
		}
	}, [base, dirty, draft, onPublished, publishing, store.handle]);

	const requestClose = useCallback(() => {
		if (dirty) setConfirmClose(true);
		else onClose();
	}, [dirty, onClose]);

	const openPanel = (id: PanelId | null) => {
		setDirection(id ? "in" : "out");
		setPanel(id);
		panelBody.current?.scrollTo({ top: 0 });
	};

	// Keyboard: ⌘/Ctrl+S publish, ⌘Z undo, ⇧⌘Z / Ctrl+Y redo, Esc back/close.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const mod = event.metaKey || event.ctrlKey;
			const typing = event.target instanceof Element && event.target.closest("input, textarea, [contenteditable='true']");
			if (mod && event.key.toLowerCase() === "s") {
				event.preventDefault();
				void publish();
			} else if (mod && !typing && event.key.toLowerCase() === "z") {
				event.preventDefault();
				dispatch({ type: event.shiftKey ? "redo" : "undo" });
			} else if (mod && !typing && event.key.toLowerCase() === "y") {
				event.preventDefault();
				dispatch({ type: "redo" });
			} else if (event.key === "Escape" && !typing) {
				if (confirmClose) setConfirmClose(false);
				else if (panel) openPanel(null);
				else requestClose();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [confirmClose, panel, publish, requestClose]);

	// The preview fills its pane: measure the space it has.
	const stage = useRef<HTMLDivElement>(null);
	const [stageHeight, setStageHeight] = useState(0);
	useLayoutEffect(() => {
		const element = stage.current;
		if (!element) return;
		const measure = () => setStageHeight(element.clientHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const look = useMemo(() => ({ accent: draft.accent, theme: draft.theme }), [draft.accent, draft.theme]);
	// What the store page previews on top of the saved store (it validates these again).
	const previewDraft = useMemo(
		() => ({
			about: draft.about,
			announcement: draft.announcement,
			bannerUrl: draft.bannerUrl,
			contactEmail: draft.contactEmail,
			customCss: draft.customCss,
			font: draft.font,
			logoUrl: draft.logoUrl,
			name: draft.name || store.name,
			socials: draft.socials,
			tagline: draft.tagline,
			whatsapp: draft.whatsapp,
		}),
		[draft.about, draft.announcement, draft.bannerUrl, draft.contactEmail, draft.customCss, draft.font, draft.logoUrl, draft.name, draft.socials, draft.tagline, draft.whatsapp, store.name],
	);

	const active = PANELS.find((entry) => entry.id === panel) ?? null;
	const changedCount = useMemo(() => (Object.keys(draft) as (keyof Draft)[]).filter((key) => !same(draft[key], base[key])).length, [base, draft]);

	return (
		<div aria-label="Customize your store" aria-modal="true" className={styles.cz} data-collapsed={collapsed || undefined} data-mobile={mobileView} data-typing={typing || undefined} role="dialog">
			<aside
				className={styles.czPanel}
				onBlur={() => setTyping(false)}
				onFocus={(event) => setTyping(event.target instanceof HTMLElement && event.target.matches("input:not([type=color]), textarea"))}
			>
				<header className={styles.czTop}>
					<button aria-label="Close customizer" className={styles.czIconBtn} onClick={requestClose} title="Close (Esc)" type="button"><X size={18} /></button>
					<div className={styles.czTitle}>
						<small>Customizing</small>
						<strong>{draft.name || store.name}</strong>
					</div>
					<button
						className={`${styles.btn} ${styles.btnSm} ${styles.czPublish}`}
						data-state={justPublished ? "done" : undefined}
						disabled={!dirty || publishing}
						onClick={() => void publish()}
						title="Publish (⌘S)"
						type="button"
					>
						{publishing ? <Loader2 className={styles.spin} size={14} /> : justPublished ? <Check size={14} /> : null}
						{publishing ? "Publishing" : justPublished ? "Published" : dirty ? "Publish" : "Saved"}
					</button>
				</header>

				{confirmClose ? (
					<div className={styles.czConfirm} role="alertdialog" aria-label="Unsaved changes">
						<p><strong>Leave without publishing?</strong> Your {changedCount} {changedCount === 1 ? "change stays" : "changes stay"} as a draft on this device.</p>
						<div>
							<button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => setConfirmClose(false)} type="button">Keep editing</button>
							<button className={`${styles.btn} ${styles.btnSm}`} onClick={onClose} type="button">Leave</button>
						</div>
					</div>
				) : null}
				{restore ? (
					<div className={styles.czRestore} role="status">
						<p>You have unpublished changes from {new Date(restore.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.</p>
						<div>
							<button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => setRestore(null)} type="button">Dismiss</button>
							<button className={`${styles.btn} ${styles.btnSm}`} onClick={() => { dispatch({ draft: { ...base, ...restore.draft, socials: { ...base.socials, ...restore.draft.socials } }, type: "replace" }); setRestore(null); }} type="button">Restore</button>
						</div>
					</div>
				) : null}
				{error ? <p className={styles.czError} role="alert">{error}</p> : null}

				<div className={styles.czBody} data-dir={direction} key={panel ?? "home"} ref={panelBody}>
					{active ? (
						<>
							<div className={styles.czCrumb}>
								<button aria-label="Back to all settings" className={styles.czIconBtn} onClick={() => openPanel(null)} title="Back (Esc)" type="button"><ChevronLeft size={18} /></button>
								<div className={styles.czCrumbTitle}>
									<small>Customizing ▸</small>
									<h2>{active.title}</h2>
								</div>
								{/* Phones: jump straight to another setting. */}
								<nav aria-label="Settings" className={styles.czTabs}>
									{PANELS.map((entry) => (
										<button
											aria-current={entry.id === active.id ? "page" : undefined}
											aria-label={entry.title}
											key={entry.id}
											// Keep the current setting's tab in view on narrow screens.
											ref={entry.id === active.id ? (element) => element?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
											onClick={() => openPanel(entry.id)}
											title={entry.title}
											type="button"
										>
											<entry.icon size={18} />
											<span aria-hidden="true">{entry.short}</span>
										</button>
									))}
								</nav>
							</div>
							<div className={styles.czControls}>
								<PanelControls base={base} draft={draft} id={active.id} onApply={(next) => dispatch({ draft: next, type: "replace" })} set={set} store={store} />
							</div>
						</>
					) : (
						<HomeList draft={draft} base={base} onOpen={openPanel} />
					)}
				</div>

				<footer className={styles.czFoot}>
					<div className={styles.czHistory}>
						<button aria-label="Undo" className={styles.czIconBtn} disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })} title="Undo (⌘Z)" type="button"><Undo2 size={16} /></button>
						<button aria-label="Redo" className={styles.czIconBtn} disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })} title="Redo (⇧⌘Z)" type="button"><Redo2 size={16} /></button>
						{dirty ? (
							<button className={styles.czDiscard} onClick={() => dispatch({ draft: base, type: "replace" })} type="button">Discard {changedCount} {changedCount === 1 ? "change" : "changes"}</button>
						) : (
							<span className={styles.czSaved}><Check size={14} /> Up to date</span>
						)}
					</div>
					<button aria-label="Hide controls" className={`${styles.czIconBtn} ${styles.czCollapse}`} onClick={() => setCollapsed(true)} title="Hide controls" type="button"><PanelLeftClose size={16} /></button>
				</footer>
			</aside>

			<main className={styles.czStage} ref={stage}>
				{collapsed ? (
					<button className={styles.czExpand} onClick={() => setCollapsed(false)} type="button"><PanelLeftOpen size={16} /> Show controls</button>
				) : null}
				<LivePreview
					draft={previewDraft}
					handle={store.handle}
					label={dirty ? "Draft preview" : "Live"}
					look={look}
					maxHeight={stageHeight ? Math.max(260, stageHeight - 76) : undefined}
					save={{ kind: publishing ? "saving" : dirty ? "idle" : "saved" }}
				/>
			</main>

			{/* Phones: undo/redo and how much room the preview gets, in one slim bar. */}
			<nav aria-label="Customizer view" className={styles.czMobileBar}>
				<div className={styles.czHistory}>
					<button aria-label="Undo" className={styles.czIconBtn} disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })} type="button"><Undo2 size={16} /></button>
					<button aria-label="Redo" className={styles.czIconBtn} disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })} type="button"><Redo2 size={16} /></button>
				</div>
				<div aria-label="Layout" className={styles.czSegment} role="group">
					<button aria-label="Controls only" aria-pressed={mobileView === "edit"} onClick={() => setMobileView("edit")} title="Controls only" type="button"><Pencil size={18} /></button>
					<button aria-label="Preview and controls" aria-pressed={mobileView === "split"} onClick={() => setMobileView("split")} title="Preview and controls" type="button"><Rows2 size={18} /></button>
					<button aria-label="Preview only" aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")} title="Preview only" type="button"><Eye size={18} /></button>
				</div>
			</nav>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Home list                                                           */
/* ------------------------------------------------------------------ */

function HomeList({ base, draft, onOpen }: { base: Draft; draft: Draft; onOpen: (id: PanelId) => void }) {
	const [query, setQuery] = useState("");
	const summary: Record<PanelId, string> = {
		about: draft.about ? `${draft.about.slice(0, 48)}${draft.about.length > 48 ? "…" : ""}` : "Not written yet",
		announcement: draft.announcement || "Off",
		banner: draft.bannerUrl ? "Custom banner photo" : "Product collage",
		colours: draft.accent,
		css: draft.customCss.trim() ? `${draft.customCss.split("\n").filter((line) => line.trim()).length} lines${customCssProblem(draft.customCss) ? " · has a problem" : ""}` : "None",
		contact: [draft.contactEmail && "Email", draft.whatsapp && "WhatsApp", ...SOCIAL_KEYS.filter((key) => draft.socials[key]).map((key) => key[0].toUpperCase() + key.slice(1))].filter(Boolean).join(" · ") || "Not set",
		developer: "Export, import, theme tokens",
		identity: draft.tagline ? `${draft.name} - ${draft.tagline}` : draft.name,
		theme: `${STORE_THEME_INFO[draft.theme].label} · ${STORE_THEME_INFO[draft.theme].mood}`,
		typography: draft.font === "theme" ? "Theme default" : `${STORE_FONT_INFO[draft.font].label} · ${STORE_FONT_INFO[draft.font].heading}`,
	};
	const changed: Partial<Record<PanelId, boolean>> = {
		about: draft.about !== base.about,
		announcement: draft.announcement !== base.announcement,
		banner: draft.bannerUrl !== base.bannerUrl,
		colours: draft.accent !== base.accent,
		css: draft.customCss !== base.customCss,
		typography: draft.font !== base.font,
		contact: draft.contactEmail !== base.contactEmail || draft.whatsapp !== base.whatsapp || !same(draft.socials, base.socials),
		identity: draft.name !== base.name || draft.tagline !== base.tagline || draft.logoUrl !== base.logoUrl,
		theme: draft.theme !== base.theme,
	};
	const needle = query.trim().toLowerCase();
	const shown = PANELS.filter((entry) => !needle || `${entry.title} ${entry.keywords}`.toLowerCase().includes(needle));

	return (
		<div className={styles.czHome}>
			<label className={styles.czSearch}>
				<Search aria-hidden="true" size={15} />
				<span className="visually-hidden">Find a setting</span>
				<input onChange={(event) => setQuery(event.target.value)} placeholder="Find a setting…" type="search" value={query} />
			</label>
			<ul className={styles.czNav}>
				{shown.map((entry) => (
					<li key={entry.id}>
						<button aria-label={`${entry.title}: ${summary[entry.id]}${changed[entry.id] ? " (changed)" : ""}`} onClick={() => onOpen(entry.id)} type="button">
							<span aria-hidden="true" className={styles.czNavIcon}>
								<entry.icon size={17} />
								{changed[entry.id] ? <i className={styles.czDot} /> : null}
							</span>
							<span aria-hidden="true" className={styles.czNavText}>
								<strong>{entry.title}</strong>
								<small>{summary[entry.id]}</small>
							</span>
							<span aria-hidden="true" className={styles.czNavShort}>{entry.short}</span>
							<ChevronRight aria-hidden="true" size={16} />
						</button>
					</li>
				))}
			</ul>
			{!shown.length ? <p className={styles.hint} style={{ padding: "8px 4px" }}>No setting matches “{query}”.</p> : null}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Panel controls                                                      */
/* ------------------------------------------------------------------ */

function PanelControls({
	base,
	draft,
	id,
	onApply,
	set,
	store,
}: {
	base: Draft;
	draft: Draft;
	id: PanelId;
	onApply: (draft: Draft) => void;
	set: (key: string, patch: Partial<Draft>) => void;
	store: SellerStore;
}) {
	const uid = useId();
	if (id === "theme") {
		return (
			<>
				<p className={styles.hint}>Every theme restyles the whole store - header, product cards, product pages, cart and checkout - for phones, tablets and desktops.</p>
				<div className={styles.czThemes}>
					<ThemeGallery accent={draft.accent} onChoose={(theme) => set("theme", { theme })} value={draft.theme} />
				</div>
			</>
		);
	}
	if (id === "colours") {
		return (
			<>
				<ColourPicker accent={draft.accent} idPrefix={`${uid}-cz`} onChoose={(accent) => set("accent", { accent })} theme={draft.theme} />
				<Field hint="Any 6-digit hex colour." id={`${uid}-hex`} label="Hex value">
					<input
						className={styles.input}
						id={`${uid}-hex`}
						maxLength={7}
						onChange={(event) => {
							const value = event.target.value.trim();
							if (/^#[0-9a-f]{6}$/i.test(value)) set("accent", { accent: value.toUpperCase() });
						}}
						key={draft.accent}
						defaultValue={draft.accent}
						spellCheck={false}
						style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
					/>
				</Field>
			</>
		);
	}
	if (id === "typography") {
		return <TypographyControl font={draft.font} onChoose={(font) => set("font", { font })} theme={draft.theme} />;
	}
	if (id === "css") {
		return <CssControl css={draft.customCss} onChange={(customCss) => set("customCss", { customCss })} />;
	}
	if (id === "identity") {
		return (
			<>
				<LogoControl onChange={(logoUrl) => set("logoUrl", { logoUrl })} store={store} draft={draft} />
				<Field counter={`${draft.name.length}/60`} id={`${uid}-name`} label="Store name">
					<input className={styles.input} id={`${uid}-name`} maxLength={60} onChange={(event) => set("name", { name: event.target.value })} value={draft.name} />
				</Field>
				{draft.name.trim().length < 2 ? <p className={styles.error}>Store names need at least 2 characters.</p> : null}
				<Field counter={`${draft.tagline.length}/140`} hint="One line under your name in the hero." id={`${uid}-tagline`} label="Tagline">
					<input className={styles.input} id={`${uid}-tagline`} maxLength={140} onChange={(event) => set("tagline", { tagline: event.target.value })} placeholder="Handpicked home finds, delivered to your door" value={draft.tagline} />
				</Field>
				<p className={styles.hint}>Your store link ({store.handle}) is changed in Settings → Store details.</p>
			</>
		);
	}
	if (id === "announcement") {
		return (
			<>
				<Field counter={`${draft.announcement.length}/140`} hint="A strip across the top of every page. Leave empty to hide it." id={`${uid}-ann`} label="Announcement">
					<input className={styles.input} id={`${uid}-ann`} maxLength={140} onChange={(event) => set("announcement", { announcement: event.target.value })} placeholder="🎉 Festive sale - free delivery over $100" value={draft.announcement} />
				</Field>
				<div className={styles.czChips}>
					<span className={styles.hint}>Ideas:</span>
					{["🚚 Free delivery over $100", "✨ New arrivals every week", "💬 Questions? Chat with us on WhatsApp"].map((idea) => (
						<button className={`${styles.chip}`} key={idea} onClick={() => set("announcement", { announcement: idea })} type="button">{idea}</button>
					))}
				</div>
				{draft.announcement ? <button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => set("announcement", { announcement: "" })} type="button">Turn off announcement</button> : null}
			</>
		);
	}
	if (id === "banner") {
		return <BannerControl draft={draft} onChange={(bannerUrl) => set("bannerUrl", { bannerUrl })} />;
	}
	if (id === "about") {
		return (
			<Field counter={`${draft.about.length}/1000`} hint="Shown in “Our story” on your home page." id={`${uid}-about`} label="About your store">
				<textarea className={`${styles.input} ${styles.textarea}`} id={`${uid}-about`} maxLength={1000} onChange={(event) => set("about", { about: event.target.value })} placeholder="Tell shoppers who you are and why you love these products." rows={9} value={draft.about} />
			</Field>
		);
	}
	if (id === "contact") {
		const socials: { icon: LucideIcon; key: keyof Socials; label: string; placeholder: string }[] = [
			{ icon: Instagram, key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourstore" },
			{ icon: Facebook, key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourstore" },
			{ icon: Youtube, key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourstore" },
			{ icon: Globe, key: "website", label: "Website", placeholder: "https://yourstore.com" },
		];
		return (
			<>
				<Field hint="Shoppers can message you from the store." id={`${uid}-wa`} label="WhatsApp number">
					<input autoComplete="tel" className={styles.input} id={`${uid}-wa`} inputMode="tel" maxLength={20} onChange={(event) => set("whatsapp", { whatsapp: event.target.value.replace(/[^\d+ ]/g, "") })} placeholder="+91 98765 43210" value={draft.whatsapp} />
				</Field>
				<Field id={`${uid}-email`} label="Contact email">
					<input autoComplete="email" className={styles.input} id={`${uid}-email`} inputMode="email" onChange={(event) => set("contactEmail", { contactEmail: event.target.value })} placeholder="hello@yourstore.com" type="email" value={draft.contactEmail} />
				</Field>
				{socials.map((social) => (
					<Field id={`${uid}-${social.key}`} key={social.key} label={social.label}>
						<div className={styles.inputGroup}>
							<span aria-hidden="true" className={styles.prefix}><social.icon size={15} /></span>
							<input
								className={styles.input}
								id={`${uid}-${social.key}`}
								inputMode="url"
								onChange={(event) => set(`social-${social.key}`, { socials: { ...draft.socials, [social.key]: event.target.value } })}
								placeholder={social.placeholder}
								type="url"
								value={draft.socials[social.key]}
							/>
						</div>
					</Field>
				))}
				<p className={styles.hint}>Instagram, Facebook and YouTube links must point at those sites. All links must start with https://.</p>
			</>
		);
	}
	return <DeveloperTools base={base} draft={draft} onApply={onApply} store={store} />;
}

function Field({ children, counter, hint, id, label }: { children: React.ReactNode; counter?: string; hint?: string; id: string; label: string }) {
	return (
		<div className={styles.field}>
			<div className={styles.czLabelRow}>
				<label className={styles.label} htmlFor={id}>{label}</label>
				{counter ? <span className={styles.czCounter}>{counter}</span> : null}
			</div>
			{children}
			{hint ? <p className={styles.hint}>{hint}</p> : null}
		</div>
	);
}

function LogoControl({ draft, onChange, store }: { draft: Draft; onChange: (url: string) => void; store: SellerStore }) {
	const upload = useImageUpload(onChange);
	return (
		<div className={styles.field}>
			<span className={styles.label}>Logo</span>
			<div className={styles.czLogoRow}>
				<div className={styles.czLogo} style={storeThemeStyle(draft.accent)} {...upload.dropProps}>
					{draft.logoUrl ? <Image alt="" fill sizes="80px" src={draft.logoUrl} style={{ objectFit: "cover" }} /> : <span aria-hidden="true">{initialsOf(draft.name || store.name)}</span>}
					{upload.uploading ? <span className={styles.dropBusy}><Loader2 className={styles.spin} size={18} /></span> : null}
					{upload.input}
				</div>
				<div className={styles.czLogoActions}>
					<button className={`${styles.ghost} ${styles.btnSm}`} disabled={upload.uploading} onClick={upload.open} type="button"><Upload size={14} /> {draft.logoUrl ? "Replace" : "Upload"}</button>
					{draft.logoUrl ? <button className={`${styles.ghost} ${styles.btnSm}`} disabled={upload.uploading} onClick={() => onChange("")} type="button"><Trash2 size={14} /> Remove</button> : null}
				</div>
			</div>
			<p className={upload.error ? styles.error : styles.hint} role={upload.error ? "alert" : undefined}>
				{upload.error ?? "Square, 400×400px or bigger. Also used as the browser-tab and home-screen icon. Drop an image on it to replace."}
			</p>
		</div>
	);
}

function BannerControl({ draft, onChange }: { draft: Draft; onChange: (url: string) => void }) {
	const upload = useImageUpload(onChange);
	return (
		<>
			<div className={styles.czBanner} style={storeThemeStyle(draft.accent)} {...upload.dropProps}>
				{draft.bannerUrl ? <Image alt="" fill sizes="340px" src={draft.bannerUrl} style={{ objectFit: "cover" }} /> : (
					<span className={styles.czBannerEmpty}><ImagePlus size={20} /> Drop a photo or click Upload</span>
				)}
				{upload.uploading ? <span className={styles.dropBusy}><Loader2 className={styles.spin} size={20} /></span> : null}
				{upload.input}
			</div>
			<div className={styles.czLogoActions}>
				<button className={`${styles.ghost} ${styles.btnSm}`} disabled={upload.uploading} onClick={upload.open} type="button"><Camera size={14} /> {draft.bannerUrl ? "Replace photo" : "Upload photo"}</button>
				{draft.bannerUrl ? <button className={`${styles.ghost} ${styles.btnSm}`} disabled={upload.uploading} onClick={() => onChange("")} type="button"><Trash2 size={14} /> Use product collage</button> : null}
			</div>
			<p className={upload.error ? styles.error : styles.hint} role={upload.error ? "alert" : undefined}>
				{upload.error ?? "Wide, about 1600×600px, JPEG/PNG/WebP up to 3MB. Without a banner, your hero shows a collage of your own products - often the better look for new stores."}
			</p>
		</>
	);
}

function TypographyControl({ font, onChoose, theme }: { font: StoreFont; onChoose: (font: StoreFont) => void; theme: StoreTheme }) {
	return (
		<>
			<p className={styles.hint}>A heading + body pairing for the whole store. Fonts are self-hosted and load only the pairing you pick.</p>
			<div aria-label="Font pairing" className={styles.czFonts} role="radiogroup">
				{STORE_FONTS.map((key) => {
					const info = STORE_FONT_INFO[key];
					const families = storeFontFamilies(key);
					return (
						<button aria-checked={font === key} className={styles.czFont} key={key} onClick={() => onChoose(key)} role="radio" type="button">
							<span aria-hidden="true" className={styles.czFontSample}>
								<strong style={families ? { fontFamily: families.heading } : undefined}>{key === "theme" ? `${STORE_THEME_INFO[theme].label} type` : "Aa Shop the drop"}</strong>
								<small style={families ? { fontFamily: families.body } : undefined}>Handpicked finds, delivered to your door.</small>
							</span>
							<span className={styles.czFontMeta}>
								<strong>{info.label}</strong>
								<small>{key === "theme" ? info.description : `${info.heading}${info.body !== info.heading ? ` + ${info.body}` : ""} · ${info.description}`}</small>
							</span>
							{font === key ? <span className={styles.czFontCheck}><Check size={13} /></span> : null}
						</button>
					);
				})}
			</div>
		</>
	);
}

// Stable hooks on every store page (the storefront's own class names change with each build).
const CSS_HOOKS: [string, string][] = [
	['[data-st="site"]', "The whole store - set --st-* variables here"],
	['[data-st="announcement"]', "Announcement bar"],
	['[data-st="header"]', "Header"],
	['[data-st="hero"]', "Home hero"],
	['[data-st="trust"]', "Trust bar under the hero"],
	['[data-st="categories"]', "Shop by category"],
	['[data-st="featured"]', "Featured picks"],
	['[data-st="catalog"]', "Product grid section"],
	['[data-st="product-card"]', "Every product card"],
	['[data-st="about"]', "Our story"],
	['[data-st="footer"]', "Footer"],
	["[data-theme=\"noir\"]", "Only when a theme is active"],
];

const CSS_SNIPPETS: [string, string][] = [
	["Square corners", '[data-st="site"] {\n  --st-radius: 0px;\n  --st-radius-sm: 0px;\n}'],
	["Softer cards", '[data-st="product-card"] {\n  box-shadow: 0 12px 30px -18px rgb(0 0 0 / 35%);\n}'],
	["Hide announcement on phones", '@media (max-width: 600px) {\n  [data-st="announcement"] { display: none; }\n}'],
	["Bigger product titles", '[data-st="product-card"] h3 {\n  font-size: 17px;\n}'],
	["Uppercase headings", '[data-st="site"] h1,\n[data-st="site"] h2 {\n  text-transform: uppercase;\n  letter-spacing: 0.02em;\n}'],
];

function CssControl({ css, onChange }: { css: string; onChange: (css: string) => void }) {
	const uid = useId();
	const problem = customCssProblem(css);
	const lines = Math.max(12, css.split("\n").length + 1);
	const gutter = useRef<HTMLPreElement>(null);
	return (
		<>
			<p className={styles.hint}>Extra CSS on top of your theme, previewed live. Applies to every store page except checkout. It can&apos;t load images, fonts or other files.</p>
			<div className={styles.field}>
				<div className={styles.czLabelRow}>
					<label className={styles.label} htmlFor={`${uid}-css`}>Additional CSS</label>
					<span className={styles.czCounter}>{css.length.toLocaleString("en-US")}/{CUSTOM_CSS_MAX.toLocaleString("en-US")}</span>
				</div>
				<div className={styles.czEditor} data-invalid={problem ? "" : undefined}>
					<pre aria-hidden="true" className={styles.czGutter} ref={gutter}>{Array.from({ length: lines }, (_, index) => index + 1).join("\n")}</pre>
					<textarea
						aria-describedby={`${uid}-css-status`}
						aria-invalid={Boolean(problem) || undefined}
						autoCapitalize="off"
						autoComplete="off"
						autoCorrect="off"
						className={styles.czEditorInput}
						id={`${uid}-css`}
						maxLength={CUSTOM_CSS_MAX}
						onChange={(event) => onChange(event.target.value)}
						onKeyDown={(event) => {
							// Tab indents (two spaces) instead of leaving the editor; Esc then Tab still moves focus.
							if (event.key !== "Tab" || event.shiftKey) return;
							event.preventDefault();
							const element = event.currentTarget;
							const { selectionEnd, selectionStart, value } = element;
							onChange(`${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`);
							requestAnimationFrame(() => element.setSelectionRange(selectionStart + 2, selectionStart + 2));
						}}
						onScroll={(event) => {
							if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop;
						}}
						placeholder={'[data-st="product-card"] {\n  border-radius: 20px;\n}'}
						rows={lines}
						spellCheck={false}
						value={css}
						wrap="off"
					/>
				</div>
				<p className={problem ? styles.error : styles.czCssOk} id={`${uid}-css-status`} role="status">
					{problem ?? (css.trim() ? <><Check size={13} /> Looks good - showing in the preview</> : "Empty - your theme as designed.")}
				</p>
			</div>

			<section className={styles.czDev}>
				<h3>Snippets</h3>
				<div className={styles.czChips}>
					{CSS_SNIPPETS.map(([label, snippet]) => (
						<button className={styles.chip} key={label} onClick={() => onChange(css.trim() ? `${css.replace(/\s*$/, "")}\n\n${snippet}\n` : `${snippet}\n`)} type="button">+ {label}</button>
					))}
				</div>
			</section>

			<section className={styles.czDev}>
				<h3>Selectors you can rely on</h3>
				<p className={styles.hint}>Class names change with each release - target these instead. Theme variables (--st-accent, --st-radius…) are listed in Developer tools.</p>
				<ul className={styles.czTokens}>
					{CSS_HOOKS.map(([selector, label]) => (
						<li key={selector}>
							<button onClick={() => onChange(`${css.replace(/\s*$/, "")}${css.trim() ? "\n\n" : ""}${selector} {\n  \n}\n`)} title="Add a rule for this" type="button">
								<code>{selector}</code>
								<span>{label}</span>
							</button>
						</li>
					))}
				</ul>
			</section>
		</>
	);
}

/* ------------------------------------------------------------------ */
/* Developer tools                                                     */
/* ------------------------------------------------------------------ */

const TOKENS = ["--st-accent", "--st-on-accent", "--st-bg", "--st-surface", "--st-ink", "--st-ink-2", "--st-ink-3", "--st-line", "--st-radius", "--st-radius-sm", "--st-heading", "--st-heading-weight", "--st-header-bg"];

function DeveloperTools({ base, draft, onApply, store }: { base: Draft; draft: Draft; onApply: (draft: Draft) => void; store: SellerStore }) {
	const uid = useId();
	const json = useMemo(() => JSON.stringify({ $schema: "avokarto-store-settings@1", ...draft }, null, 2), [draft]);
	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState<string | null>(null);
	const [copied, setCopied] = useState<string | null>(null);
	const scope = useRef<HTMLSpanElement>(null);
	const [tokens, setTokens] = useState<[string, string][]>([]);

	// Read the theme's real CSS variables from a hidden themed element.
	useEffect(() => {
		const element = scope.current;
		if (!element) return;
		const computed = getComputedStyle(element);
		setTokens(TOKENS.map((name) => [name, computed.getPropertyValue(name).trim()] as [string, string]).filter(([, value]) => value));
	}, [draft.accent, draft.theme]);

	const copy = async (label: string, text: string) => {
		await navigator.clipboard?.writeText(text);
		setCopied(label);
		window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1500);
	};

	const origin = typeof window === "undefined" ? "" : window.location.origin;
	const home = storeUrl(store.handle);
	const endpoints = [
		["Store", home],
		["Cart", `${home}/cart`],
		["Checkout", `${home}/checkout`],
		["Web app manifest", `${origin}/api/stores/manifest?handle=${store.handle}`],
		["Share image (1200×630)", `${origin}/api/stores/share-image?handle=${store.handle}`],
		["App icon", `${origin}/api/stores/icon?handle=${store.handle}&size=192`],
	];

	return (
		<>
			<section className={styles.czDev}>
				<h3>Settings as JSON</h3>
				<p className={styles.hint}>Version your store design, copy it between stores, or edit it in your own editor.</p>
				<pre className={styles.czCode}>{json}</pre>
				<div className={styles.czLogoActions}>
					<button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => void copy("json", json)} type="button">{copied === "json" ? <Check size={14} /> : <Copy size={14} />} Copy</button>
					<button
						className={`${styles.ghost} ${styles.btnSm}`}
						onClick={() => {
							const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
							const link = Object.assign(document.createElement("a"), { download: `${store.handle}-store-settings.json`, href: url });
							link.click();
							URL.revokeObjectURL(url);
						}}
						type="button"
					>
						<Download size={14} /> Download .json
					</button>
				</div>
			</section>

			<section className={styles.czDev}>
				<h3>Import</h3>
				<label className="visually-hidden" htmlFor={`${uid}-import`}>Settings JSON to import</label>
				<textarea
					className={`${styles.input} ${styles.textarea} ${styles.czCodeInput}`}
					id={`${uid}-import`}
					onChange={(event) => { setImportText(event.target.value); setImportError(null); }}
					placeholder={'{ "theme": "noir", "accent": "#D4AF37" }'}
					rows={5}
					spellCheck={false}
					value={importText}
				/>
				{importError ? <p className={styles.error} role="alert">{importError}</p> : <p className={styles.hint}>Any subset of the keys above. Applied to the draft - nothing goes live until you publish.</p>}
				<button
					className={`${styles.btn} ${styles.btnSm}`}
					disabled={!importText.trim()}
					onClick={() => {
						try {
							onApply(draftFromJson(importText, draft));
							setImportText("");
						} catch (caught) {
							setImportError(caught instanceof SyntaxError ? `Invalid JSON: ${caught.message}` : (caught as Error).message);
						}
					}}
					type="button"
				>
					Apply to draft
				</button>
				{!same(draft, base) ? <p className={styles.hint}>Tip: ⌘Z undoes an import.</p> : null}
			</section>

			<section className={styles.czDev}>
				<h3>Theme tokens · {STORE_THEME_INFO[draft.theme].label}</h3>
				<p className={styles.hint}>The CSS variables every store page is drawn with. Click one to copy.</p>
				<span aria-hidden="true" className={`${storefront.themeScope}`} data-theme={draft.theme} ref={scope} style={{ ...storeThemeStyle(draft.accent), display: "none" }} />
				<ul className={styles.czTokens}>
					{tokens.map(([name, value]) => (
						<li key={name}>
							<button onClick={() => void copy(name, `${name}: ${value};`)} title="Copy declaration" type="button">
								{/^#|^rgb/i.test(value) ? <i style={{ background: value }} /> : null}
								<code>{name}</code>
								<span>{copied === name ? "Copied" : value}</span>
							</button>
						</li>
					))}
				</ul>
			</section>

			<section className={styles.czDev}>
				<h3>Store URLs</h3>
				<ul className={styles.czTokens}>
					{endpoints.map(([label, url]) => (
						<li key={label}>
							<button onClick={() => void copy(label, url)} title="Copy URL" type="button">
								<code>{label}</code>
								<span>{copied === label ? "Copied" : url.replace(/^https?:\/\//, "")}</span>
							</button>
						</li>
					))}
				</ul>
			</section>

			<section className={styles.czDev}>
				<h3><Keyboard size={15} /> Shortcuts</h3>
				<dl className={styles.czKeys}>
					<div><dt><kbd>⌘</kbd><kbd>S</kbd></dt><dd>Publish</dd></div>
					<div><dt><kbd>⌘</kbd><kbd>Z</kbd></dt><dd>Undo</dd></div>
					<div><dt><kbd>⇧</kbd><kbd>⌘</kbd><kbd>Z</kbd></dt><dd>Redo</dd></div>
					<div><dt><kbd>Esc</kbd></dt><dd>Back / close</dd></div>
				</dl>
				<p className={styles.hint}>Ctrl instead of ⌘ on Windows and Linux.</p>
			</section>
		</>
	);
}
