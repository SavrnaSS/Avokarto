import Image from "next/image";

/**
 * Catalog images through Next's optimizer (resized AVIF/WebP instead of
 * multi-megabyte uploads). Images on other hosts aren't in next.config's
 * allow-list, so they're shown as-is rather than failing.
 */
export default function ProductImage({
	alt,
	priority = false,
	sizes,
	src,
	fit = "cover",
	onError,
	onLoad,
}: {
	alt: string;
	fit?: "contain" | "cover";
	/** Called when the image can't load (deleted upload, bad URL). */
	onError?: () => void;
	/** Called with the loaded <img> (e.g. to read its natural size). */
	onLoad?: (image: HTMLImageElement) => void;
	priority?: boolean;
	sizes: string;
	src: string;
}) {
	const external = /^https?:\/\//i.test(src);
	return (
		<Image
			alt={alt}
			fill
			onError={onError}
			onLoad={onLoad ? (event) => onLoad(event.currentTarget) : undefined}
			// Next 16 deprecates `priority`; above-the-fold images load eagerly
			// at high fetch priority instead (what the LCP check asks for).
			fetchPriority={priority ? "high" : undefined}
			loading={priority ? "eager" : undefined}
			sizes={sizes}
			src={src}
			style={{ objectFit: fit }}
			unoptimized={external}
		/>
	);
}
