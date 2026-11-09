import { ASPECT_SIZE, drawFrame, type VideoScene } from "./renderer";
import { playSoundtrack, type SoundStyle } from "./soundtrack";

// Best first: MP4/H.264 is what Instagram, TikTok and YouTube all take.
const MIME_CANDIDATES = [
	"video/mp4;codecs=avc1.42E01F,mp4a.40.2",
	"video/mp4;codecs=avc1,mp4a.40.2",
	"video/mp4;codecs=avc1",
	"video/mp4",
	"video/webm;codecs=vp9,opus",
	"video/webm;codecs=vp8,opus",
	"video/webm",
];

/** The format this browser can record, or null when it can't record canvas video at all. */
export function recordingFormat() {
	if (typeof window === "undefined" || typeof MediaRecorder === "undefined" || !("captureStream" in HTMLCanvasElement.prototype)) return null;
	const mime = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
	return mime ? { extension: mime.startsWith("video/mp4") ? ("mp4" as const) : ("webm" as const), mime } : null;
}

export class RenderError extends Error {}

/**
 * Render `scene` to a video file in real time: frames are drawn on an
 * offscreen canvas while MediaRecorder captures it (and the soundtrack).
 * Real time means a 10-second video takes about 10 seconds; the tab must
 * stay visible, as browsers pause animation in background tabs.
 */
export async function renderVideo({
	onProgress,
	quality,
	scene,
	signal,
	sound,
}: {
	onProgress: (fraction: number) => void;
	quality: "hd" | "fast";
	scene: VideoScene;
	signal: AbortSignal;
	sound: SoundStyle;
}) {
	const format = recordingFormat();
	if (!format) throw new RenderError("This browser can't record video. Try the latest Chrome, Edge or Safari.");

	const { height, width } = ASPECT_SIZE[scene.aspect];
	const scale = quality === "hd" ? 1 : 720 / Math.min(width, height);
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(width * scale);
	canvas.height = Math.round(height * scale);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new RenderError("Couldn't start the video renderer.");
	ctx.setTransform(scale, 0, 0, scale, 0, 0);
	drawFrame(ctx, scene, 0);

	const stream = canvas.captureStream(30);
	let audio: AudioContext | null = null;
	let stopSound: (() => void) | null = null;
	if (sound !== "off") {
		audio = new AudioContext();
		const destination = audio.createMediaStreamDestination();
		stopSound = playSoundtrack(audio, destination, sound, scene.durationMs / 1000, 0.05);
		for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);
	}

	const recorder = new MediaRecorder(stream, {
		audioBitsPerSecond: 128_000,
		mimeType: format.mime,
		videoBitsPerSecond: quality === "hd" ? 8_000_000 : 4_000_000,
	});
	const chunks: Blob[] = [];
	recorder.ondataavailable = (event) => {
		if (event.data.size) chunks.push(event.data);
	};
	const stopped = new Promise<void>((resolve) => {
		recorder.onstop = () => resolve();
	});

	let frame = 0;
	let failure: Error | null = null;
	const cleanup = () => {
		cancelAnimationFrame(frame);
		stopSound?.();
		void audio?.close();
		for (const track of stream.getTracks()) track.stop();
		document.removeEventListener("visibilitychange", onHidden);
	};
	const fail = (error: Error) => {
		failure = error;
		if (recorder.state !== "inactive") recorder.stop();
	};
	function onHidden() {
		if (document.hidden) fail(new RenderError("Rendering paused because the tab was hidden - keep this tab open until it finishes, then try again."));
	}
	document.addEventListener("visibilitychange", onHidden);
	signal.addEventListener("abort", () => fail(new RenderError("Cancelled.")), { once: true });

	recorder.start(250);
	const start = performance.now();
	await new Promise<void>((resolve) => {
		const tick = () => {
			if (failure) return resolve();
			const elapsed = performance.now() - start;
			drawFrame(ctx, scene, elapsed);
			onProgress(Math.min(1, elapsed / scene.durationMs));
			if (elapsed >= scene.durationMs) {
				// Hold the last frame briefly so the recorder captures it.
				window.setTimeout(resolve, 250);
				return;
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	});
	if (recorder.state !== "inactive") recorder.stop();
	await stopped;
	cleanup();
	if (failure) throw failure;

	const blob = new Blob(chunks, { type: format.mime.split(";")[0] });
	if (!blob.size) throw new RenderError("The recording came out empty. Try again, or switch to Fast quality.");

	// A poster frame for the library (around the product reveal).
	const poster = await new Promise<Blob | null>((resolve) => {
		drawFrame(ctx, scene, scene.durationMs * 0.4);
		canvas.toBlob(resolve, "image/jpeg", 0.86);
	});
	return { blob, extension: format.extension, poster };
}
