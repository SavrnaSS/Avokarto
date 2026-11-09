"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import ProductImage from "@/components/seller/ProductImage";
import styles from "./storefront.module.css";

/**
 * How a theme lays out product media on larger screens (like Shopify's
 * "media layout" setting). Phones always get a swipeable carousel.
 *   thumbs  one large image with a thumbnail strip   (elegant, noir, …)
 *   grid    every image in a two-column grid           (bold)
 *   stack   every image full width, info stays pinned  (minimal)
 */
export type GalleryLayout = "grid" | "stack" | "thumbs";

export function galleryLayoutFor(theme: string): GalleryLayout {
	if (theme === "bold" || theme === "street") return "grid";
	if (theme === "minimal" || theme === "editorial") return "stack";
	return "thumbs";
}

function scrollTrackTo(track: HTMLElement | null, index: number, smooth = true) {
	if (!track) return;
	track.scrollTo({ behavior: smooth ? "smooth" : "auto", left: index * track.clientWidth });
}

export default function ProductGallery({ images: allImages, layout, name }: { images: string[]; layout: GalleryLayout; name: string }) {
	const track = useRef<HTMLDivElement>(null);
	const thumbs = useRef<HTMLDivElement>(null);
	const dialog = useRef<HTMLDialogElement>(null);
	const lightboxTrack = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState(0);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	// An image that fails to load (deleted upload, bad URL) drops out of the
	// gallery instead of showing a broken picture - the first always stays.
	const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
	const images = useMemo(() => {
		const working = allImages.filter((src, index) => index === 0 || !failed.has(src));
		return working.length ? working : allImages.slice(0, 1);
	}, [allImages, failed]);
	const markFailed = (src: string) => setFailed((current) => (current.has(src) ? current : new Set(current).add(src)));
	// The frame takes the main photo's shape (3:4 portrait … 4:3 landscape),
	// so a portrait product fills it instead of sitting between white bars.
	const [ratio, setRatio] = useState<number | null>(null);
	const readRatio = (image: HTMLImageElement) => {
		if (!image.naturalWidth || !image.naturalHeight) return;
		setRatio(Math.min(4 / 3, Math.max(3 / 4, image.naturalWidth / image.naturalHeight)));
	};
	const count = images.length;

	// Keep the active thumbnail in view in the strip (scrolls only the strip).
	useEffect(() => {
		const strip = thumbs.current;
		const thumb = strip?.children[active] as HTMLElement | undefined;
		if (!strip || !thumb) return;
		const vertical = strip.scrollHeight > strip.clientHeight + 1 && strip.scrollWidth <= strip.clientWidth + 1;
		if (vertical) strip.scrollTo({ behavior: "smooth", top: thumb.offsetTop - (strip.clientHeight - thumb.offsetHeight) / 2 });
		else strip.scrollTo({ behavior: "smooth", left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2 });
	}, [active]);

	// Which slide is showing, from the carousel's scroll position.
	const onScroll = useCallback(() => {
		const element = track.current;
		if (!element || !element.clientWidth) return;
		setActive(Math.min(count - 1, Math.round(element.scrollLeft / element.clientWidth)));
	}, [count]);

	const go = (index: number) => {
		const next = (index + count) % count;
		setActive(next);
		scrollTrackTo(track.current, next);
	};

	// Arrow keys move through the photos when the gallery has focus.
	const onGalleryKey = (event: ReactKeyboardEvent) => {
		if (count < 2 || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
		event.preventDefault();
		go(active + (event.key === "ArrowRight" ? 1 : -1));
	};

	const openLightbox = (index: number) => {
		setLightboxIndex(index);
		dialog.current?.showModal();
		// After the dialog lays out, jump straight to the tapped image.
		requestAnimationFrame(() => scrollTrackTo(lightboxTrack.current, index, false));
	};

	const lightboxGo = useCallback(
		(index: number) => {
			const next = (index + count) % count;
			setLightboxIndex(next);
			scrollTrackTo(lightboxTrack.current, next);
		},
		[count],
	);

	useEffect(() => {
		const element = dialog.current;
		if (!element) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "ArrowRight") lightboxGo(lightboxIndex + 1);
			if (event.key === "ArrowLeft") lightboxGo(lightboxIndex - 1);
		};
		element.addEventListener("keydown", onKey);
		return () => element.removeEventListener("keydown", onKey);
	}, [lightboxGo, lightboxIndex]);

	// Desktop hover zoom: the image follows the pointer.
	const onZoomMove = (event: MouseEvent<HTMLButtonElement>) => {
		const box = event.currentTarget.getBoundingClientRect();
		event.currentTarget.style.setProperty("--zx", `${((event.clientX - box.left) / box.width) * 100}%`);
		event.currentTarget.style.setProperty("--zy", `${((event.clientY - box.top) / box.height) * 100}%`);
	};

	return (
		<div className={styles.gallery} data-layout={layout} style={ratio ? ({ "--media-ratio": ratio.toFixed(4) } as React.CSSProperties) : undefined}>
			<div className={styles.mediaWrap}>
				<div aria-label={`${name} images`} aria-roledescription="carousel" className={styles.media} onKeyDown={onGalleryKey} onScroll={onScroll} ref={track} role="region">
					{images.map((src, index) => (
						<button
							aria-label={`View image ${index + 1} of ${count} full screen`}
							className={styles.slide}
							key={`${src}-${index}`}
							onClick={() => openLightbox(index)}
							onMouseMove={onZoomMove}
							type="button"
						>
							{/* Any space the photo doesn't fill shows a soft blur of itself (a tiny copy). */}
							<span aria-hidden="true" className={styles.slideBackdrop}>
								<ProductImage alt="" sizes="96px" src={src} />
							</span>
							<ProductImage
								alt={index === 0 ? name : ""}
								fit="contain"
								onError={() => markFailed(src)}
								onLoad={index === 0 ? readRatio : undefined}
								priority={index === 0}
								sizes={layout === "grid" && index > 0 ? "(min-width: 900px) 330px, 100vw" : "(min-width: 900px) 680px, 100vw"}
								src={src}
							/>
						</button>
					))}
				</div>
				{count > 1 ? (
					<>
						<button aria-label="Previous image" className={`${styles.mediaArrow} ${styles.mediaPrev}`} onClick={() => go(active - 1)} type="button">
							<ChevronLeft size={20} />
						</button>
						<button aria-label="Next image" className={`${styles.mediaArrow} ${styles.mediaNext}`} onClick={() => go(active + 1)} type="button">
							<ChevronRight size={20} />
						</button>
						<span aria-hidden="true" className={styles.mediaCounter}>{active + 1} / {count}</span>
					</>
				) : null}
				<span aria-hidden="true" className={styles.mediaExpand}><Expand size={16} /></span>
			</div>

			{count > 1 ? (
				<div aria-label="Choose image" className={styles.thumbs} ref={thumbs} role="group">
					{images.map((src, index) => (
						<button aria-label={`Show image ${index + 1}`} aria-pressed={active === index} key={`${src}-${index}`} onClick={() => go(index)} type="button">
							<ProductImage alt="" sizes="72px" src={src} />
						</button>
					))}
				</div>
			) : null}

			<dialog
				aria-label={`${name} images`}
				className={styles.lightbox}
				onClick={(event) => {
					if (event.target === event.currentTarget) dialog.current?.close();
				}}
				ref={dialog}
			>
				<div
					className={styles.lightboxTrack}
					onScroll={(event) => {
						const element = event.currentTarget;
						if (element.clientWidth) setLightboxIndex(Math.round(element.scrollLeft / element.clientWidth));
					}}
					ref={lightboxTrack}
				>
					{images.map((src, index) => (
						<div className={styles.lightboxSlide} key={`${src}-${index}`}>
							<ProductImage alt={`${name} - image ${index + 1}`} fit="contain" sizes="100vw" src={src} />
						</div>
					))}
				</div>
				<button aria-label="Close" autoFocus className={styles.lightboxClose} onClick={() => dialog.current?.close()} type="button">
					<X size={22} />
				</button>
				{count > 1 ? (
					<>
						<button aria-label="Previous image" className={`${styles.lightboxArrow} ${styles.mediaPrev}`} onClick={() => lightboxGo(lightboxIndex - 1)} type="button">
							<ChevronLeft size={24} />
						</button>
						<button aria-label="Next image" className={`${styles.lightboxArrow} ${styles.mediaNext}`} onClick={() => lightboxGo(lightboxIndex + 1)} type="button">
							<ChevronRight size={24} />
						</button>
						<span className={styles.lightboxCounter}>{lightboxIndex + 1} / {count}</span>
					</>
				) : null}
			</dialog>
		</div>
	);
}
