import { Globe, Package } from "lucide-react";
import { readableOn } from "@/components/stores/storeTheme";
import ProductImage from "./ProductImage";
import c from "./store-live.module.css";

/**
 * Step 2 of "How it works": the seller's store open on a laptop and a phone,
 * drawn from what is on the page: the typed name, the chosen theme and real
 * products. Decorative, so the step's text stays the accessible version.
 */
export default function StoreLiveCard({ accent, address, background, images, name }: {
	accent: string;
	address: string;
	background: string;
	images: string[];
	name: string;
}) {
	const initial = (name[0] ?? "Y").toUpperCase();
	const tiles = [0, 1, 2].map((index) => images[index] ?? null);
	const style = { "--store-accent": accent, "--store-bg": background, "--store-ink": readableOn(background), "--store-on-accent": readableOn(accent) } as React.CSSProperties;

	return (
		<div className={c.scene} style={style}>
			<div className={c.rig}>
				<div className={c.laptop}>
					<span className={c.address}><Globe size={12} /><span>{address}</span></span>
					<span className={c.shop}><span className={c.logo}>{initial}</span><strong>{name}</strong></span>
					<span className={c.tiles}>
						{tiles.map((src, index) => (
							<span className={c.tile} key={index}>{src ? <ProductImage alt="" sizes="128px" src={src} /> : <Package size={16} />}</span>
						))}
					</span>
				</div>
				<div className={c.phone}>
					<span className={c.phoneHead}><span className={c.logo}>{initial}</span></span>
					<span className={c.phoneShot}>{tiles[0] ? <ProductImage alt="" sizes="128px" src={tiles[0]} /> : <Package size={16} />}</span>
					<span className={c.buy} />
				</div>
			</div>
			<span className={c.live}><span className={c.dot} />Live and taking orders</span>
		</div>
	);
}
