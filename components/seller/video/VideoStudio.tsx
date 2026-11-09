"use client";

import { Check, Clapperboard, Copy, Download, Film, Instagram, Loader2, Music2, PackagePlus, Pause, Play, RotateCcw, Save, Search, Share2, Volume2, VolumeX, X, Youtube } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { withShareRef } from "@/lib/storeTraffic";
import ProductImage from "../ProductImage";
import { money } from "../sellerApi";
import styles from "../seller.module.css";
import { captionFor, type Platform } from "../videoCaptions";
import { RenderError, recordingFormat, renderVideo } from "./recorder";
import { ASPECT_SIZE, drawFrame, type VideoAspect, type VideoItem, type VideoScene, type VideoTemplate } from "./renderer";
import { playSoundtrack, type SoundStyle } from "./soundtrack";
import { useProductImages } from "./useProductImages";
import { reelFor, useProductReels } from "./useProductReels";
import v from "./studio.module.css";

export type StudioListing = {
	category: string;
	id: string;
	imageUrl: string;
	productId: string;
	productName: string;
	productSlug: string;
	salePrice: number;
};

const TEMPLATES: { hint: string; key: VideoTemplate; label: string }[] = [
	{ hint: "Blurred backdrop, product card pop, price reveal", key: "spotlight", label: "Spotlight" },
	{ hint: "Bold colour, big type, counting price", key: "price-drop", label: "Price pop" },
	{ hint: "Up to 4 products, swipe-style", key: "collection", label: "Collection" },
	{ hint: "Calm, editorial, serif type", key: "minimal", label: "Minimal" },
];
const ASPECTS: { hint: string; key: VideoAspect; label: string }[] = [
	{ hint: "Reels · TikTok · Shorts", key: "9:16", label: "9:16" },
	{ hint: "Feed posts", key: "1:1", label: "1:1" },
	{ hint: "YouTube · web", key: "16:9", label: "16:9" },
];
const LENGTHS = [6, 10, 15];
const SOUNDS: { key: SoundStyle; label: string }[] = [
	{ key: "upbeat", label: "Upbeat" },
	{ key: "chill", label: "Chill" },
	{ key: "off", label: "No music" },
];
const PLATFORMS: { Icon: typeof Instagram; key: Platform; label: string }[] = [
	{ Icon: Instagram, key: "instagram", label: "Instagram" },
	{ Icon: Music2, key: "tiktok", label: "TikTok" },
	{ Icon: Youtube, key: "youtube", label: "Shorts" },
];
const MAX_COLLECTION = 4;

type Rendered = { blob: Blob; extension: "mp4" | "webm"; poster: Blob | null; url: string };

function slugify(text: string) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "video";
}
function formatBytes(bytes: number) {
	return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Studio → Videos → Create: turn the store's products into short promo
 * videos. Everything renders in the seller's browser (renderer.ts draws,
 * recorder.ts records), so it's instant to preview and costs nothing to
 * run. The finished file can be downloaded, shared straight to an app on
 * phones, or saved to the seller's library.
 */
