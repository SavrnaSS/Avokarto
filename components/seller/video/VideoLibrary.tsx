"use client";

import { Clapperboard, Download, Film, Loader2, Play, Share2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { sellerRequest } from "../sellerApi";
import styles from "../seller.module.css";
import v from "./studio.module.css";

export type SavedVideo = {
	aspect: "9:16" | "1:1" | "16:9";
	createdAt: string;
	durationSeconds: number;
	format: "mp4" | "webm";
	id: string;
	posterUrl: string;
	sizeBytes: number;
	template: string;
	title: string;
	videoUrl: string;
};

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

/** A clean poster with one play button; the browser's controls appear once it plays. */
function LibraryPlayer({ video }: { video: SavedVideo }) {
	const element = useRef<HTMLVideoElement>(null);
	const [started, setStarted] = useState(false);
	return (
		<>
			{/* Without a poster, a frame from half a second in stands in for one. */}
			<video controls={started} playsInline poster={video.posterUrl || undefined} preload={video.posterUrl ? "none" : "metadata"} ref={element} src={video.posterUrl ? video.videoUrl : `${video.videoUrl}#t=0.5`} />
			{started ? null : (
				<button
					aria-label={`Play ${video.title || "video"}`}
					className={v.libraryPlay}
					onClick={() => {
						setStarted(true);
						void element.current?.play().catch(() => undefined);
					}}
					type="button"
				>
					<span><Play fill="currentColor" size={20} /></span>
				</button>
			)}
		</>
	);
}

function fileName(video: SavedVideo) {
	return `${(video.title || "video").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "video"}-${video.aspect.replace(":", "x")}`;
}

/**
 * Studio → Videos → My videos: everything the seller saved from the
 * studio, ready to download or (on phones) share straight to an app.
 */
export default function VideoLibrary({
	error,
	loading,
	onChanged,
	onCreate,
	onToast,
	videos,
}: {
	error: string | null;
	loading: boolean;
	onChanged: () => void;
	onCreate: () => void;
	onToast: (message: string) => void;
	videos: SavedVideo[];
}) {
	const [confirming, setConfirming] = useState<string | null>(null);
	const [busy, setBusy] = useState<string | null>(null);

	async function remove(video: SavedVideo) {
		setBusy(video.id);
		try {
			await sellerRequest("DELETE", `/api/seller/videos/${encodeURIComponent(video.id)}`);
			onToast("Video deleted");
			onChanged();
		} catch (caught) {
			onToast((caught as Error).message);
		} finally {
			setBusy(null);
			setConfirming(null);
		}
	}

	async function share(video: SavedVideo) {
		setBusy(video.id);
		try {
			const blob = await fetch(video.videoUrl, { credentials: "same-origin" }).then((response) => response.blob());
			const file = new File([blob], `${fileName(video)}.${video.format}`, { type: blob.type || `video/${video.format}` });
			if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: video.title });
			else onToast("Sharing isn't available here - download it instead.");
		} catch (caught) {
			if ((caught as Error).name !== "AbortError") onToast("Couldn't share - download it instead.");
		} finally {
			setBusy(null);
		}
	}

	if (loading && !videos.length) {
		return <div className={v.libraryGrid}>{[0, 1, 2].map((index) => <div className={styles.skeleton} key={index} style={{ aspectRatio: "9 / 14" }} />)}</div>;
	}
	if (error) return <p className={styles.alert} role="alert">{error}</p>;
	if (!videos.length) {
		return (
			<div className={`${styles.card} ${styles.empty}`}>
				<span className={styles.emptyIcon}><Film /></span>
				<p className={styles.cardTitle}>No saved videos yet</p>
				<p className={styles.muted}>Make one in the studio and tap &ldquo;Save to My videos&rdquo; - it&apos;ll be here on every device.</p>
				<button className={styles.btn} onClick={onCreate} type="button"><Clapperboard size={16} /> Create a video</button>
			</div>
		);
	}

	return (
		<ul className={v.libraryGrid}>
			{videos.map((video) => (
				<li className={v.libraryCard} key={video.id}>
					<div className={v.libraryMedia} data-aspect={video.aspect}>
						<LibraryPlayer video={video} />
						<span className={v.libraryTag}>{video.aspect} · {Math.round(video.durationSeconds)}s</span>
					</div>
					<div className={v.libraryBody}>
						<p className={v.libraryTitle}>{video.title || "Untitled video"}</p>
						<p className={styles.hint}>
							{dateFormat.format(new Date(video.createdAt))} · {video.format.toUpperCase()} · {(video.sizeBytes / 1024 / 1024).toFixed(1)} MB
						</p>
						<div className={v.libraryActions}>
							<a className={`${styles.ghost} ${styles.btnSm}`} download href={`${video.videoUrl}?download=${encodeURIComponent(`${fileName(video)}.${video.format}`)}`}>
								<Download size={14} /> Download
							</a>
							<button aria-label="Share video" className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`} disabled={busy === video.id} onClick={() => void share(video)} type="button">
								{busy === video.id && confirming !== video.id ? <Loader2 className={styles.spin} size={14} /> : <Share2 size={14} />}
							</button>
							{confirming === video.id ? (
								<button className={`${styles.danger} ${styles.btnSm}`} disabled={busy === video.id} onClick={() => void remove(video)} type="button">
									{busy === video.id ? <Loader2 className={styles.spin} size={14} /> : <Trash2 size={14} />} Delete?
								</button>
							) : (
								<button aria-label="Delete video" className={`${styles.ghost} ${styles.btnSm} ${styles.iconBtn}`} onClick={() => setConfirming(video.id)} type="button">
									<Trash2 size={14} />
								</button>
							)}
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
