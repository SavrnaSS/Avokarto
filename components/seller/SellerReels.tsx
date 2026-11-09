"use client";

import { Check, ChevronLeft, ChevronRight, Clapperboard, Copy, Download, Instagram, Link2, Music2, PackagePlus, Play, Search, Share2, X, Youtube } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLiveResource } from "@/hooks/use-live-resource";
import { withShareRef } from "@/lib/storeTraffic";
import { money } from "./sellerApi";
import { captionFor, type Platform } from "./videoCaptions";
import styles from "./seller.module.css";

/*
 * Studio → Reels: Avokarto's promo videos for the products in this store.
 * Pick a reel, pick where it's going (Instagram Reels, TikTok, YouTube
 * Shorts) and get a caption written for that platform with a tracked link
 * to the product in this store - visits then show up under that platform
 * in Analytics. On phones "Post" hands the video straight to the app's
 * share sheet; elsewhere it downloads.
 */

type SellerReel = {
	durationSeconds: number | null;
	id: string;
	posterUrl: string;
	product: { category: string; id: string; imageUrl: string; isActive: boolean; name: string; price: number; slug: string };
	sizeBytes: number;
	title: string;
	videoUrl: string;
};


// `short` labels the picker (fits a phone); `label` is used everywhere else.
const PLATFORMS: { Icon: typeof Instagram; key: Platform; label: string; short: string; tips: string[] }[] = [
	{
		Icon: Instagram,
		key: "instagram",
		label: "Instagram Reels",
		short: "Instagram",
		tips: [
			"Links in Reels captions aren't clickable - put your store link in your bio and say \"link in bio\".",
			"Post between 11am-1pm or 7-9pm local time, and reply to comments in the first hour.",
			"Add the reel to your Story too, with a Link sticker to the product.",
		],
	},
	{
		Icon: Music2,
		key: "tiktok",
		label: "TikTok",
		short: "TikTok",
		tips: [
			"Pick a trending sound in the TikTok editor - it can multiply your views.",
			"TikTok captions aren't clickable: point viewers to the link in your bio.",
			"Post consistently - 1-3 times a day works best for new accounts.",
		],
	},
	{
		Icon: Youtube,
		key: "youtube",
		label: "YouTube Shorts",
		short: "Shorts",
		tips: [
			"Keep #shorts in the title or description so it's picked up as a Short.",
			"Pin a comment with your product link - links in comments are clickable.",
			"Shorts must be vertical and up to 3 minutes.",
		],
	},
];

function fileName(reel: SellerReel, platform: Platform, index: number) {
	return `${reel.product.name}-${platform === "youtube" ? "shorts" : platform}-reel-${index + 1}`;
}

function formatDuration(seconds: number | null) {
	if (seconds === null) return null;
	const whole = Math.round(seconds);
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

type ProductGroup = { product: SellerReel["product"]; reels: SellerReel[] };

/** Group reels by product, keeping the API's order (buyable products first, the admin's video order within each). */
function groupByProduct(reels: SellerReel[]) {
	const groups = new Map<string, ProductGroup>();
	for (const reel of reels) {
		const group = groups.get(reel.product.id) ?? { product: reel.product, reels: [] };
		group.reels.push(reel);
		groups.set(reel.product.id, group);
	}
	return [...groups.values()];
}

/** A plain lazy <img>: posters are /api/uploads files, and the grid stays light. */
function Poster({ reel }: { reel: SellerReel }) {
	return reel.posterUrl ? (
		// eslint-disable-next-line @next/next/no-img-element -- see above
		<img alt="" decoding="async" loading="lazy" src={reel.posterUrl} />
	) : (
		<video muted playsInline preload="metadata" src={`${reel.videoUrl}#t=1`} />
	);
}

/** Average brightness of an image (0-255), sampled on a tiny canvas. Same-origin uploads only. */
function luma(image: HTMLImageElement) {
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 8;
		canvas.height = 14;
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (!context) return 255;
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
		let total = 0;
		for (let index = 0; index < data.length; index += 4) total += data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
		return total / (data.length / 4);
	} catch {
		return 255;
	}
}

