"use client";

import { Globe, Lock, MousePointerClick, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StoreTheme } from "@/lib/storeThemes";
import s from "./sell.module.css";
import { useLiveStore } from "./useLiveStore";

export const PROTOTYPE_DEVICES = {
	desktop: { height: 800, label: "Desktop", width: 1280 },
	tablet: { height: 1000, label: "Tablet", width: 820 },
	phone: { height: 780, label: "Phone", width: 390 },
} as const;
export type PrototypeDevice = keyof typeof PROTOTYPE_DEVICES;
// Bezel (tablet/phone padding) or border (desktop) on each side, in px - kept in step with sell.module.css.
const FRAME_EDGE: Record<PrototypeDevice, number> = { desktop: 1, phone: 8, tablet: 10 };

/**
 * The real storefront (the /store-preview demo store) at a true device
 * width, scaled to fit the space it's given, restyling live as the look changes.
 *
 * Like a map embed it starts as a picture: the page scrolls past it
 * normally until the visitor chooses to explore, and it lets go again
 * when the pointer leaves.
 */
export default function StorePrototype({
	accent,
	device,
	focus = "top",
	host,
	margin,
	maxHeight,
	name,
	path,
	theme,
}: {
	accent: string;
	device: PrototypeDevice;
	/** Which part of the store to show: the top, or the products and their prices. */
	focus?: "products" | "top";
	host: string;
	/** Prices the demo products at this margin (percent); the demo's default when omitted. */
	margin?: number;
	/** Maximum screen height in CSS pixels; defaults to the device's usual preview height. */
	maxHeight?: number;
	name: string;
	/** Shown in the address bar, e.g. "/store/riya-s-picks". */
	path: string;
	theme: StoreTheme;
}) {
	const box = useRef<HTMLDivElement>(null);
	const exploreButton = useRef<HTMLButtonElement>(null);
	const restoreFocus = useRef(false);
	const [width, setWidth] = useState(0);
	const [interactive, setInteractive] = useState(false);
	const { frame, frameLoad, onLoad, ready, src } = useLiveStore({ accent, device, focus, margin, name, theme });
	const spec = PROTOTYPE_DEVICES[device];

	useLayoutEffect(() => {
		const element = box.current;
		if (!element) return;
		const measure = () => setWidth(element.clientWidth);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	// Escape works both in the outer page and inside the same-origin preview.
	// Keep a visible exit available while the embedded store receives keyboard focus.
	useEffect(() => {
		if (!interactive) {
			if (restoreFocus.current) {
				exploreButton.current?.focus({ preventScroll: true });
				restoreFocus.current = false;
			}
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			restoreFocus.current = true;
			setInteractive(false);
		};
		const previewDocument = frame.current?.contentDocument;
		window.addEventListener("keydown", onKeyDown);
		previewDocument?.addEventListener("keydown", onKeyDown);
		frame.current?.focus({ preventScroll: true });
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			previewDocument?.removeEventListener("keydown", onKeyDown);
		};
	}, [frame, interactive, frameLoad]);

	// Fit the width; desktop/tablet also stay short enough to see the page around them.
	const heightLimit = maxHeight ?? (device === "desktop" ? 680 : device === "tablet" ? 640 : 620);
	const room = width - FRAME_EDGE[device] * 2;
	const scale = room > 0 ? Math.min(1, room / spec.width, heightLimit / spec.height) : 0;
	const shown = { height: Math.round(spec.height * scale), width: Math.round(spec.width * scale) };

	return (
		<div className={s.protoBox} ref={box}>
			<div
				className={s.protoDevice}
				data-device={device}
				onPointerLeave={() => {
					if (interactive && document.activeElement === frame.current) restoreFocus.current = true;
					setInteractive(false);
				}}
			>
				{device === "desktop" ? (
					<div aria-hidden="true" className={s.protoChrome}>
						<span className={s.stageDots}><span /><span /><span /></span>
						<span className={s.protoUrl}><Lock size={11} /> {host}{path}</span>
						<Globe size={14} />
					</div>
				) : null}
				<div className={s.protoViewport} style={{ height: shown.height || 320, width: shown.width || "100%" }}>
					{scale ? (
						<iframe
							className={s.protoFrame}
							inert={!interactive}
							loading="lazy"
							onLoad={onLoad}
							ref={frame}
							src={src}
							style={{
								height: spec.height,
								pointerEvents: interactive ? "auto" : "none",
								transform: `scale(${scale})`,
								width: spec.width,
							}}
							tabIndex={interactive ? 0 : -1}
							title={`Live preview: a store using the ${theme} theme on ${spec.label.toLowerCase()}`}
						/>
					) : null}
					{!ready ? <div aria-hidden="true" className={s.protoLoading} /> : null}
					<button
						aria-label={interactive ? "Stop exploring store" : "Explore this store"}
						className={s.protoExplore}
						data-exploring={interactive}
						onClick={() => {
							restoreFocus.current = interactive;
							setInteractive(!interactive);
						}}
						ref={exploreButton}
						type="button"
					>
						{interactive ? <X aria-hidden="true" size={16} /> : <MousePointerClick aria-hidden="true" size={16} />}
						{interactive ? "Stop exploring" : "Explore this store"}
					</button>
				</div>
			</div>
		</div>
	);
}
