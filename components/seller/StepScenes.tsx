"use client";

import { Check, Heart, Package, Play, Send } from "lucide-react";
import { useRef } from "react";
import LoopingVideo from "./LoopingVideo";
import ProductImage from "./ProductImage";
import { money } from "./sellerApi";
import c from "./step-scenes.module.css";

type Pick = { id: string | number; imgSrc: string; profit: number };

/** Step 1: three real products with their real profit, the middle one picked. */
export function PickScene({ products }: { products: Pick[] }) {
	const slots = [0, 1, 2].map((index) => products[index] ?? null);
	return (
		<div className={c.scene}>
			<div className={c.fan}>
				{slots.map((product, index) => (
					<span className={c.pick} key={product?.id ?? index}>
						{product ? <ProductImage alt="" sizes="120px" src={product.imgSrc} /> : <Package size={24} />}
						{product ? <span className={c.gain}>+{money(product.profit)}</span> : null}
						{index === 1 ? <span className={c.tick}><Check size={14} /></span> : null}
					</span>
				))}
			</div>
			<span className={c.chip}><Check size={14} />Added to your store</span>
		</div>
	);
}

/** Step 3: a real reel on a phone, and what one sale pays. */
export function ReelScene({ handle, profit }: { handle: string; profit: number }) {
	const track = useRef<HTMLSpanElement>(null);
	return (
		<div className={c.scene}>
			<div className={c.stand}>
				<div className={c.reel}>
					<LoopingVideo canvasHeight={512} canvasWidth={288} onProgress={(fraction) => { if (track.current) track.current.style.transform = `scaleX(${fraction})`; }} playIcon={<span className={c.reelPlay}><Play size={14} /></span>} poster="/assets/videos/reel-cozycarry.jpg" src="/assets/videos/reel-cozycarry.mp4" />
					<span className={c.reelActions}><Heart size={14} /><Send size={14} /></span>
					<span className={c.reelFoot}>
						<span className={c.reelHandle}>@{handle}</span>
						<span className={c.reelTrack}><span ref={track} /></span>
					</span>
				</div>
				<div className={c.payout}>
					<small>Profit per sale</small>
					<strong>+{money(profit)}</strong>
				</div>
			</div>
		</div>
	);
}