// Read once on the client: how tiles may preview. Touch screens play the
// tiles that are on screen (like an Instagram grid); mice play on hover.
// Nothing autoplays with reduced motion or Data Saver on.
function previewMode(): "hover" | "inView" | "off" {
	if (typeof window === "undefined") return "off";
	const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
	if (saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";
	return window.matchMedia("(hover: hover)").matches ? "hover" : "inView";
}

/**
 * A reel tile that previews the real video: the video only mounts as the
 * tile nears the screen, plays muted while hovered (or on screen, on
 * phones), and stands in for the poster when the poster is missing or
 * nearly black. Landscape videos are shown whole over a blurred backdrop
 * and flagged - Reels, TikTok and Shorts are vertical.
 */
function ReelTile({ index, onOpen, productName, reel, total }: { index: number; onOpen: () => void; productName: string; reel: SellerReel; total: number }) {
	const root = useRef<HTMLDivElement>(null);
	const video = useRef<HTMLVideoElement>(null);
	const [mode] = useState(previewMode);
	const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
	const [inView, setInView] = useState(false);
	const [hovered, setHovered] = useState(false);
	const [posterDark, setPosterDark] = useState(!reel.posterUrl);
	const [landscape, setLandscape] = useState(false);
	const [ready, setReady] = useState(false);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		const element = root.current;
		if (!element || typeof IntersectionObserver === "undefined") return;
		const nearby = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "300px" });
		const visible = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.6), { threshold: [0, 0.6] });
		nearby.observe(element);
		visible.observe(element);
		return () => {
			nearby.disconnect();
			visible.disconnect();
		};
	}, []);

	const shouldPlay = ready && ((mode === "hover" && hovered) || (mode === "inView" && inView));
	useEffect(() => {
		const element = video.current;
		if (!element) return;
		if (shouldPlay) void element.play().catch(() => undefined);
		else element.pause();
	}, [shouldPlay]);

	const label = `Open video ${index + 1} of ${total} for ${productName}${reel.title ? `: ${reel.title}` : ""}`;
	return (
		<div
			className={styles.reelTile}
			onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
			onPointerLeave={() => setHovered(false)}
			ref={root}
		>
			<button aria-label={label} className={styles.reelCard} onClick={onOpen} type="button">
				<span
					className={styles.reelPoster}
					data-dark={posterDark || undefined}
					data-landscape={landscape || undefined}
					data-playing={playing || undefined}
					style={reel.posterUrl ? ({ "--poster": `url("${reel.posterUrl}")` } as React.CSSProperties) : undefined}
				>
					{reel.posterUrl ? (
						// eslint-disable-next-line @next/next/no-img-element -- /api/uploads poster; read for brightness below
						<img
							alt=""
							className={styles.reelPosterImage}
							decoding="async"
							loading="lazy"
							onLoad={(event) => luma(event.currentTarget) < 22 && setPosterDark(true)}
							// Already loaded (cache) before React attached onLoad? Check it now.
							ref={(image) => {
								if (image?.complete && image.naturalWidth && luma(image) < 22) setPosterDark(true);
							}}
							src={reel.posterUrl}
						/>
					) : null}
					{near ? (
						<video
							className={styles.reelPreview}
							loop
							muted
							onLoadedMetadata={(event) => {
								const element = event.currentTarget;
								setLandscape(element.videoWidth > element.videoHeight);
								// A still from 40% in replaces a dark or missing poster.
								if (Number.isFinite(element.duration)) element.currentTime = element.duration * 0.4;
							}}
							onLoadedData={() => setReady(true)}
							onPause={() => setPlaying(false)}
							onPlaying={() => setPlaying(true)}
							playsInline
							preload="metadata"
							ref={video}
							src={reel.videoUrl}
						/>
					) : null}
					<span className={styles.reelPlay}><Play size={18} fill="currentColor" /></span>
					{total > 1 ? <span className={styles.reelIndex}>{index + 1}/{total}</span> : null}
					{landscape ? <span className={styles.reelLandscape} title="Reels, TikTok and Shorts are vertical - this video will be cropped or letterboxed">Landscape</span> : null}
					{formatDuration(reel.durationSeconds) ? <span className={styles.reelDuration}>{formatDuration(reel.durationSeconds)}</span> : null}
				</span>
				<span className={styles.reelMeta}>
					<strong>{reel.title || `Video ${index + 1}`}</strong>
				</span>
			</button>
			{/* Straight download, without opening the viewer. */}
			<a
				aria-label={`Download ${reel.title || `video ${index + 1}`}`}
				className={styles.reelQuickDownload}
				download
				href={`${reel.videoUrl}?download=${encodeURIComponent(fileName(reel, "instagram", index))}`}
			>
				<Download size={16} />
			</a>
		</div>
	);
}

