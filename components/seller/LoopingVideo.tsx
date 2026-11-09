"use client";

import { useEffect, useRef, useState } from "react";
import v from "./looping-video.module.css";

/**
 * A silent looping clip for the landing page. It loads only when it scrolls
 * into view and stops when it leaves. With reduced motion or data saver on, the
 * still stays. Decorative, so it belongs inside an aria-hidden parent.
 *
 * Three layers, so a browser that fails at one still shows the next: the still
 * behind, the video over it, and a canvas copy on top. Chrome can leave a video
 * blank inside a 3D scene while it plays, which the copy covers; Safari can
 * leave the copy empty, and a clear canvas lets its video show through. If
 * autoplay is refused, the first tap or key press starts it.
 */
export default function LoopingVideo({ canvasHeight, canvasWidth, onProgress, playIcon, poster, src }: {
	canvasHeight: number;
	canvasWidth: number;
	/** Called with how far through the clip it is, from 0 to 1. */
	onProgress?: (fraction: number) => void;
	/** Shown whenever the clip is not playing. */
	playIcon?: React.ReactNode;
	poster: string;
	src: string;
}) {
	const video = useRef<HTMLVideoElement>(null);
	const screen = useRef<HTMLCanvasElement>(null);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		const element = video.current;
		if (!element) return;
		const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
		if (saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let visible = false;
		const start = () => {
			if (!visible) return;
			element.muted = true;
			element.play().catch(() => {
				setPlaying(false);
				document.addEventListener("pointerdown", start, { once: true });
				document.addEventListener("keydown", start, { once: true });
			});
		};
		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible) start();
			else element.pause();
		}, { threshold: 0.25 });
		observer.observe(element);
		return () => {
			observer.disconnect();
			document.removeEventListener("pointerdown", start);
			document.removeEventListener("keydown", start);
		};
	}, []);

	useEffect(() => {
		const source = video.current;
		const target = screen.current;
		const context = target?.getContext("2d");
		if (!playing || !source || !target || !context) return;
		let frame = 0;
		const draw = () => {
			if (source.readyState >= 2) context.drawImage(source, 0, 0, target.width, target.height);
			frame = requestAnimationFrame(draw);
		};
		draw();
		return () => cancelAnimationFrame(frame);
	}, [playing]);

	return (
		<>
			<span className={v.frame} style={{ backgroundImage: `url(${poster})` }}>
				<video
					loop
					muted
					onPause={() => setPlaying(false)}
					onPlaying={() => setPlaying(true)}
					onTimeUpdate={({ currentTarget }) => { if (currentTarget.duration) onProgress?.(currentTarget.currentTime / currentTarget.duration); }}
					playsInline
					poster={poster}
					preload="none"
					ref={video}
					src={src}
				/>
				<canvas height={canvasHeight} ref={screen} width={canvasWidth} />
			</span>
			{playing ? null : playIcon}
		</>
	);
}
