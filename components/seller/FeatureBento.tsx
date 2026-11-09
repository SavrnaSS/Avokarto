"use client";

import { BadgeCheck, Check, CheckCheck, Globe, Landmark, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { readableOn } from "@/components/stores/storeTheme";
import { STORE_FONT_INFO, STORE_FONTS, type StoreFont } from "@/lib/storeFonts";
import { STORE_THEME_INFO, STORE_THEMES, type StoreTheme } from "@/lib/storeThemes";
import ProductImage from "./ProductImage";
import { money } from "./sellerApi";
import b from "./feature-cards.module.css";

type LookProduct = { id: string | number; imgSrc: string; salePrice: number };
type Spotlight = { imgSrc?: string; profit: number; salePrice: number; title: string };

/**
 * "Everything included": each card shows its feature working, built from what
 * the page already knows: the typed name, the chosen theme and a real product.
 * The previews are illustrations, so the card text stays the accessible version.
 */
export default function FeatureBento({ address, domain, looks, product, storeName, theme }: {
	address: string;
	domain: string;
	looks: LookProduct[];
	product: Spotlight;
	storeName: string;
	theme: StoreTheme;
}) {
	const flow = useRef<HTMLOListElement>(null);
	const [seen, setSeen] = useState(false);
	const [card, setCard] = useState(0);

	// Phones swipe through the cards; the dots follow whichever one is in view.
	const showPosition = ({ currentTarget: row }: React.UIEvent<HTMLDivElement>) => {
		const cards = [...row.children] as HTMLElement[];
		const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
		setCard(atEnd ? cards.length - 1 : cards.reduce((nearest, item, index) => (Math.abs(item.offsetLeft - row.offsetLeft - row.scrollLeft) < Math.abs(cards[nearest].offsetLeft - row.offsetLeft - row.scrollLeft) ? index : nearest), 0));
	};

	useEffect(() => {
		const element = flow.current;
		if (!element) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			setSeen(true);
			observer.disconnect();
		}, { threshold: 0.6 });
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const steps = [["You sell", money(product.salePrice)], ["We pack", "Avokarto"], ["We ship", "Avokarto"], ["You earn", `+${money(product.profit)}`]];

	return (
		<div className={b.wrap}>
			<div className={b.grid} onScroll={showPosition}>
				<article className={b.card} data-dark="" data-wide="">
					<div className={b.preview}>
						<ol aria-label="How an order flows" className={b.flow} data-seen={seen ? "" : undefined} ref={flow}>
							<span aria-hidden="true" className={b.flowTrack}><span /></span>
							{steps.map(([label, value], index) => (
								<li key={label} style={{ "--step": index } as React.CSSProperties}>
									<span aria-hidden="true" className={b.flowNode}><Check size={14} strokeWidth={2.5} /></span>
									<strong>{label}</strong>
									<small aria-hidden="true">{value}</small>
								</li>
							))}
						</ol>
					</div>
					<Copy text="We hold the stock, pack every order and deliver it. No warehouse, no courier accounts, no returns to handle." title="Hands-off fulfilment" />
				</article>

				<article className={b.card}>
					<LookCarousel name={storeName} products={looks} theme={theme} />
					<Copy
						text="Create a store that reflects your brand. Customise fonts and colours, then add your logo and banner."
						title={STORE_THEMES.length * STORE_FONTS.length >= 51 ? "51+ storefront styles" : `${STORE_THEMES.length} storefront themes`}
					/>
				</article>

				<article className={b.card}>
					<div aria-hidden="true" className={b.preview}>
						<div className={b.domains}>
							<span className={b.oldAddress}><Globe size={14} /><span>{address}</span></span>
							<span className={b.newAddress}><Lock size={14} /><span>{domain}</span><BadgeCheck size={16} /></span>
						</div>
					</div>
					<Copy text="On Pro, connect yourbrand.com so customers shop on your address." title="Your own domain" />
				</article>

				<article className={b.card}>
					<div aria-hidden="true" className={b.preview}>
						<div className={b.bubble}>
							{product.imgSrc ? <span className={b.bubblePhoto}><ProductImage alt="" fit="contain" sizes="64px" src={product.imgSrc} /></span> : null}
							<span className={b.bubbleText}>
								<strong>{product.title}</strong>
								<small>{money(product.salePrice)}</small>
								<em>{address}</em>
							</span>
							<CheckCheck className={b.bubbleTick} size={14} />
						</div>
					</div>
					<Copy text="One-tap sharing for your store and every product." title="WhatsApp-ready" />
				</article>

				<article className={b.card}>
					<div aria-hidden="true" className={b.preview}>
						<div className={b.chart}>
							<span className={b.legend}><span><i data-series="visits" />Visits</span><span><i data-series="orders" />Orders</span><b><i className={b.liveDot} />Live</b></span>
							<svg preserveAspectRatio="none" viewBox="0 0 200 64">
								<path d="M0 50 C 24 46 34 30 56 34 S 92 48 116 28 S 164 18 200 6" data-series="visits" />
								<path d="M0 60 C 30 58 44 50 70 52 S 120 54 142 42 S 180 36 200 30" data-series="orders" />
							</svg>
						</div>
					</div>
					<Copy text="Visits, traffic sources and orders as they happen." title="Live analytics" />
				</article>

				<article className={b.card} data-wide="">
					<div aria-hidden="true" className={b.preview}>
						<div className={b.payout}>
							<span className={b.bank}><Landmark size={20} /></span>
							<span className={b.payoutText}>
								<strong>Sent to your bank</strong>
								<small><Check size={14} strokeWidth={2.5} />Transfer reference included</small>
							</span>
							<b>+{money(product.profit)}</b>
						</div>
					</div>
					<Copy text="Withdraw from your dashboard straight to your bank account, with a transfer reference for every payment." title="Payouts direct to your bank" />
				</article>
			</div>
			<span aria-hidden="true" className={b.dots}>{[0, 1, 2, 3, 4, 5].map((index) => <i data-active={index === card ? "" : undefined} key={index} />)}</span>
		</div>
	);
}

const SERIF_FONTS: readonly StoreFont[] = ["editorial", "boutique", "classic"];

/**
 * Small storefronts turning past on a stage: a real theme, a real product and a
 * font style each, so the card shows the mixing it describes. It moves only on
 * screen, pauses under the pointer, and a tap moves it on. With reduced motion it
 * rests on the seller's chosen theme until tapped.
 */
function LookCarousel({ name, products, theme }: { name: string; products: LookProduct[]; theme: StoreTheme }) {
	const stage = useRef<HTMLDivElement>(null);
	const [step, setStep] = useState(0);
	const [paused, setPaused] = useState(false);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const element = stage.current;
		if (!element) return;
		const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!visible || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const timer = window.setInterval(() => setStep((current) => current + 1), 2400);
		return () => window.clearInterval(timer);
	}, [paused, visible]);

	const count = STORE_THEMES.length;
	const active = (STORE_THEMES.indexOf(theme) + step) % count;
	const fontKey = STORE_FONTS[step % STORE_FONTS.length];

	return (
		<div
			aria-hidden="true"
			className={b.preview}
			data-stage=""
			onClick={() => setStep((current) => current + 1)}
			onPointerEnter={(event) => { if (event.pointerType === "mouse") setPaused(true); }}
			onPointerLeave={() => setPaused(false)}
			ref={stage}
		>
			<div className={b.looks}>
				{STORE_THEMES.map((key, index) => {
					const offset = ((index - active + count + count / 2) % count) - count / 2;
					const away = Math.abs(offset);
					const info = STORE_THEME_INFO[key];
					const product = products.length ? products[index % products.length] : null;
					return (
						<span
							className={b.look}
							data-active={offset === 0 ? "" : undefined}
							data-far={away === 2 ? "" : undefined}
							data-font={offset === 0 ? (fontKey === "loud" ? "loud" : SERIF_FONTS.includes(fontKey) ? "serif" : "sans") : undefined}
							data-hidden={away > 2 ? "" : undefined}
							key={key}
							style={{ "--away": away, "--offset": offset, "--tile-accent": info.accents[0], "--tile-bg": info.background, "--tile-ink": readableOn(info.background), "--tile-on-accent": readableOn(info.accents[0]) } as React.CSSProperties}
						>
							<span className={b.lookTop}><i>{(name[0] ?? "Y").toUpperCase()}</i><strong>{name}</strong></span>
							<span className={b.lookPhoto}>{product ? <ProductImage alt="" fit="contain" sizes="128px" src={product.imgSrc} /> : null}</span>
							<span className={b.lookBuy}>{product ? money(product.salePrice) : null}</span>
						</span>
					);
				})}
			</div>
			<div className={b.lookBar}>
				<span className={b.lookName}>{STORE_THEME_INFO[STORE_THEMES[active]].label} · {STORE_FONT_INFO[fontKey].label}</span>
				<span className={b.lookTicks}>{STORE_THEMES.map((key, index) => <i data-active={index === active ? "" : undefined} key={key} />)}</span>
			</div>
		</div>
	);
}

function Copy({ text, title }: { text: string; title: string }) {
	return (
		<div className={b.copy}>
			<p className={b.title}>{title}</p>
			<p className={b.text}>{text}</p>
		</div>
	);
}
