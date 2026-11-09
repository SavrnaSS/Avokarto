"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { useRealtimeResource } from "@/admin/hooks/use-realtime-resource";
import { cn } from "@/admin/utils/cn";
import styles from "./product-form.module.css";

/*
 * Promo reels for a product - short vertical videos resellers download from
 * Studio's Reels page and post on Instagram Reels, TikTok and YouTube Shorts.
 * Uploads go straight to /api/admin/products/[id]/reels (not through the
 * product form), so adding a reel never marks the form as unsaved.
 */

type Reel = {
	createdAt: string;
	durationSeconds: number | null;
	id: string;
	posterUrl: string;
	sizeBytes: number;
	title: string;
	videoUrl: string;
};

type Pending = {
	durationSeconds: number | null;
	file: File;
	height: number;
	poster: Blob | null;
	previewUrl: string;
	title: string;
	width: number;
};

const MAX_REELS = 8;
const MAX_MB = 100;

/** The panel sits inside the product form: Enter in its fields must not save the product. */
function keepEnterInField(event: React.KeyboardEvent<HTMLInputElement>) {
	if (event.key !== "Enter") return;
	event.preventDefault();
	event.currentTarget.blur();
}

function formatDuration(seconds: number | null) {
	if (seconds === null) return "";
	const whole = Math.round(seconds);
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function formatSize(bytes: number) {
	return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Average brightness (0-255) of the frame on a small canvas. */
function brightness(context: CanvasRenderingContext2D, width: number, height: number) {
	const { data } = context.getImageData(0, 0, width, height);
	let total = 0;
	for (let index = 0; index < data.length; index += 4) total += data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
	return total / (data.length / 4);
}

/**
 * Read a video file in the browser: its length and size, plus a cover frame
 * as a JPEG poster. Several moments are sampled and the brightest wins, so
 * a black fade-in or a dark first second never becomes the cover.
 */
function inspectVideo(file: File): Promise<Omit<Pending, "file" | "title">> {
	return new Promise((resolve, reject) => {
		const previewUrl = URL.createObjectURL(file);
		const video = document.createElement("video");
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.src = previewUrl;
		const fail = () => reject(new Error("This video can't be played here - export it as an MP4 (H.264)."));
		video.onerror = fail;
		video.onloadedmetadata = async () => {
			const duration = Number.isFinite(video.duration) ? video.duration : 0;
			const seekTo = (time: number) =>
				new Promise<void>((done) => {
					video.onseeked = () => done();
					video.currentTime = time;
				});
			const probe = document.createElement("canvas");
			probe.width = 36;
			probe.height = 64;
			const probeContext = probe.getContext("2d", { willReadFrequently: true });
			let best = { score: -1, time: Math.min(1, duration / 3) };
			try {
				for (const fraction of [0.15, 0.3, 0.5, 0.7]) {
					const time = duration * fraction;
					await seekTo(time);
					if (!probeContext) break;
					probeContext.drawImage(video, 0, 0, probe.width, probe.height);
					const score = brightness(probeContext, probe.width, probe.height);
					// Prefer the earliest frame that's clearly lit; otherwise the brightest.
					if (score > best.score) best = { score, time };
					if (score > 70) break;
				}
				await seekTo(best.time);
			} catch {
				return fail();
			}
			const canvas = document.createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			canvas.getContext("2d")?.drawImage(video, 0, 0);
			canvas.toBlob(
				(poster) =>
					resolve({
						durationSeconds: duration ? Math.round(duration * 10) / 10 : null,
						height: video.videoHeight,
						poster,
						previewUrl,
						width: video.videoWidth,
					}),
				"image/jpeg",
				0.86,
			);
		};
	});
}

/** Upload with progress (fetch has no upload progress). */
function uploadReel(productId: string, form: FormData, onProgress: (fraction: number) => void) {
	return new Promise<Reel>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open("POST", `/api/admin/products/${productId}/reels`);
		request.withCredentials = true;
		request.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
		request.onload = () => {
			const payload = JSON.parse(request.responseText || "{}") as { data?: Reel; error?: { message?: string } };
			if (request.status >= 200 && request.status < 300 && payload.data) resolve(payload.data);
			else reject(new Error(payload.error?.message ?? "Upload failed."));
		};
		request.onerror = () => reject(new Error("Upload failed - check your connection."));
		request.send(form);
	});
}

export function ReelsPanel({ productId, productName }: { productId?: string; productName: string }) {
	if (!productId) {
		return (
			<article className={cn(styles.card, "rounded-card border border-surface-line bg-surface-card shadow-card")}>
				<h2 className="mb-2 text-[16px] font-semibold text-ink-900">Promo reels</h2>
				<p className="text-[13px] text-ink-400">Reels can be added once this product has been saved.</p>
			</article>
		);
	}
	return <ReelsPanelContent productId={productId} productName={productName} />;
}

