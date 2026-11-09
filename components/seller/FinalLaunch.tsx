"use client";

import { Check, Globe, Play, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { readableOn } from "@/components/stores/storeTheme";
import LoopingVideo from "./LoopingVideo";
import ProductImage from "./ProductImage";
import { money } from "./sellerApi";
import l from "./final-launch.module.css";

/**
 * The panel's living background: a soft light and the hero's dot grid follow the
 * pointer across the whole panel, and it warms from the bottom once the store
 * has a name. Without a pointer or with reduced motion, it rests at the top.
 */
export function LaunchBackdrop({ complete }: { complete: boolean }) {
	const backdrop = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = backdrop.current;
		const panel = element?.parentElement;
		if (!element || !panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let frame = 0;
		const follow = (event: PointerEvent) => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const box = panel.getBoundingClientRect();
				element.style.setProperty("--spot-x", `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
				element.style.setProperty("--spot-y", `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
			});
		};
		const rest = () => {
			cancelAnimationFrame(frame);
			element.style.removeProperty("--spot-x");
			element.style.removeProperty("--spot-y");
		};
		panel.addEventListener("pointermove", follow);
		panel.addEventListener("pointerleave", rest);
		return () => {
			cancelAnimationFrame(frame);
			panel.removeEventListener("pointermove", follow);
			panel.removeEventListener("pointerleave", rest);
		};
	}, []);

	return <div aria-hidden="true" className={l.backdrop} data-complete={complete ? "" : undefined} ref={backdrop} />;
}

/**
 * The close of the page as a launch sequence. Three of the four things a store
 * needs are already done for the seller, so the rail shows the name as the only
 * step left, and typing it completes the line.
 */
export function LaunchRail({ draft, themeLabel }: { draft: string; themeLabel: string }) {
	const steps = [
		{ done: true, label: "Theme", value: themeLabel },
		{ done: true, label: "Products", value: "Ready to add" },
		{ done: true, label: "Shipping", value: "Handled by us" },
		{ done: Boolean(draft), label: "Your name", value: draft || "Type it above" },
	];
	return (
		<ol className={l.rail} data-complete={draft ? "" : undefined}>
			<span aria-hidden="true" className={l.track}><span /></span>
			{steps.map((step) => (
				<li data-done={step.done ? "" : undefined} key={step.label}>
					<span aria-hidden="true" className={l.node}>{step.done ? <Check size={14} strokeWidth={2.5} /> : null}</span>
					<span className={l.stepText}><small>{step.label}</small><strong>{step.value}</strong></span>
				</li>
			))}
		</ol>
	);
}

type WallProduct = { id: string | number; imgSrc: string; salePrice: number };

// Two of these are already on the page, so a visitor downloads them only once.
const REELS = ["reel-dog-outfit", "reel-cozycarry", "reel-kids-costume", "reel-halloween-prank"];

/**
 * The seller's store with silent reels around it. Desktop curves four around the
 * store and leans toward the pointer, tablets show two, and phones get a row to
 * swipe through. Each reel loads only once it is on screen, so hidden ones cost nothing.
 */
export function LaunchWall({ accent, address, background, name, products }: {
	accent: string;
	address: string;
	background: string;
	name: string;
	products: WallProduct[];
}) {
	const wall = useRef<HTMLDivElement>(null);
	const plane = useRef<HTMLDivElement>(null);
	const [seen, setSeen] = useState(false);

	useEffect(() => {
		const element = wall.current;
		if (!element) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			setSeen(true);
			observer.disconnect();
		}, { threshold: 0.2 });
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const element = wall.current;
		const target = plane.current;
		if (!element || !target || !window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
		let frame = 0;
		const lean = (event: PointerEvent) => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const box = element.getBoundingClientRect();
				target.style.setProperty("--lean-x", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
				target.style.setProperty("--lean-y", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
			});
		};
		const settle = () => {
			cancelAnimationFrame(frame);
			target.style.setProperty("--lean-x", "0");
			target.style.setProperty("--lean-y", "0");
		};
		element.addEventListener("pointermove", lean);
		element.addEventListener("pointerleave", settle);
		return () => {
			cancelAnimationFrame(frame);
			element.removeEventListener("pointermove", lean);
			element.removeEventListener("pointerleave", settle);
		};
	}, []);

	const style = { "--store-accent": accent, "--store-bg": background, "--store-ink": readableOn(background), "--store-on-accent": readableOn(accent) } as React.CSSProperties;
	// The first row is products 1-3 and the second, which runs off the panel's edge, 8-10.
	const inStore = [...products.slice(0, 3), ...products.slice(7, 10)];

	return (
		<div aria-hidden="true" className={l.wall} data-seen={seen ? "" : undefined} ref={wall}>
			<span className={l.live}><span className={l.dot} />Your store, live</span>
			<div className={l.arc}>
				<div className={l.plane} ref={plane}>
					<div className={l.window} style={style}>
						<span className={l.address}><Globe size={12} /><span>{address}</span></span>
						<span className={l.shop}>
							<span className={l.logo}>{(name[0] ?? "Y").toUpperCase()}</span>
							<strong>{name}</strong>
							<ShoppingBag size={16} />
						</span>
						<span className={l.banner}>
							<span>Good finds, picked just for you</span>
							<b>Shop the collection</b>
						</span>
						<span className={l.tiles}>
							{inStore.map((product) => (
								<span className={l.tile} key={product.id}>
									<span className={l.tilePhoto}><ProductImage alt="" fit="contain" sizes="160px" src={product.imgSrc} /></span>
									<em>{money(product.salePrice)}</em>
								</span>
							))}
						</span>
					</div>
					{REELS.map((reel, place) => (
						<span className={l.side} data-place={place} key={reel}>
							<LoopingVideo canvasHeight={640} canvasWidth={360} playIcon={<span className={l.reelPlay}><Play size={16} /></span>} poster={`/assets/videos/${reel}.jpg`} src={`/assets/videos/${reel}.mp4`} />
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
