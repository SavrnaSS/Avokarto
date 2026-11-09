/*
 * Product video renderer. Pure canvas drawing: given a scene and a time it
 * paints one frame, so the live preview and the recorder (recorder.ts)
 * produce exactly the same video. Everything is laid out in "design
 * pixels" for the output size (1080 on the short side); the caller scales
 * the context for smaller previews.
 */

export type VideoAspect = "9:16" | "1:1" | "16:9";
export type VideoTemplate = "spotlight" | "price-drop" | "collection" | "minimal";

export type VideoItem = {
	category: string;
	image: CanvasImageSource | null;
	imageSize: { height: number; width: number };
	name: string;
	oldPriceText: string | null;
	priceText: string;
};

export type VideoScene = {
	accent: string;
	aspect: VideoAspect;
	cta: string;
	durationMs: number;
	headline: string;
	items: VideoItem[];
	link: string;
	showLink: boolean;
	showPrice: boolean;
	storeName: string;
	template: VideoTemplate;
};

export const ASPECT_SIZE: Record<VideoAspect, { height: number; width: number }> = {
	"16:9": { height: 1080, width: 1920 },
	"1:1": { height: 1080, width: 1080 },
	"9:16": { height: 1920, width: 1080 },
};

const FONT = `"Inter", "SF Pro Display", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const SERIF = `Georgia, "Times New Roman", serif`;

// ---------- small helpers ----------
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
/** 0→1 progress of `u` through [start, end]. */
const span = (u: number, start: number, end: number) => clamp((u - start) / (end - start));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const backOut = (x: number) => {
	const c = 1.70158;
	return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

function hexToRgb(hex: string) {
	const value = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "3e8315";
	const number = parseInt(value, 16);
	return { b: number & 255, g: (number >> 8) & 255, r: (number >> 16) & 255 };
}
function rgba(hex: string, alpha: number) {
	const { b, g, r } = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/** Black or white, whichever reads better on `hex`. */
function onColour(hex: string) {
	const { b, g, r } = hexToRgb(hex);
	return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	const radius = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}

/** Draw `item`'s image to cover a box, zoomed and panned (Ken Burns). */
function coverImage(ctx: CanvasRenderingContext2D, item: VideoItem, x: number, y: number, w: number, h: number, zoom = 1, panX = 0, panY = 0) {
	if (!item.image) {
		ctx.fillStyle = "#e9ece4";
		ctx.fillRect(x, y, w, h);
		return;
	}
	const { height: ih, width: iw } = item.imageSize;
	const scale = Math.max(w / iw, h / ih) * zoom;
	const dw = iw * scale;
	const dh = ih * scale;
	const dx = x + (w - dw) / 2 + panX * (dw - w) * 0.5;
	const dy = y + (h - dh) / 2 + panY * (dh - h) * 0.5;
	ctx.drawImage(item.image, dx, dy, dw, dh);
}

/** Split text into at most `maxLines` lines that fit `maxWidth` (last line ellipsised). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
	const words = text.trim().split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = "";
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (ctx.measureText(next).width <= maxWidth || !line) line = next;
		else {
			lines.push(line);
			line = word;
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		const kept = lines.slice(0, maxLines);
		let last = kept[maxLines - 1];
		while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
		kept[maxLines - 1] = `${last.trimEnd()}…`;
		return kept;
	}
	return lines;
}

/** The largest font size (≤ max) at which `text` fits `maxLines` lines of `maxWidth`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number, max: number, min: number, weight = 800, family = FONT) {
	for (let size = max; size >= min; size -= 4) {
		ctx.font = `${weight} ${size}px ${family}`;
		const lines = wrap(ctx, text, maxWidth, 99);
		if (lines.length <= maxLines) return { lines, size };
	}
	ctx.font = `${weight} ${min}px ${family}`;
	return { lines: wrap(ctx, text, maxWidth, maxLines), size: min };
}

/** A rounded pill with text; returns its width. Anchored at its centre when `centre`. */
function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, bg: string, fg: string, centre = false) {
	ctx.font = `800 ${size}px ${FONT}`;
	const padX = size * 0.75;
	const w = ctx.measureText(text).width + padX * 2;
	const h = size * 1.9;
	const left = centre ? x - w / 2 : x;
	ctx.fillStyle = bg;
	roundRect(ctx, left, y, w, h, h / 2);
	ctx.fill();
	ctx.fillStyle = fg;
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";
	ctx.fillText(text, left + padX, y + h / 2 + size * 0.04);
	return w;
}

function withAlpha(ctx: CanvasRenderingContext2D, alpha: number, draw: () => void) {
	if (alpha <= 0) return;
	ctx.save();
	ctx.globalAlpha *= clamp(alpha);
	draw();
	ctx.restore();
}

/** Scale-in around a point (used for pops). */
function scaleAround(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, draw: () => void) {
	ctx.save();
	ctx.translate(cx, cy);
	ctx.scale(s, s);
	ctx.translate(-cx, -cy);
	draw();
	ctx.restore();
}

// ---------- shared end card ----------
function endCard(ctx: CanvasRenderingContext2D, scene: VideoScene, W: number, H: number, u: number, start: number) {
	const p = span(u, start, start + 0.08);
	if (p <= 0) return;
	const min = Math.min(W, H);
	// Accent wipe from the bottom.
	ctx.save();
	ctx.fillStyle = scene.template === "minimal" ? "#faf8f3" : scene.accent;
	const top = H * (1 - easeOut(p));
	ctx.fillRect(0, top, W, H - top);
	ctx.restore();
	const fg = scene.template === "minimal" ? "#1c1c1c" : onColour(scene.accent);
	const q = span(u, start + 0.05, start + 0.14);
	withAlpha(ctx, q, () => {
		ctx.textAlign = "center";
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = fg;
		const { lines, size } = fitText(ctx, scene.cta || "Shop now", W * 0.84, 2, min * 0.13, min * 0.06, 900, scene.template === "minimal" ? SERIF : FONT);
		const lineH = size * 1.05;
		const blockTop = H * 0.44 - (lines.length * lineH) / 2 + (1 - easeOut(q)) * min * 0.04;
		lines.forEach((line, index) => ctx.fillText(line, W / 2, blockTop + lineH * (index + 0.85)));
		ctx.font = `700 ${min * 0.045}px ${FONT}`;
		ctx.globalAlpha *= 0.85;
		ctx.fillText(scene.storeName, W / 2, blockTop + lineH * lines.length + min * 0.08);
	});
	const r = span(u, start + 0.1, start + 0.18);
	if (scene.showLink && scene.link) {
		withAlpha(ctx, r, () => {
			const size = min * 0.034;
			const bg = scene.template === "minimal" ? "#1c1c1c" : fg;
			const text = scene.template === "minimal" ? "#faf8f3" : scene.accent;
			scaleAround(ctx, W / 2, H * 0.64, 0.9 + 0.1 * backOut(r), () => pill(ctx, scene.link, W / 2, H * 0.62, size, bg, text, true));
		});
	}
}

/** Thin progress line - a familiar "story" cue that keeps people watching. */
function progressBar(ctx: CanvasRenderingContext2D, W: number, u: number, colour: string) {
	ctx.fillStyle = rgba("#ffffff", 0.25);
	roundRect(ctx, W * 0.06, W * 0.04, W * 0.88, 6, 3);
	ctx.fill();
	ctx.fillStyle = colour;
	roundRect(ctx, W * 0.06, W * 0.04, W * 0.88 * clamp(u), 6, 3);
	ctx.fill();
}

// ---------- templates ----------
function spotlight(ctx: CanvasRenderingContext2D, scene: VideoScene, W: number, H: number, u: number) {
	const item = scene.items[0];
	const min = Math.min(W, H);
	const landscape = W > H;
	// Square: stacked like portrait, but with a smaller card so the text fits below.
	const square = W === H;
	// Blurred, darkened backdrop of the product itself.
	ctx.save();
	if ("filter" in ctx) ctx.filter = "blur(36px) saturate(1.2)";
	coverImage(ctx, item, -60, -60, W + 120, H + 120, 1.15 + u * 0.1);
	ctx.restore();
	const shade = ctx.createLinearGradient(0, 0, 0, H);
	shade.addColorStop(0, "rgba(10,12,8,0.55)");
	shade.addColorStop(1, "rgba(10,12,8,0.85)");
	ctx.fillStyle = shade;
	ctx.fillRect(0, 0, W, H);
	const glow = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, min * 0.8);
	glow.addColorStop(0, rgba(scene.accent, 0.45));
	glow.addColorStop(1, rgba(scene.accent, 0));
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, W, H);

	// Product card: pops in, then a slow zoom.
	const cardW = landscape ? H * 0.72 : square ? W * 0.6 : W * 0.78;
	const cardH = landscape ? H * 0.72 : square ? H * 0.42 : Math.min(H * 0.48, cardW * 1.15);
	const cardX = landscape ? W * 0.08 : (W - cardW) / 2;
	const cardY = landscape ? (H - cardH) / 2 : square ? H * 0.09 : H * 0.14;
	const pop = backOut(span(u, 0, 0.1));
	scaleAround(ctx, cardX + cardW / 2, cardY + cardH / 2, 0.82 + 0.18 * pop, () => {
		withAlpha(ctx, span(u, 0, 0.06), () => {
			ctx.save();
			ctx.shadowColor = "rgba(0,0,0,0.45)";
			ctx.shadowBlur = min * 0.06;
			ctx.shadowOffsetY = min * 0.02;
			roundRect(ctx, cardX, cardY, cardW, cardH, min * 0.05);
			ctx.fillStyle = "#fff";
			ctx.fill();
			ctx.restore();
			ctx.save();
			roundRect(ctx, cardX, cardY, cardW, cardH, min * 0.05);
			ctx.clip();
			coverImage(ctx, item, cardX, cardY, cardW, cardH, 1.02 + 0.12 * easeInOut(span(u, 0.05, 0.85)), 0, -0.2);
			ctx.restore();
		});
	});

	// Text column.
	const textX = landscape ? W * 0.52 : W * 0.1;
	const textW = landscape ? W * 0.42 : W * 0.8;
	let y = landscape ? H * 0.26 : cardY + cardH + min * (square ? 0.05 : 0.08);
	const kicker = span(u, 0.08, 0.16);
	withAlpha(ctx, kicker, () => {
		pill(ctx, (item.category || "New in").toUpperCase(), textX, y - (1 - easeOut(kicker)) * 20, min * 0.03, scene.accent, onColour(scene.accent));
	});
	y += min * (square ? 0.07 : 0.1);
	ctx.fillStyle = "#fff";
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
	const { lines, size } = fitText(ctx, scene.headline || item.name, textW, landscape ? 4 : square ? 1 : 3, min * (square ? 0.075 : 0.085), min * 0.05, 900);
	lines.forEach((line, index) => {
		const lineP = span(u, 0.12 + index * 0.04, 0.24 + index * 0.04);
		withAlpha(ctx, lineP, () => {
			ctx.font = `900 ${size}px ${FONT}`;
			ctx.fillStyle = "#fff";
			ctx.fillText(line, textX, y + size * (index + 1) * 1.04 + (1 - easeOut(lineP)) * size * 0.4);
		});
	});
	y += size * lines.length * 1.04 + min * (square ? 0.04 : 0.06);
	if (scene.showPrice) {
		const priceP = span(u, 0.3, 0.38);
		withAlpha(ctx, priceP, () => {
			scaleAround(ctx, textX + min * 0.15, y + min * 0.05, 0.6 + 0.4 * backOut(priceP), () => {
				const w = pill(ctx, item.priceText, textX, y, min * 0.055, "#ffffff", "#111111");
				if (item.oldPriceText) {
					ctx.font = `700 ${min * 0.04}px ${FONT}`;
					ctx.fillStyle = "rgba(255,255,255,0.7)";
					const ox = textX + w + min * 0.03;
					const oy = y + min * 0.055 * 0.95;
					ctx.fillText(item.oldPriceText, ox, oy + min * 0.014);
					const ow = ctx.measureText(item.oldPriceText).width;
					ctx.fillRect(ox, oy, ow, Math.max(3, min * 0.004));
				}
			});
		});
	}
	progressBar(ctx, W, u / 0.78, "#ffffff");
	endCard(ctx, scene, W, H, u, 0.78);
}

function priceDrop(ctx: CanvasRenderingContext2D, scene: VideoScene, W: number, H: number, u: number) {
	const item = scene.items[0];
	const min = Math.min(W, H);
	const fg = onColour(scene.accent);
	ctx.fillStyle = scene.accent;
	ctx.fillRect(0, 0, W, H);
	// Moving diagonal stripes.
	ctx.save();
	ctx.globalAlpha = 0.12;
	ctx.fillStyle = fg;
	const stripe = min * 0.09;
	const offset = (u * stripe * 8) % (stripe * 2);
	ctx.translate(W / 2, H / 2);
	ctx.rotate(-Math.PI / 6);
	for (let x = -W * 2 + offset; x < W * 2; x += stripe * 2) ctx.fillRect(x, -H * 2, stripe, H * 4);
	ctx.restore();

	// Big shout, slammed in.
	const slam = span(u, 0, 0.1);
	const shout = item.oldPriceText ? "PRICE DROP" : "MUST HAVE";
	scaleAround(ctx, W / 2, H * 0.14, 1.6 - 0.6 * easeOut(slam), () => {
		withAlpha(ctx, slam, () => {
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = fg;
			const { size } = fitText(ctx, shout, W * 0.9, 1, min * 0.16, min * 0.08, 900);
			ctx.font = `900 ${size}px ${FONT}`;
			ctx.fillText(shout, W / 2, H * 0.14);
		});
	});

	// Product in a circle, gently rocking.
	const square = W === H;
	const r = W > H ? H * 0.3 : square ? H * 0.16 : Math.min(W * 0.36, H * 0.22);
	const cx = W > H ? W * 0.3 : W / 2;
	const cy = W > H ? H * 0.58 : square ? H * 0.42 : H * 0.42;
	const inP = backOut(span(u, 0.06, 0.18));
	scaleAround(ctx, cx, cy, inP, () => {
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(Math.sin(u * Math.PI * 4) * 0.04);
		ctx.translate(-cx, -cy);
		ctx.beginPath();
		ctx.arc(cx, cy, r + min * 0.02, 0, Math.PI * 2);
		ctx.fillStyle = fg;
		ctx.fill();
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.clip();
		coverImage(ctx, item, cx - r, cy - r, r * 2, r * 2, 1.05 + u * 0.1);
		ctx.restore();
		ctx.restore();
	});

	// Name + counting price.
	const textX = W > H ? W * 0.6 : W / 2;
	const align: CanvasTextAlign = W > H ? "left" : "center";
	const nameY = W > H ? H * 0.42 : cy + r + min * (square ? 0.09 : 0.12);
	const nameP = span(u, 0.18, 0.28);
	withAlpha(ctx, nameP, () => {
		ctx.textAlign = align;
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = fg;
		const { lines, size } = fitText(ctx, scene.headline || item.name, W > H ? W * 0.34 : W * 0.84, 2, min * 0.07, min * 0.045, 800);
		ctx.font = `800 ${size}px ${FONT}`;
		lines.forEach((line, index) => ctx.fillText(line, W > H ? W * 0.6 : W / 2, nameY + size * index * 1.1));
	});
	if (scene.showPrice) {
		const priceP = span(u, 0.3, 0.5);
		const priceY = nameY + min * (W > H ? 0.25 : square ? 0.17 : 0.22);
		withAlpha(ctx, span(u, 0.3, 0.34), () => {
			ctx.textAlign = align;
			ctx.fillStyle = fg;
			// Count up the digits of the real price.
			const numeric = parseFloat(item.priceText.replace(/[^0-9.]/g, ""));
			const shown = Number.isFinite(numeric) ? item.priceText.replace(/[0-9][0-9,.]*/, (numeric * easeOut(priceP)).toFixed(2)) : item.priceText;
			ctx.font = `900 ${min * 0.14}px ${FONT}`;
			scaleAround(ctx, textX, priceY - min * 0.05, priceP >= 1 ? 1 + 0.05 * Math.sin(u * 30) * span(u, 0.5, 0.55) : 1, () => ctx.fillText(shown, textX, priceY));
			if (item.oldPriceText) {
				ctx.font = `700 ${min * 0.05}px ${FONT}`;
				ctx.globalAlpha *= 0.75;
				const ow = ctx.measureText(item.oldPriceText).width;
				const ox = align === "center" ? textX - ow / 2 : textX;
				ctx.textAlign = "left";
				ctx.fillText(item.oldPriceText, ox, priceY + min * 0.08);
				ctx.fillRect(ox, priceY + min * 0.065, ow, Math.max(3, min * 0.005));
			}
		});
	}
	progressBar(ctx, W, u / 0.78, fg);
	endCard(ctx, scene, W, H, u, 0.78);
}

function collection(ctx: CanvasRenderingContext2D, scene: VideoScene, W: number, H: number, u: number) {
	const items = scene.items.length ? scene.items : [];
	const min = Math.min(W, H);
	const showEnd = 0.8;
	const count = Math.max(1, items.length);
	const slot = showEnd / count;
	const index = Math.min(count - 1, Math.floor(u / slot));
	const local = (u - index * slot) / slot;
	ctx.fillStyle = "#0c0e0a";
	ctx.fillRect(0, 0, W, H);
	// Current + incoming slide (push transition in the last 15% of a slot).
	const drawSlide = (i: number, shift: number) => {
		const item = items[i];
		if (!item) return;
		ctx.save();
		ctx.translate(shift * W, 0);
		coverImage(ctx, item, 0, 0, W, H, 1.04 + 0.08 * clamp(i === index ? local : 0), i % 2 ? 0.3 : -0.3, 0);
		const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
		shade.addColorStop(0, "rgba(0,0,0,0)");
		shade.addColorStop(1, "rgba(0,0,0,0.78)");
		ctx.fillStyle = shade;
		ctx.fillRect(0, 0, W, H);
		// Caption block.
		const capP = i === index ? span(local, 0.1, 0.35) : 1;
		withAlpha(ctx, capP, () => {
			const x = W * 0.07;
			const yBase = H - min * (W > H ? 0.14 : 0.2);
			pill(ctx, `${i + 1} / ${count}`, x, yBase - min * 0.26, min * 0.028, scene.accent, onColour(scene.accent));
			ctx.fillStyle = "#fff";
			ctx.textAlign = "left";
			ctx.textBaseline = "alphabetic";
			const { lines, size } = fitText(ctx, item.name, W * 0.86, 2, min * 0.075, min * 0.045, 900);
			ctx.font = `900 ${size}px ${FONT}`;
			lines.forEach((line, n) => ctx.fillText(line, x, yBase - min * 0.1 - (lines.length - 1 - n) * size * 1.05 + (1 - easeOut(capP)) * 30));
			if (scene.showPrice) pill(ctx, item.priceText, x, yBase - min * 0.04, min * 0.042, "#ffffff", "#111111");
		});
		ctx.restore();
	};
	if (u < showEnd) {
		const t = span(local, 0.85, 1);
		const ease = easeInOut(t);
		drawSlide(index, -ease);
		if (t > 0 && index + 1 < count) drawSlide(index + 1, 1 - ease);
	} else {
		drawSlide(count - 1, 0);
	}
	// Header: the store and the collection headline.
	withAlpha(ctx, span(u, 0, 0.08), () => {
		ctx.textAlign = "left";
		ctx.fillStyle = "#fff";
		ctx.font = `800 ${min * 0.04}px ${FONT}`;
		ctx.fillText(scene.headline || `${scene.storeName} picks`, W * 0.07, W * 0.04 + min * 0.1);
	});
	// Dots.
	items.forEach((_, i) => {
		ctx.fillStyle = i === index ? "#fff" : "rgba(255,255,255,0.4)";
		ctx.beginPath();
		ctx.arc(W / 2 + (i - (count - 1) / 2) * min * 0.04, H - min * 0.06, min * (i === index ? 0.011 : 0.008), 0, Math.PI * 2);
		ctx.fill();
	});
	progressBar(ctx, W, u / showEnd, "#ffffff");
	endCard(ctx, scene, W, H, u, showEnd);
}

function minimal(ctx: CanvasRenderingContext2D, scene: VideoScene, W: number, H: number, u: number) {
	const item = scene.items[0];
	const min = Math.min(W, H);
	const landscape = W > H;
	ctx.fillStyle = "#faf8f3";
	ctx.fillRect(0, 0, W, H);
	// Arch-framed image, revealed bottom-up.
	const aw = landscape ? H * 0.62 : W * 0.66;
	const square = W === H;
	const ah = landscape ? H * 0.8 : square ? H * 0.46 : Math.min(H * 0.55, aw * 1.3);
	const ax = landscape ? W * 0.1 : (W - aw) / 2;
	const ay = landscape ? (H - ah) / 2 : H * 0.1;
	const reveal = easeOut(span(u, 0, 0.16));
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(ax, ay + ah);
	ctx.lineTo(ax, ay + aw / 2);
	ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0);
	ctx.lineTo(ax + aw, ay + ah);
	ctx.closePath();
	ctx.clip();
	ctx.fillStyle = "#ece7dc";
	ctx.fillRect(ax, ay, aw, ah);
	const top = ay + ah * (1 - reveal);
	ctx.beginPath();
	ctx.rect(ax, top, aw, ah);
	ctx.clip();
	coverImage(ctx, item, ax, ay, aw, ah, 1.1 - 0.08 * easeInOut(span(u, 0, 0.8)));
	ctx.restore();
	// Thin accent line + text.
	const textX = landscape ? W * 0.56 : W / 2;
	const align: CanvasTextAlign = landscape ? "left" : "center";
	let y = landscape ? H * 0.34 : ay + ah + min * 0.09;
	const lineP = easeOut(span(u, 0.14, 0.24));
	ctx.fillStyle = scene.accent;
	const lw = min * 0.12 * lineP;
	ctx.fillRect(align === "center" ? textX - lw / 2 : textX, y, lw, Math.max(3, min * 0.004));
	y += min * 0.05;
	withAlpha(ctx, span(u, 0.16, 0.28), () => {
		ctx.textAlign = align;
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = "#6b675e";
		ctx.font = `600 ${min * 0.03}px ${FONT}`;
		ctx.fillText((item.category || scene.storeName).toUpperCase(), textX, y + min * 0.03);
	});
	y += min * 0.06;
	withAlpha(ctx, span(u, 0.2, 0.34), () => {
		ctx.textAlign = align;
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = "#1c1c1c";
		const { lines, size } = fitText(ctx, scene.headline || item.name, landscape ? W * 0.38 : W * 0.82, 3, min * 0.08, min * 0.05, 500, SERIF);
		ctx.font = `500 ${size}px ${SERIF}`;
		lines.forEach((line, index) => ctx.fillText(line, textX, y + size * (index + 1) * 1.08));
		y += size * lines.length * 1.08;
	});
	if (scene.showPrice) {
		withAlpha(ctx, span(u, 0.34, 0.44), () => {
			ctx.textAlign = align;
			ctx.fillStyle = "#1c1c1c";
			ctx.font = `700 ${min * 0.05}px ${FONT}`;
			ctx.fillText(item.priceText, textX, landscape ? H * 0.72 : y + min * (square ? 0.09 : 0.27));
		});
	}
	endCard(ctx, scene, W, H, u, 0.8);
}

/** Paint the frame at `timeMs` (clamped to the video). */
export function drawFrame(ctx: CanvasRenderingContext2D, scene: VideoScene, timeMs: number) {
	const { height: H, width: W } = ASPECT_SIZE[scene.aspect];
	const u = clamp(timeMs / scene.durationMs);
	ctx.save();
	ctx.clearRect(0, 0, W, H);
	if (!scene.items.length) {
		ctx.fillStyle = "#eef1ea";
		ctx.fillRect(0, 0, W, H);
	} else if (scene.template === "price-drop") priceDrop(ctx, scene, W, H, u);
	else if (scene.template === "collection") collection(ctx, scene, W, H, u);
	else if (scene.template === "minimal") minimal(ctx, scene, W, H, u);
	else spotlight(ctx, scene, W, H, u);
	ctx.restore();
}