export default function SellerReels({
	onBrowse,
	onToast,
	storeLink,
	storeName,
}: {
	onBrowse: () => void;
	onToast: (message: string) => void;
	/** The store's home URL (custom domain when active). */
	storeLink: string;
	storeName: string;
}) {
	const reels = useLiveResource<SellerReel[] | null>({
		endpoint: "/api/seller/reels",
		initialData: null,
		topics: ["products"],
	});
	const [query, setQuery] = useState("");
	const [productFilter, setProductFilter] = useState<string>("all");
	const [open, setOpen] = useState<{ index: number; productId: string } | null>(null);
	const list = useMemo(() => reels.data ?? [], [reels.data]);
	const groups = useMemo(() => groupByProduct(list), [list]);
	const visibleGroups = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return groups
			.filter((group) => productFilter === "all" || group.product.id === productFilter)
			.map((group) => (needle && !`${group.product.name} ${group.product.category}`.toLowerCase().includes(needle)
				? { ...group, reels: group.reels.filter((reel) => reel.title.toLowerCase().includes(needle)) }
				: group))
			.filter((group) => group.reels.length);
	}, [groups, productFilter, query]);
	const openGroup = open ? groups.find((group) => group.product.id === open.productId) : undefined;

	function downloadAll(group: ProductGroup) {
		// One anchor click per video, spaced out so browsers don't drop them.
		group.reels.forEach((reel, index) => {
			window.setTimeout(() => {
				const link = document.createElement("a");
				link.href = `${reel.videoUrl}?download=${encodeURIComponent(fileName(reel, "instagram", index))}`;
				link.download = "";
				document.body.appendChild(link);
				link.click();
				link.remove();
			}, index * 700);
		});
		onToast(`Downloading ${group.reels.length} videos - allow multiple downloads if your browser asks`);
	}

	if (reels.data === null) {
		return (
			<div className={styles.reelRail} aria-busy="true">
				{Array.from({ length: 6 }, (_, index) => <div className={`${styles.skeleton} ${styles.reelSkeleton}`} key={index} />)}
			</div>
		);
	}

	if (!list.length) {
		return (
			<div className={`${styles.card} ${styles.empty}`}>
				<span className={styles.emptyIcon}><Clapperboard size={28} /></span>
				<h2 className={styles.cardTitle}>No reels yet</h2>
				<p className={styles.muted} style={{ maxWidth: 440 }}>
					Avokarto makes ready-to-post vertical videos for catalog products. Add products to your store and their reels appear here - download
					them and post on Instagram Reels, TikTok or YouTube Shorts with your store link.
				</p>
				<button className={styles.btn} onClick={onBrowse} type="button"><PackagePlus size={18} /> Add products</button>
			</div>
		);
	}

	return (
		<div className={styles.stack}>
			<div className={`${styles.card} ${styles.reelIntro}`}>
				<div className={styles.reelIntroText}>
					<h2 className={styles.cardTitle}>Ready-to-post reels</h2>
					<p className={styles.muted}>
						{list.length} {list.length === 1 ? "video" : "videos"} for {groups.length} {groups.length === 1 ? "product" : "products"} in your store. Each
						comes with a caption and a tracked link, so you&apos;ll see which platform brings shoppers in Analytics.
					</p>
				</div>
				<div className={styles.reelPlatformIcons} aria-hidden="true">
					<span title="Instagram Reels"><Instagram size={18} /></span>
					<span title="TikTok"><Music2 size={18} /></span>
					<span title="YouTube Shorts"><Youtube size={18} /></span>
				</div>
			</div>

			{groups.length > 1 || list.length > 6 ? (
				<div className={styles.reelToolbar}>
					{list.length > 6 ? (
						<div className={styles.searchBar}>
							<Search aria-hidden="true" />
							<input aria-label="Search reels" className={styles.input} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or videos" type="search" value={query} />
						</div>
					) : null}
					{groups.length > 1 ? (
						<div aria-label="Show videos for" className={styles.chips} role="group">
							<button aria-pressed={productFilter === "all"} className={styles.chip} onClick={() => setProductFilter("all")} type="button">
								All products <span className={styles.reelChipCount}>{list.length}</span>
							</button>
							{groups.map((group) => (
								<button aria-pressed={productFilter === group.product.id} className={styles.chip} key={group.product.id} onClick={() => setProductFilter(group.product.id)} type="button">
									{group.product.name} <span className={styles.reelChipCount}>{group.reels.length}</span>
								</button>
							))}
						</div>
					) : null}
				</div>
			) : null}

			{visibleGroups.length ? (
				<div className={styles.reelGroups}>
				{visibleGroups.map((group) => (
					<section aria-label={`${group.product.name} videos`} className={`${styles.card} ${styles.reelGroup}`} key={group.product.id}>
						<header className={styles.reelGroupHead}>
							<span className={styles.reelGroupThumb}>
								{/* eslint-disable-next-line @next/next/no-img-element -- catalog image, shown small */}
								{group.product.imageUrl ? <img alt="" loading="lazy" src={group.product.imageUrl} /> : null}
							</span>
							<div className={styles.reelGroupText}>
								<h3>{group.product.name}</h3>
								<p>
									{money(group.product.price)} · {group.reels.length} {group.reels.length === 1 ? "video" : "videos"}
									{!group.product.isActive ? <span className={styles.badgeAmber}>Hidden in store</span> : null}
								</p>
							</div>
							{group.reels.length > 1 ? (
								<button aria-label={`Download all ${group.reels.length} videos`} className={`${styles.ghost} ${styles.btnSm} ${styles.reelGroupAction}`} onClick={() => downloadAll(group)} type="button">
									<Download size={16} /> <span>Download all</span>
								</button>
							) : null}
						</header>
						<ul className={styles.reelRail}>
							{group.reels.map((reel, index) => (
								<li key={reel.id}>
									<ReelTile index={index} onOpen={() => setOpen({ index, productId: group.product.id })} productName={group.product.name} reel={reel} total={group.reels.length} />
								</li>
							))}
						</ul>
					</section>
				))}
				</div>
			) : (
				<p className={styles.muted}>No videos match &ldquo;{query}&rdquo;.</p>
			)}

			{open && openGroup ? (
				<ReelSheet
					key={open.productId}
					onClose={() => setOpen(null)}
					onToast={onToast}
					reels={openGroup.reels}
					startIndex={Math.min(open.index, openGroup.reels.length - 1)}
					storeLink={storeLink}
					storeName={storeName}
				/>
			) : null}
		</div>
	);
}

