"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { StoreTheme } from "@/lib/storeThemes";
import s from "./device-scene.module.css";
import type { PrototypeDevice } from "./StorePrototype";
import { useLiveStore } from "./useLiveStore";

type Look = { accent: string; focus: "products" | "top"; margin: number; name: string; theme: StoreTheme };

const LAPTOP = { height: 800, width: 1280 };
const PHONE = { height: 780, width: 390 };
const TABLET = { height: 1000, width: 820 };

/** One real store, at true device width, shrunk to the size of its screen. */
function Screen({ device, look, shownWidth, size }: { device: string; look: Look; shownWidth: number; size: { height: number; width: number } }) {
	const { frame, onLoad, ready, src } = useLiveStore({ ...look, device });
	const scale = shownWidth / size.width;
	return (
		<div className={s.screen} style={{ height: size.height * scale, width: shownWidth }}>
			<iframe
				className={s.frame}
				inert
				loading="lazy"
				onLoad={onLoad}
				ref={frame}
				src={src}
				style={{ height: size.height, transform: `scale(${scale})`, width: size.width }}
				tabIndex={-1}
				title={`Your store on a ${device}`}
			/>
			{ready ? null : <span className={s.loading} />}
		</div>
	);
}

/** Makes a device a button that opens it up close, when the host allows that. */
function Pick({ device, label, onPick }: { device: PrototypeDevice; label: string; onPick?: (device: PrototypeDevice) => void }) {
	return onPick ? <button aria-label={`Open the ${label} view`} className={s.pick} onClick={() => onPick(device)} title={`Open the ${label} view`} type="button" /> : null;
}

/**
 * The seller's real store on real-looking devices, whole and live. The devices
 * are sized from the space they're given, so the group always fits, from a
 * phone's top band to a full desktop canvas.
 */
export default function DeviceScene({ changeKey, onPick, tablet = false, ...look }: Look & {
	changeKey: string;
	/** Lets each device open up close. Without it the scene is a picture. */
	onPick?: (device: PrototypeDevice) => void;
	/** Adds a tablet; for wide canvases, since it costs the laptop some size. */
	tablet?: boolean;
}) {
	const box = useRef<HTMLDivElement>(null);
	const [room, setRoom] = useState({ height: 0, width: 0 });

	useLayoutEffect(() => {
		const element = box.current;
		if (!element) return;
		const measure = () => setRoom({ height: element.clientHeight, width: element.clientWidth });
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const baseHeight = Math.min(18, Math.max(6, room.height * 0.05));
	const lidHeight = Math.max(0, Math.min(room.height - baseHeight - 6, (room.width * (tablet ? 0.62 : 0.78)) / 1.6));
	const lidWidth = lidHeight * 1.6;
	const edge = Math.max(3, Math.round(lidWidth * 0.012));
	const phoneHeight = lidHeight * 0.86;
	const phoneEdge = Math.max(2, Math.round(phoneHeight * 0.016));
	const phoneScreen = (phoneHeight - phoneEdge * 2) / 2;
	const tabletHeight = lidHeight * 0.78;
	const tabletEdge = Math.max(3, Math.round(tabletHeight * 0.018));
	const tabletScreen = ((tabletHeight - tabletEdge * 2) * TABLET.width) / TABLET.height;
	// Tucked behind the laptop's edge only, so it never covers the store's name.
	const tabletRoom = tablet ? tabletScreen * 0.9 : 0;
	// Spare height goes mostly above the group, keeping it near the middle of a tall canvas.
	const lift = Math.max(0, (room.height - lidHeight - baseHeight) * 0.38);

	return (
		<div className={s.scene} ref={box} style={{ "--accent": look.accent, "--lift": `${lift}px` } as React.CSSProperties}>
			<span className={s.floor} />
			<span className={s.light} />
			{lidHeight > 0 ? (
				<div className={s.group} style={{ height: lidHeight + baseHeight, width: lidWidth + phoneScreen * 0.62 + tabletRoom }}>
					<div className={s.laptop} style={{ left: tabletRoom, width: lidWidth }}>
						<div className={s.lid} style={{ borderRadius: edge * 2, padding: edge }}>
							<Screen device="laptop" look={look} shownWidth={lidWidth - edge * 2} size={LAPTOP} />
							<span className={s.sweep} key={changeKey} />
						</div>
						<div className={s.base} style={{ height: baseHeight }} />
						<Pick device="desktop" label="laptop" onPick={onPick} />
					</div>
					{tablet ? (
						<div className={s.tablet} style={{ borderRadius: tabletEdge * 3, padding: tabletEdge }}>
							<div className={s.phoneGlass} style={{ borderRadius: tabletEdge * 2 }}>
								<Screen device="tablet" look={look} shownWidth={tabletScreen} size={TABLET} />
								<span className={s.sweep} key={changeKey} />
							</div>
							<Pick device="tablet" label="tablet" onPick={onPick} />
						</div>
					) : null}
					<div className={s.phone} style={{ borderRadius: phoneEdge * 5, padding: phoneEdge }}>
						<div className={s.phoneGlass} style={{ borderRadius: phoneEdge * 4 }}>
							<Screen device="phone" look={look} shownWidth={phoneScreen} size={PHONE} />
							<span className={s.sweep} key={changeKey} />
						</div>
						<Pick device="phone" label="phone" onPick={onPick} />
					</div>
				</div>
			) : null}
		</div>
	);
}