function ReelsPanelContent({ productId, productName }: { productId: string; productName: string }) {
	// Live: refreshes on "products" events, so two admins see the same reels.
	const live = useRealtimeResource<Reel[]>({
		endpoint: `/api/admin/products/${productId}/reels`,
		fallbackData: [],
		topics: ["products"],
	});
	const reels = live.hasData ? live.data : null;
	const [actionError, setError] = useState<string | null>(null);
	const error = actionError ?? (live.error ? "Couldn't load reels - refresh to try again." : null);
	const [pending, setPending] = useState<Pending | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	// Free the local preview when it's replaced or the panel closes.
	useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.previewUrl); }, [pending]);

	async function chooseFile(file: File | undefined) {
		setError(null);
		if (!file) return;
		if (file.type && file.type !== "video/mp4") return setError("Reels must be MP4 videos (H.264).");
		if (file.size > MAX_MB * 1024 * 1024) return setError(`Reels must be ${MAX_MB}MB or smaller.`);
		try {
			const info = await inspectVideo(file);
			setPending({ ...info, file, title: file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 120) });
		} catch (inspectError) {
			setError(inspectError instanceof Error ? inspectError.message : "Couldn't read that video.");
		}
	}

	async function upload() {
		if (!pending) return;
		const form = new FormData();
		form.set("file", pending.file);
		form.set("title", pending.title.trim());
		if (pending.durationSeconds !== null) form.set("durationSeconds", String(pending.durationSeconds));
		if (pending.poster) form.set("poster", new File([pending.poster], "poster.jpg", { type: "image/jpeg" }));
		setError(null);
		setProgress(0);
		try {
			await uploadReel(productId, form, setProgress);
			await live.refresh();
			setPending(null);
			if (fileInput.current) fileInput.current.value = "";
		} catch (uploadError) {
			setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
		} finally {
			setProgress(null);
		}
	}

	async function update(reelId: string, body: { move?: "down" | "up"; title?: string }) {
		setBusyId(reelId);
		setError(null);
		try {
			const response = await fetch(`/api/admin/products/${productId}/reels/${reelId}`, {
				body: JSON.stringify(body),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			});
			const payload = (await response.json()) as { error?: { message?: string } };
			if (!response.ok) throw new Error(payload.error?.message ?? "Couldn't update the reel.");
			await live.refresh();
		} catch (updateError) {
			setError(updateError instanceof Error ? updateError.message : "Couldn't update the reel.");
		} finally {
			setBusyId(null);
		}
	}

	async function remove(reelId: string) {
		setBusyId(reelId);
		setError(null);
		try {
			const response = await fetch(`/api/admin/products/${productId}/reels/${reelId}`, { credentials: "include", method: "DELETE" });
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
				throw new Error(payload.error?.message ?? "Couldn't remove the reel.");
			}
			await live.refresh();
		} catch (removeError) {
			setError(removeError instanceof Error ? removeError.message : "Couldn't remove the reel.");
		} finally {
			setBusyId(null);
			setConfirmDelete(null);
		}
	}

	const full = (reels?.length ?? 0) >= MAX_REELS;
	const ratio = pending ? pending.width / pending.height : 0;
	// 9:16 is 0.5625; allow a little slack (e.g. 1080x1916 exports).
	const vertical = pending ? Math.abs(ratio - 9 / 16) < 0.03 : true;

	return (
		<div className="space-y-4">
			<article className={cn(styles.card, "rounded-card border border-surface-line bg-surface-card shadow-card")}>
				<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<h2 className="text-[16px] font-semibold text-ink-900">Promo reels</h2>
						<p className="mt-1 text-[13px] text-ink-500">
							Short vertical videos for {productName}. Resellers selling it download them from Studio → Reels and post them on
							Instagram Reels, TikTok and YouTube Shorts with their own store link.
						</p>
					</div>
					<span className="shrink-0 rounded-full bg-surface-muted px-3 py-1 text-[12px] font-semibold text-ink-600">
						{reels?.length ?? 0}/{MAX_REELS}
					</span>
				</div>

				{/* Upload */}
				{pending ? (
					<div className="flex flex-col gap-4 rounded-card border border-surface-line p-4 sm:flex-row">
						<video className="aspect-[9/16] w-full max-w-[180px] shrink-0 self-center rounded-base bg-black object-cover sm:self-start" controls muted playsInline src={pending.previewUrl} />
						<div className="min-w-0 flex-1 space-y-3">
							<label className="block">
								<span className="mb-1 block text-[13px] font-semibold text-ink-700">Title (shown to resellers)</span>
								<input
									className="h-10 w-full rounded-base border border-surface-line px-3 text-[14px] text-ink-900"
									maxLength={120}
									onChange={(event) => setPending({ ...pending, title: event.target.value })}
									onKeyDown={keepEnterInField}
									value={pending.title}
								/>
							</label>
							<p className="text-[13px] text-ink-500">
								{pending.width}×{pending.height} · {formatDuration(pending.durationSeconds)} · {formatSize(pending.file.size)}
							</p>
							{!vertical ? (
								<p className="rounded-base bg-warning-50 px-3 py-2 text-[13px] text-warning-600" role="status">
									This video isn&apos;t 9:16 vertical ({pending.width}×{pending.height}). Reels, TikTok and Shorts will crop or letterbox it - 1080×1920 works best.
								</p>
							) : null}
							{pending.durationSeconds !== null && pending.durationSeconds > 90 ? (
								<p className="rounded-base bg-warning-50 px-3 py-2 text-[13px] text-warning-600" role="status">
									Longer than 90 seconds - Instagram Reels and YouTube Shorts work best under 60-90s.
								</p>
							) : null}
							{progress !== null ? (
								<div aria-label="Upload progress" aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.round(progress * 100)} className="h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar">
									<div className="h-full bg-brand-600 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
								</div>
							) : null}
							<div className="flex flex-wrap gap-2">
								<button
									className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-4 text-[13px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
									disabled={progress !== null}
									onClick={() => void upload()}
									type="button"
								>
									<Icon className={cn("h-4 w-4", progress !== null && "animate-spin")} name={progress !== null ? "loader" : "upload"} />
									{progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Upload reel"}
								</button>
								<button
									className="inline-flex h-10 items-center rounded-base border border-surface-line px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted disabled:opacity-60"
									disabled={progress !== null}
									onClick={() => setPending(null)}
									type="button"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				) : (
					<label
						className={cn(
							"flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-surface-line px-4 py-8 text-center",
							full ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-600 hover:bg-surface-muted",
						)}
						onDragOver={(event) => event.preventDefault()}
						onDrop={(event) => {
							event.preventDefault();
							if (!full) void chooseFile(event.dataTransfer.files[0]);
						}}
					>
						<Icon className="h-6 w-6 text-ink-400" name="upload" />
						<span className="text-[14px] font-semibold text-ink-900">{full ? `Maximum ${MAX_REELS} reels` : "Drop an MP4 here, or click to choose"}</span>
						<span className="text-[12px] text-ink-500">Vertical 9:16 (1080×1920), H.264 MP4, up to {MAX_MB}MB · 15-60s works best</span>
						{/* No name: the file never joins the product form's data. */}
						<input accept="video/mp4" className="sr-only" disabled={full} onChange={(event) => void chooseFile(event.target.files?.[0])} ref={fileInput} type="file" />
					</label>
				)}

				{error ? (
					<p className="mt-3 rounded-base bg-danger-50 px-3 py-2 text-[13px] text-danger-600" role="alert">{error}</p>
				) : null}
			</article>

			{/* Reels */}
			{reels === null ? (
				<p className="text-[13px] text-ink-400">Loading reels…</p>
			) : reels.length ? (
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
					{reels.map((reel, index) => (
						<li className="flex flex-col overflow-hidden rounded-card border border-surface-line bg-surface-card shadow-card" key={reel.id}>
							<video
								className="aspect-[9/16] w-full bg-black object-cover"
								controls
								playsInline
								poster={reel.posterUrl || undefined}
								preload="none"
								src={reel.videoUrl}
							/>
							<div className="flex flex-1 flex-col gap-2 p-3">
								<input
									aria-label="Reel title"
									className="h-9 w-full rounded-base border border-surface-line px-2 text-[13px] font-semibold text-ink-900"
									defaultValue={reel.title}
									maxLength={120}
									onBlur={(event) => event.target.value.trim() !== reel.title && void update(reel.id, { title: event.target.value })}
									onKeyDown={keepEnterInField}
									placeholder="Untitled reel"
								/>
								<p className="text-[12px] text-ink-500">
									{[formatDuration(reel.durationSeconds), formatSize(reel.sizeBytes)].filter(Boolean).join(" · ")}
								</p>
								<div className="mt-auto flex items-center gap-1">
									<button aria-label="Move earlier" className="grid h-8 w-8 place-items-center rounded-base border border-surface-line text-ink-600 hover:bg-surface-muted disabled:opacity-40" disabled={index === 0 || busyId === reel.id} onClick={() => void update(reel.id, { move: "up" })} type="button">
										<Icon className="h-4 w-4" name="arrow-left" />
									</button>
									<button aria-label="Move later" className="grid h-8 w-8 place-items-center rounded-base border border-surface-line text-ink-600 hover:bg-surface-muted disabled:opacity-40" disabled={index === reels.length - 1 || busyId === reel.id} onClick={() => void update(reel.id, { move: "down" })} type="button">
										<Icon className="h-4 w-4" name="arrow-right" />
									</button>
									{confirmDelete === reel.id ? (
										<button className="ml-auto h-8 rounded-base bg-danger-600 px-3 text-[12px] font-semibold text-white hover:bg-danger-700 disabled:opacity-60" disabled={busyId === reel.id} onClick={() => void remove(reel.id)} type="button">
											Remove?
										</button>
									) : (
										<button aria-label="Remove reel" className="ml-auto grid h-8 w-8 place-items-center rounded-base border border-surface-line text-danger-600 hover:bg-danger-50" onClick={() => setConfirmDelete(reel.id)} type="button">
											<Icon className="h-4 w-4" name="trash-2" />
										</button>
									)}
								</div>
							</div>
						</li>
					))}
				</ul>
			) : (
				<p className="text-[13px] text-ink-400">No reels yet - upload the first one above.</p>
			)}
		</div>
	);
}