export default function VideoStudio({
	accent,
	listings,
	onBrowse,
	onSaved,
	onToast,
	storeLink,
	storeName,
}: {
	accent: string;
	listings: StudioListing[];
	onBrowse: () => void;
	onSaved: () => void;
	onToast: (message: string) => void;
	storeLink: string;
	storeName: string;
}) {
	const id = useId();
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<string[]>(() => (listings[0] ? [listings[0].id] : []));
	const [template, setTemplate] = useState<VideoTemplate>("spotlight");
	const [aspect, setAspect] = useState<VideoAspect>("9:16");
	const [seconds, setSeconds] = useState(10);
	const [headline, setHeadline] = useState<string | null>(null);
	const [cta, setCta] = useState("Shop now");
	const [showPrice, setShowPrice] = useState(true);
	const [showLink, setShowLink] = useState(true);
	const [colour, setColour] = useState(accent);
	const [sound, setSound] = useState<SoundStyle>("upbeat");
	const [quality, setQuality] = useState<"hd" | "fast">("hd");

	const [playing, setPlaying] = useState(true);
	const [muted, setMuted] = useState(true);
	const [render, setRender] = useState<{ error?: string; progress: number; status: "idle" | "rendering" | "done" | "error" }>({ progress: 0, status: "idle" });
	const [result, setResult] = useState<Rendered | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [platform, setPlatform] = useState<Platform>("instagram");
	const abortRef = useRef<AbortController | null>(null);
	const format = useMemo(() => recordingFormat(), []);

	const collection = template === "collection";
	const chosen = useMemo(
		() => selected.map((key) => listings.find((listing) => listing.id === key)).filter((listing): listing is StudioListing => Boolean(listing)),
		[listings, selected],
	);
	const shown = collection ? chosen.slice(0, MAX_COLLECTION) : chosen.slice(0, 1);
	const images = useProductImages(shown.map((listing) => listing.imageUrl));
	const loading = shown.some((listing) => !(listing.imageUrl in images));
	// A product with its own reel plays that instead of its photo, in the preview and in the export.
	const reels = useProductReels(shown.map((listing) => reelFor(listing.productName)).filter((src): src is string => Boolean(src)), playing || render.status === "rendering");

	const items: VideoItem[] = shown.map((listing) => {
		const loaded = images[listing.imageUrl];
		const reelSrc = reelFor(listing.productName);
		const reel = reelSrc ? reels[reelSrc] : undefined;
		return {
			category: listing.category,
			image: reel ?? loaded?.image ?? null,
			imageSize: reel ? { height: reel.videoHeight || 16, width: reel.videoWidth || 9 } : loaded ? { height: loaded.height, width: loaded.width } : { height: 1, width: 1 },
			name: listing.productName,
			oldPriceText: null,
			priceText: money(listing.salePrice),
		};
	});
	const autoHeadline = collection ? `${storeName} picks` : shown[0]?.productName ?? "";
	const linkText = storeLink.replace(/^https?:\/\//, "").replace(/\/+$/, "");
	const scene: VideoScene = {
		accent: colour,
		aspect,
		cta: cta.trim() || "Shop now",
		durationMs: seconds * 1000,
		headline: (headline ?? autoHeadline).trim(),
		items,
		link: linkText,
		showLink,
		showPrice,
		storeName,
		template,
	};
	// The animation loop reads the latest scene without restarting.
	const sceneRef = useRef(scene);
	useLayoutEffect(() => {
		sceneRef.current = scene;
	});

	// ---------- live preview ----------
	const box = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const scrub = useRef<HTMLInputElement>(null);
	const time = useRef(0);
	const [boxSize, setBoxSize] = useState({ height: 0, width: 0 });
	useLayoutEffect(() => {
		const element = box.current;
		if (!element) return;
		const measure = () => setBoxSize({ height: element.clientHeight, width: element.clientWidth });
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const design = ASPECT_SIZE[aspect];
	const fit = boxSize.width ? Math.min(boxSize.width / design.width, (boxSize.height || boxSize.width * 1.8) / design.height) : 0;
	const cssSize = { height: Math.round(design.height * fit), width: Math.round(design.width * fit) };

	useEffect(() => {
		const element = canvas.current;
		if (!element || !fit) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		element.width = Math.round(cssSize.width * dpr);
		element.height = Math.round(cssSize.height * dpr);
		const ctx = element.getContext("2d");
		if (!ctx) return;
		const scale = (cssSize.width * dpr) / design.width;
		let frame = 0;
		let last = performance.now();
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const paint = () => {
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			drawFrame(ctx, sceneRef.current, time.current);
			if (scrub.current) scrub.current.value = String(Math.round((time.current / sceneRef.current.durationMs) * 1000));
		};
		const tick = (now: number) => {
			if (playing && !reduced) {
				time.current += now - last;
				if (time.current > sceneRef.current.durationMs + 600) time.current = 0;
			}
			last = now;
			paint();
			frame = requestAnimationFrame(tick);
		};
		if (reduced && time.current === 0) time.current = sceneRef.current.durationMs * 0.45;
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [cssSize.height, cssSize.width, design.width, fit, playing]);

	// Preview music: restarts the clip from the top with sound.
	const audioRef = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);
	const stopAudio = () => {
		audioRef.current?.stop();
		void audioRef.current?.ctx.close();
		audioRef.current = null;
	};
	useEffect(() => stopAudio, []);
	useEffect(() => {
		stopAudio();
		if (muted || !playing || sound === "off") return;
		const ctx = new AudioContext();
		time.current = 0;
		const stop = playSoundtrack(ctx, ctx.destination, sound, seconds, 0.02);
		audioRef.current = { ctx, stop };
		const timer = window.setInterval(() => {
			// Loop the music with the picture.
			if (time.current < 200 && audioRef.current?.ctx === ctx) {
				audioRef.current.stop();
				audioRef.current = { ctx, stop: playSoundtrack(ctx, ctx.destination, sound, seconds, 0.02) };
			}
		}, 200);
		return () => {
			window.clearInterval(timer);
			stopAudio();
		};
	}, [muted, playing, seconds, sound]);

	// Any change to the video makes an old render stale.
	const signature = JSON.stringify({ aspect, colour, cta, headline: scene.headline, quality, seconds, selected: shown.map((s) => s.id), showLink, showPrice, sound, template });
	const [renderedSignature, setRenderedSignature] = useState("");
	const stale = Boolean(result) && renderedSignature !== signature;

	useEffect(() => () => {
		abortRef.current?.abort();
	}, []);
	useEffect(() => () => {
		if (result) URL.revokeObjectURL(result.url);
	}, [result]);

	function toggle(listingId: string) {
		setSaved(false);
		setSelected((current) => {
			if (!collection) return [listingId];
			if (current.includes(listingId)) return current.length > 1 ? current.filter((key) => key !== listingId) : current;
			return [...current, listingId].slice(-MAX_COLLECTION);
		});
	}

	async function generate() {
		if (!items.length || loading) return;
		const controller = new AbortController();
		abortRef.current = controller;
		setRender({ progress: 0, status: "rendering" });
		setSaved(false);
		stopAudio();
		setMuted(true);
		try {
			const output = await renderVideo({
				onProgress: (progress) => setRender((current) => (current.status === "rendering" ? { ...current, progress } : current)),
				quality,
				scene: { ...scene },
				signal: controller.signal,
				sound,
			});
			setResult({ ...output, url: URL.createObjectURL(output.blob) });
			setRenderedSignature(signature);
			setRender({ progress: 1, status: "done" });
		} catch (caught) {
			const message = caught instanceof RenderError ? caught.message : "Something went wrong while rendering. Try Fast quality, or another browser.";
			setRender({ error: message === "Cancelled." ? undefined : message, progress: 0, status: message === "Cancelled." ? "idle" : "error" });
		} finally {
			abortRef.current = null;
		}
	}

	const fileBase = `${slugify(scene.headline || storeName)}-${aspect.replace(":", "x")}`;
	const productUrl = shown.length === 1 && !collection ? `${storeLink.replace(/\/+$/, "")}/${shown[0].productSlug}` : storeLink;
	const caption = shown[0]
		? captionFor(platform, { category: shown[0].category, name: collection ? `${storeName} picks` : shown[0].productName, price: shown[0].salePrice }, storeName, withShareRef(productUrl, platform))
		: "";
	const [canShareFiles] = useState(() => {
		if (typeof navigator === "undefined" || typeof navigator.canShare !== "function" || typeof File === "undefined") return false;
		try {
			return navigator.canShare({ files: [new File([""], "video.mp4", { type: "video/mp4" })] });
		} catch {
			return false;
		}
	});

	async function share() {
		if (!result) return;
		const file = new File([result.blob], `${fileBase}.${result.extension}`, { type: result.blob.type });
		try {
			await navigator.share({ files: [file], text: caption, title: scene.headline });
		} catch (caught) {
			if ((caught as Error).name !== "AbortError") onToast("Couldn't open sharing - download it instead.");
		}
	}

	async function save() {
		if (!result) return;
		setSaving(true);
		const form = new FormData();
		form.set("file", new File([result.blob], `${fileBase}.${result.extension}`, { type: result.blob.type }));
		if (result.poster) form.set("poster", new File([result.poster], `${fileBase}.jpg`, { type: "image/jpeg" }));
		form.set("title", scene.headline.slice(0, 120));
		form.set("template", template);
		form.set("aspect", aspect);
		form.set("durationSeconds", String(seconds));
		if (shown[0]) form.set("productId", shown[0].productId);
		try {
			const response = await fetch("/api/seller/videos", { body: form, credentials: "same-origin", method: "POST" });
			const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
			if (!response.ok) throw new Error(payload.error?.message ?? "Couldn't save the video.");
			setSaved(true);
			onToast("Saved to My videos");
			onSaved();
		} catch (caught) {
			onToast((caught as Error).message);
		} finally {
			setSaving(false);
		}
	}

	async function copyCaption() {
		try {
			await navigator.clipboard.writeText(caption);
			onToast("Caption copied");
		} catch {
			onToast("Couldn't copy - select the text instead.");
		}
	}

	if (!listings.length) {
		return (
			<div className={`${styles.card} ${styles.empty}`}>
				<span className={styles.emptyIcon}><Film /></span>
				<p className={styles.cardTitle}>Add products to make videos</p>
				<p className={styles.muted}>Videos are made from the products in your store - their photos, names and your prices.</p>
				<button className={styles.btn} onClick={onBrowse} type="button"><PackagePlus size={16} /> Add products</button>
			</div>
		);
	}

	const filtered = query.trim()
		? listings.filter((listing) => `${listing.productName} ${listing.category}`.toLowerCase().includes(query.trim().toLowerCase()))
		: listings;
	const rendering = render.status === "rendering";

	return (
		<div className={v.studio}>
			{/* ---------- preview + output ---------- */}
			<section aria-label="Preview" className={v.stage}>
				<div className={v.previewBox} data-aspect={aspect} ref={box}>
					<div className={v.previewFrame} style={{ height: cssSize.height || undefined, width: cssSize.width || undefined }}>
						<canvas aria-label={`Preview of your ${seconds}-second ${aspect} video`} className={v.canvas} ref={canvas} role="img" style={{ height: cssSize.height, width: cssSize.width }} />
						{loading ? <span className={v.previewLoading}><Loader2 className={styles.spin} size={22} /></span> : null}
						{rendering ? (
							<div className={v.renderOverlay} role="status">
								<Clapperboard size={26} />
								<strong>Rendering {Math.round(render.progress * 100)}%</strong>
								<span className={v.renderBar}><span style={{ width: `${render.progress * 100}%` }} /></span>
								<small>Keep this tab open - it renders in real time.</small>
							</div>
						) : null}
					</div>
				</div>
				<div className={v.transport}>
					<button aria-label={playing ? "Pause preview" : "Play preview"} className={v.iconBtn} disabled={rendering} onClick={() => setPlaying((value) => !value)} type="button">
						{playing ? <Pause size={18} /> : <Play size={18} />}
					</button>
					<button aria-label="Restart preview" className={v.iconBtn} disabled={rendering} onClick={() => { time.current = 0; }} type="button"><RotateCcw size={16} /></button>
					<input
						aria-label="Preview position"
						className={v.scrub}
						defaultValue={0}
						disabled={rendering}
						max={1000}
						min={0}
						onChange={(event) => {
							time.current = (Number(event.target.value) / 1000) * scene.durationMs;
						}}
						onPointerDown={() => setPlaying(false)}
						ref={scrub}
						type="range"
					/>
					<button aria-label={muted ? "Play preview with music" : "Mute preview"} aria-pressed={!muted} className={v.iconBtn} disabled={rendering || sound === "off"} onClick={() => { setMuted((value) => !value); setPlaying(true); }} type="button">
						{muted || sound === "off" ? <VolumeX size={16} /> : <Volume2 size={16} />}
					</button>
				</div>

				<div className={v.generate}>
					{rendering ? (
						<button className={`${styles.ghost} ${styles.btnBlock} ${v.cancelBtn}`} onClick={() => abortRef.current?.abort()} type="button"><X size={16} /> Cancel</button>
					) : (
						<button className={`${styles.btn} ${styles.btnBlock} ${v.generateBtn}`} disabled={!format || loading || !items.length} onClick={() => void generate()} type="button">
							<Clapperboard size={18} /> {result && !stale ? "Render again" : "Generate video"}
						</button>
					)}
					<p className={styles.hint}>
						{format
							? `${seconds}s · ${aspect} · ${format.extension.toUpperCase()}${quality === "hd" ? " · HD" : " · 720p"} - renders in about ${seconds} seconds.`
							: "This browser can't record video - use the latest Chrome, Edge or Safari."}
					</p>
					{render.status === "error" && render.error ? <p className={styles.alert} role="alert">{render.error}</p> : null}
				</div>

				{result ? (
					<div className={v.result} data-stale={stale || undefined}>
						<div className={v.resultHead}>
							<span className={v.resultBadge}><Check size={14} /> Ready</span>
							<span className={styles.hint}>{result.extension.toUpperCase()} · {formatBytes(result.blob.size)}{stale ? " · settings changed since" : ""}</span>
						</div>
						<video className={v.resultVideo} controls data-aspect={aspect} playsInline src={result.url} />
						{result.extension === "webm" ? (
							<p className={styles.notice}>This browser records WebM. Instagram and TikTok prefer MP4 - render in Chrome or Safari for an MP4.</p>
						) : null}
						<div className={v.resultActions}>
							{canShareFiles ? (
								<button className={styles.btn} onClick={() => void share()} type="button"><Share2 size={16} /> Share</button>
							) : null}
							<a className={canShareFiles ? styles.ghost : styles.btn} download={`${fileBase}.${result.extension}`} href={result.url}><Download size={16} /> Download</a>
							<button className={styles.ghost} disabled={saving || saved} onClick={() => void save()} type="button">
								{saving ? <Loader2 className={styles.spin} size={16} /> : saved ? <Check size={16} /> : <Save size={16} />} {saved ? "Saved" : "Save to My videos"}
							</button>
						</div>
						<div className={v.caption}>
							<div aria-label="Caption for" className={styles.segment} role="group" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
								{PLATFORMS.map(({ Icon, key, label }) => (
									<button aria-pressed={platform === key} key={key} onClick={() => setPlatform(key)} type="button"><Icon size={14} /> {label}</button>
								))}
							</div>
							<textarea aria-label="Caption" className={`${styles.input} ${styles.textarea} ${v.captionText}`} readOnly value={caption} />
							<button className={`${styles.ghost} ${styles.btnSm}`} onClick={() => void copyCaption()} type="button"><Copy size={14} /> Copy caption</button>
						</div>
					</div>
				) : null}
			</section>

			{/* ---------- controls ---------- */}
			<div className={v.controls}>
				<section aria-labelledby={`${id}-products`} className={v.panel}>
					<div className={v.panelHead}>
						<h3 className={v.panelTitle} id={`${id}-products`}><span>1</span> {collection ? `Products (up to ${MAX_COLLECTION})` : "Product"}</h3>
						{collection ? <span className={styles.hint}>{shown.length} picked</span> : null}
					</div>
					{listings.length > 6 ? (
						<div className={styles.searchBar}>
							<Search aria-hidden="true" />
							<input aria-label="Search your products" className={styles.input} onChange={(event) => setQuery(event.target.value)} placeholder="Search your products" type="search" value={query} />
						</div>
					) : null}
					<div className={v.productRow} role="group" aria-label="Products">
						{filtered.map((listing) => {
							const index = shown.findIndex((item) => item.id === listing.id);
							return (
								<button aria-pressed={index >= 0} className={v.productPick} key={listing.id} onClick={() => toggle(listing.id)} type="button">
									<span className={v.productThumb}>
										<ProductImage alt="" sizes="96px" src={listing.imageUrl} />
										{index >= 0 ? <span className={v.productCheck}>{collection ? index + 1 : <Check size={12} />}</span> : null}
										{reelFor(listing.productName) ? <span className={v.reelTag}><Play aria-hidden="true" size={10} />Reel</span> : null}
									</span>
									<span className={v.productName}>{listing.productName}</span>
									<span className={v.productPrice}>{money(listing.salePrice)}</span>
								</button>
							);
						})}
					</div>
				</section>

				<section aria-labelledby={`${id}-style`} className={v.panel}>
					<h3 className={v.panelTitle} id={`${id}-style`}><span>2</span> Style</h3>
					<div className={v.templateGrid} role="group" aria-label="Style">
						{TEMPLATES.map((option) => (
							<button aria-pressed={template === option.key} className={v.templateCard} data-template={option.key} key={option.key} onClick={() => setTemplate(option.key)} type="button">
								<span aria-hidden="true" className={v.templateArt} />
								<strong>{option.label}</strong>
								<small>{option.hint}</small>
							</button>
						))}
					</div>
				</section>

				<section aria-labelledby={`${id}-format`} className={v.panel}>
					<h3 className={v.panelTitle} id={`${id}-format`}><span>3</span> Format &amp; length</h3>
					<div className={v.chipRow} role="group" aria-label="Format">
						{ASPECTS.map((option) => (
							<button aria-pressed={aspect === option.key} className={v.formatChip} key={option.key} onClick={() => setAspect(option.key)} type="button">
								<span aria-hidden="true" className={v.formatShape} data-aspect={option.key} />
								<span><strong>{option.label}</strong><small>{option.hint}</small></span>
							</button>
						))}
					</div>
					<div className={v.lengthRow}>
						<span className={styles.label}>Length</span>
						<div className={styles.segment} role="group" aria-label="Length" style={{ gridTemplateColumns: `repeat(${LENGTHS.length}, minmax(0, 1fr))` }}>
							{LENGTHS.map((value) => (
								<button aria-pressed={seconds === value} key={value} onClick={() => setSeconds(value)} type="button">{value}s</button>
							))}
						</div>
					</div>
				</section>

				<section aria-labelledby={`${id}-text`} className={v.panel}>
					<h3 className={v.panelTitle} id={`${id}-text`}><span>4</span> Text</h3>
					<label className={styles.field}>
						<span className={styles.label}>Headline</span>
						<input className={styles.input} maxLength={80} onChange={(event) => setHeadline(event.target.value)} placeholder={autoHeadline} value={headline ?? autoHeadline} />
					</label>
					<label className={styles.field}>
						<span className={styles.label}>Closing line</span>
						<input className={styles.input} maxLength={40} onChange={(event) => setCta(event.target.value)} placeholder="Shop now" value={cta} />
					</label>
					<div className={v.toggles}>
						<label className={styles.switch}><input checked={showPrice} onChange={(event) => setShowPrice(event.target.checked)} type="checkbox" /><span aria-hidden="true" /> Show price</label>
						<label className={styles.switch}><input checked={showLink} onChange={(event) => setShowLink(event.target.checked)} type="checkbox" /><span aria-hidden="true" /> Show store link</label>
					</div>
				</section>

				<section aria-labelledby={`${id}-finish`} className={v.panel}>
					<h3 className={v.panelTitle} id={`${id}-finish`}><span>5</span> Colour, music &amp; quality</h3>
					<div className={v.swatches} role="radiogroup" aria-label="Colour">
						{[...new Set([accent.toUpperCase(), "#111827", "#E11D48", "#F59E0B", "#0F766E", "#2563EB", "#7C3AED"])].map((swatch) => (
							<button aria-checked={colour.toUpperCase() === swatch} aria-label={`Colour ${swatch}`} className={v.swatch} key={swatch} onClick={() => setColour(swatch)} role="radio" style={{ "--swatch": swatch } as React.CSSProperties} type="button" />
						))}
						<label className={v.customSwatch} title="Custom colour">
							<span className="visually-hidden">Custom colour</span>
							<input onChange={(event) => setColour(event.target.value.toUpperCase())} type="color" value={colour.toLowerCase()} />
						</label>
					</div>
					<div className={v.lengthRow}>
						<span className={styles.label}>Music</span>
						<div className={styles.segment} role="group" aria-label="Music" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
							{SOUNDS.map((option) => (
								<button aria-pressed={sound === option.key} key={option.key} onClick={() => setSound(option.key)} type="button">{option.label}</button>
							))}
						</div>
					</div>
					<div className={v.lengthRow}>
						<span className={styles.label}>Quality</span>
						<div className={styles.segment} role="group" aria-label="Quality">
							<button aria-pressed={quality === "hd"} onClick={() => setQuality("hd")} type="button">HD 1080p</button>
							<button aria-pressed={quality === "fast"} onClick={() => setQuality("fast")} type="button">Fast 720p</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