function ReelSheet({
	onClose,
	onToast,
	reels,
	startIndex,
	storeLink,
	storeName,
}: {
	onClose: () => void;
	onToast: (message: string) => void;
	/** Every video of one product; the sheet steps through them. */
	reels: SellerReel[];
	startIndex: number;
	storeLink: string;
	storeName: string;
}) {
	const id = useId();
	const [index, setIndex] = useState(startIndex);
	const reel = reels[index] ?? reels[0];
	const [platform, setPlatform] = useState<Platform>("instagram");
	const productUrl = withShareRef(`${storeLink.replace(/\/+$/, "")}/${reel.product.slug}`, platform);
	// The written caption for this video + platform, unless the seller edited it.
	const captionKey = `${reel.id}:${platform}`;
	const [edited, setEdited] = useState<{ key: string; text: string } | null>(null);
	const caption = edited?.key === captionKey ? edited.text : captionFor(platform, reel.product, storeName, productUrl);
	const [copied, setCopied] = useState<"caption" | "link" | null>(null);
	const [sharing, setSharing] = useState(false);
	const closeRef = useRef<HTMLButtonElement>(null);
	const swipe = useRef<number | null>(null);
	const info = PLATFORMS.find((entry) => entry.key === platform)!;
	const many = reels.length > 1;
	const downloadHref = `${reel.videoUrl}?download=${encodeURIComponent(fileName(reel, platform, index))}`;
	// Phones that can hand a file to another app (Instagram/TikTok/YouTube) get "Post";
	// checked once, client-side.
	const [canShareFiles] = useState(() => {
		if (typeof navigator === "undefined" || typeof navigator.canShare !== "function" || typeof File === "undefined") return false;
		try {
			return navigator.canShare({ files: [new File([""], "reel.mp4", { type: "video/mp4" })] });
		} catch {
			return false;
		}
	});

	const step = (delta: number) => setIndex((current) => (current + delta + reels.length) % reels.length);

	useEffect(() => {
		closeRef.current?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") return onClose();
			// ←/→ step through the product's videos (not while editing the caption).
			if (event.target instanceof HTMLTextAreaElement || reels.length < 2) return;
			if (event.key === "ArrowRight") setIndex((current) => (current + 1) % reels.length);
			if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + reels.length) % reels.length);
		};
		document.addEventListener("keydown", onKey);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = overflow;
		};
	}, [onClose, reels.length]);

	async function copy(text: string, what: "caption" | "link") {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(what);
			onToast(what === "caption" ? "Caption copied" : "Product link copied");
			window.setTimeout(() => setCopied(null), 1800);
		} catch {
			onToast("Couldn't copy - select the text and copy it manually");
		}
	}

	/** Phones: hand the video + caption to the share sheet (Instagram, TikTok, YouTube…). */
	async function post() {
		setSharing(true);
		try {
			const response = await fetch(reel.videoUrl);
			const blob = await response.blob();
			const file = new File([blob], `${fileName(reel, platform, index)}.mp4`, { type: "video/mp4" });
			// Most apps drop shared text, so the caption goes on the clipboard first.
			await navigator.clipboard?.writeText(caption).catch(() => undefined);
			await navigator.share({ files: [file], text: caption, title: reel.product.name });
			onToast("Caption copied - paste it in the app");
		} catch (error) {
			if ((error as Error)?.name !== "AbortError") onToast("Couldn't open the share sheet - use Download instead");
		} finally {
			setSharing(false);
		}
	}

	return (
		<div className={styles.overlay} onClick={(event) => event.target === event.currentTarget && onClose()}>
			<div aria-labelledby={`${id}-title`} aria-modal="true" className={styles.reelSheet} role="dialog">
				<div
					className={styles.reelPlayer}
					// Phones: swipe sideways on the video for the product's other videos.
					onTouchEnd={(event) => {
						if (!many || swipe.current === null) return;
						const dx = event.changedTouches[0].clientX - swipe.current;
						swipe.current = null;
						if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
					}}
					onTouchStart={(event) => { swipe.current = event.touches[0].clientX; }}
				>
					<video autoPlay controls key={reel.id} loop muted playsInline poster={reel.posterUrl || undefined} src={reel.videoUrl} />
					{many ? (
						<>
							<span className={styles.reelCounter} aria-live="polite">Video {index + 1} of {reels.length}</span>
							<button aria-label="Previous video" className={`${styles.reelNav} ${styles.reelNavPrev}`} onClick={() => step(-1)} type="button"><ChevronLeft size={22} /></button>
							<button aria-label="Next video" className={`${styles.reelNav} ${styles.reelNavNext}`} onClick={() => step(1)} type="button"><ChevronRight size={22} /></button>
						</>
					) : null}
				</div>

				<div className={styles.reelPanel}>
					<div className={styles.cardHead} style={{ marginBottom: 0 }}>
						<div style={{ minWidth: 0 }}>
							<p className={styles.hint}>{reel.title || `Video ${index + 1}`}</p>
							<h2 className={styles.cardTitle} id={`${id}-title`}>{reel.product.name}</h2>
							<p className={styles.muted}>{money(reel.product.price)} in your store</p>
						</div>
						<button aria-label="Close" className={`${styles.ghost} ${styles.btnSm}`} onClick={onClose} ref={closeRef} type="button">
							<X size={18} />
						</button>
					</div>

					{many ? (
						<div aria-label={`${reel.product.name} videos`} className={styles.reelStrip} role="group">
							{reels.map((entry, entryIndex) => (
								<button aria-current={entryIndex === index ? "true" : undefined} aria-label={`Video ${entryIndex + 1}${entry.title ? `: ${entry.title}` : ""}`} key={entry.id} onClick={() => setIndex(entryIndex)} type="button">
									<Poster reel={entry} />
									<span>{entryIndex + 1}</span>
								</button>
							))}
						</div>
					) : null}

					<div aria-label="Where are you posting?" className={styles.reelPlatforms} role="group">
						{PLATFORMS.map(({ Icon, key, label, short }) => (
							<button aria-label={label} aria-pressed={platform === key} key={key} onClick={() => setPlatform(key)} type="button">
								<Icon aria-hidden="true" size={16} /> <span>{short}</span>
							</button>
						))}
					</div>

					<label className={styles.field}>
						<span className={styles.label}>Caption</span>
						<textarea className={`${styles.input} ${styles.reelCaption}`} onChange={(event) => setEdited({ key: captionKey, text: event.target.value })} rows={6} value={caption} />
					</label>

					<div className={styles.reelActions}>
						{canShareFiles ? (
							<button className={styles.btn} disabled={sharing} onClick={() => void post()} type="button">
								<Share2 size={18} /> {sharing ? "Preparing…" : `Post to ${info.label.split(" ")[0]}`}
							</button>
						) : null}
						<a className={canShareFiles ? styles.ghost : styles.btn} download href={downloadHref}>
							<Download size={18} /> Download video
						</a>
						<button className={styles.ghost} onClick={() => void copy(caption, "caption")} type="button">
							{copied === "caption" ? <Check size={18} /> : <Copy size={18} />} Copy caption
						</button>
						<button className={styles.ghost} onClick={() => void copy(productUrl, "link")} type="button">
							{copied === "link" ? <Check size={18} /> : <Link2 size={18} />} Copy link
						</button>
					</div>

					<div className={styles.reelTips}>
						<p className={styles.label}>Tips for {info.label}</p>
						<ul>
							{info.tips.map((tip) => <li key={tip}>{tip}</li>)}
						</ul>
						{many ? <p className={styles.hint}>Posting all {reels.length} videos over a few days keeps the product in front of your followers.</p> : null}
						{!canShareFiles ? <p className={styles.hint}>On your phone, open Studio → Reels to post straight to the app.</p> : null}
					</div>
				</div>
			</div>
		</div>
	);
}
