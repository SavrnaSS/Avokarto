"use client";

import { Clapperboard, Film, SquarePlay } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import SellerReels from "./SellerReels";
import { sellerRequest } from "./sellerApi";
import VideoLibrary, { type SavedVideo } from "./video/VideoLibrary";
import VideoStudio, { type StudioListing } from "./video/VideoStudio";
import styles from "./seller.module.css";
import v from "./video/studio.module.css";

export type VideoView = "create" | "library" | "readymade";

type Listing = StudioListing & { isActive: boolean; purchasable: boolean };

/**
 * Studio → Videos: make promo videos of the store's products (Create),
 * keep the ones worth posting (My videos), and use Avokarto's ready-made
 * reels (Ready-made).
 */
export default function SellerVideos({
	accent,
	initialView = "create",
	onBrowse,
	onToast,
	storeLink,
	storeName,
}: {
	accent: string;
	initialView?: VideoView;
	onBrowse: () => void;
	onToast: (message: string) => void;
	storeLink: string;
	storeName: string;
}) {
	const [view, setView] = useState<VideoView>(initialView);
	const [listings, setListings] = useState<StudioListing[] | null>(null);
	const [listingsError, setListingsError] = useState<string | null>(null);
	const [videos, setVideos] = useState<SavedVideo[]>([]);
	const [videosState, setVideosState] = useState<{ error: string | null; loading: boolean }>({ error: null, loading: true });

	useEffect(() => {
		let active = true;
		sellerRequest<Listing[]>("GET", "/api/seller/listings")
			.then((rows) => {
				if (active) setListings(rows.filter((row) => row.isActive && row.purchasable));
			})
			.catch((caught: Error) => {
				if (active) setListingsError(caught.message);
			});
		return () => {
			active = false;
		};
	}, []);

	const loadVideos = useCallback(() => {
		sellerRequest<SavedVideo[]>("GET", "/api/seller/videos")
			.then((rows) => {
				setVideos(rows);
				setVideosState({ error: null, loading: false });
			})
			.catch((caught: Error) => setVideosState({ error: caught.message, loading: false }));
	}, []);
	useEffect(loadVideos, [loadVideos]);

	const views: { Icon: typeof SquarePlay; key: VideoView; label: string }[] = [
		{ Icon: SquarePlay, key: "create", label: "Create" },
		{ Icon: Film, key: "library", label: videos.length ? `My videos · ${videos.length}` : "My videos" },
		{ Icon: Clapperboard, key: "readymade", label: "Ready-made" },
	];

	return (
		<section className={styles.stack}>
			<div aria-label="Videos" className={v.views} role="tablist">
				{views.map(({ Icon, key, label }) => (
					<button aria-selected={view === key} className={v.viewTab} key={key} onClick={() => setView(key)} role="tab" type="button">
						<Icon size={16} /> {label}
					</button>
				))}
			</div>

			{view === "create" ? (
				listingsError ? (
					<p className={styles.alert} role="alert">{listingsError}</p>
				) : listings ? (
					<VideoStudio
						accent={accent}
						listings={listings}
						onBrowse={onBrowse}
						onSaved={loadVideos}
						onToast={onToast}
						storeLink={storeLink}
						storeName={storeName}
					/>
				) : (
					<div className={styles.skeleton} style={{ height: 520 }} />
				)
			) : null}
			{view === "library" ? (
				<VideoLibrary error={videosState.error} loading={videosState.loading} onChanged={loadVideos} onCreate={() => setView("create")} onToast={onToast} videos={videos} />
			) : null}
			{view === "readymade" ? <SellerReels onBrowse={onBrowse} onToast={onToast} storeLink={storeLink} storeName={storeName} /> : null}
		</section>
	);
}
