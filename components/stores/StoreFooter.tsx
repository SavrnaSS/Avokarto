"use client";

import { ArrowUp, ChevronDown, CreditCard, Download, Mail, MessageCircle, RotateCcw, Share2, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { shareLink } from "@/components/seller/sellerApi";
import type { PublicStore } from "@/lib/backend/resellers";
import type { StoreCategory, StoreSocialLink } from "./StoreHeader";
import { AvokartoCollabCard, avokartoHref } from "./AvokartoCredit";
import { StoreLogo, whatsappChatUrl } from "./StoreShell";
import { useGoShop } from "./storeSite";
import styles from "./storefront.module.css";

export const PAYMENT_METHODS = ["Card", "PayPal", "Google Pay", "Cash on delivery"];

/**
 * A link group: a tap-to-expand section on phones (keeps the footer short),
 * always open as a plain column from tablets up. The button only matters on
 * phones - from 768px the CSS shows the list regardless.
 */
function FooterGroup({ children, title }: { children: ReactNode; title: string }) {
	const id = useId();
	const [open, setOpen] = useState(false);
	return (
		<section className={styles.footerGroup} data-open={open || undefined}>
			<h3 className={styles.footerHeading}>
				<button aria-controls={id} aria-expanded={open} className={styles.footerToggle} onClick={() => setOpen((value) => !value)} type="button">
					{title}
					<ChevronDown aria-hidden="true" size={18} />
				</button>
			</h3>
			<div className={styles.footerGroupBody} id={id}>{children}</div>
		</section>
	);
}

/** The store's own footer: brand, shop + help links, contact, trust and payment badges. */
export default function StoreFooter({
	basePath,
	categories,
	install,
	onOpenCart,
	socials,
	store,
}: {
	basePath: string;
	categories: StoreCategory[];
	install: (() => unknown) | null;
	onOpenCart: () => void;
	socials: StoreSocialLink[];
	store: PublicStore;
}) {
	const goShop = useGoShop(basePath);
	const home = basePath || "/";
	const [shared, setShared] = useState(false);
	const share = async () => {
		const result = await shareLink({ text: `Shop ${store.name}`, title: store.name, url: `${window.location.origin}${home}` });
		if (result === "copied") {
			setShared(true);
			window.setTimeout(() => setShared(false), 2000);
		}
	};

	return (
		<footer className={styles.footer} data-st="footer" id="contact">
			<div className={styles.container}>
				<div className={styles.footerTop}>
					<section className={styles.footerBrand}>
						<Link className={styles.brand} href={home}>
							<StoreLogo store={store} />
							<span className={styles.brandName}>{store.name}</span>
						</Link>
						{store.tagline || store.about ? <p className={styles.footerAbout}>{store.tagline || store.about}</p> : null}
						{socials.length ? (
							<div className={styles.socials}>
								{socials.map(({ href, Icon, label }) => (
									<a aria-label={label} href={href} key={label} rel="noopener noreferrer nofollow" target="_blank">
										<Icon size={18} />
									</a>
								))}
							</div>
						) : null}
						<div className={styles.footerActions}>
							<button className={styles.footerPill} onClick={() => void share()} type="button">
								<Share2 size={15} /> {shared ? "Link copied" : "Share this store"}
							</button>
							{install ? (
								<button className={styles.footerPill} onClick={() => void install()} type="button">
									<Download size={15} /> Install app
								</button>
							) : null}
						</div>
					</section>

					<FooterGroup title="Shop">
						<ul className={styles.footerLinks}>
							<li><button onClick={() => goShop({ category: "", q: "" })} type="button">Shop all</button></li>
							{categories.slice(0, 6).map((entry) => (
								<li key={entry.name}>
									<button onClick={() => goShop({ category: entry.name, q: "" })} type="button">
										{entry.name} <span className={styles.footerCount}>{entry.count}</span>
									</button>
								</li>
							))}
							{store.about ? <li><Link href={`${basePath}/#about`}>About us</Link></li> : null}
						</ul>
					</FooterGroup>

					<FooterGroup title="Help">
						<ul className={styles.footerLinks}>
							<li><button onClick={onOpenCart} type="button"><ShoppingBag size={14} /> Your cart</button></li>
							<li><a href="/return-policy" rel="noopener" target="_blank">Returns &amp; refunds</a></li>
							<li><a href="/terms-policy" rel="noopener" target="_blank">Terms of service</a></li>
							<li><a href="/privacy-policy" rel="noopener" target="_blank">Privacy policy</a></li>
						</ul>
					</FooterGroup>

					<section className={styles.footerContact}>
						<h3 className={styles.footerHeading}>Get in touch</h3>
						<div className={styles.footerContactButtons}>
							{store.whatsapp ? (
								<a className={styles.footerPill} href={whatsappChatUrl(store.whatsapp, `Hi ${store.name}!`)} rel="noopener noreferrer" target="_blank">
									<MessageCircle size={15} /> WhatsApp
								</a>
							) : null}
							{store.contactEmail ? (
								<a className={styles.footerPill} href={`mailto:${store.contactEmail}`}>
									<Mail size={15} /> {store.contactEmail}
								</a>
							) : null}
						</div>
						<p className={styles.footerNote}>Orders are packed, shipped and tracked by Avokarto - questions about delivery are answered there too.</p>
					</section>
				</div>

				<AvokartoCollabCard store={store} variant="footer" />

				<ul aria-label="Why shop here" className={styles.footerTrust}>
					<li><ShieldCheck size={16} /> Secure checkout</li>
					<li><Truck size={16} /> Tracked delivery</li>
					<li><RotateCcw size={16} /> Easy returns</li>
					<li className={styles.footerPayments}>
						<CreditCard size={16} />
						<span className="visually-hidden">We accept:</span>
						{PAYMENT_METHODS.map((method) => <span className={styles.payBadge} key={method}>{method}</span>)}
					</li>
				</ul>

				<div className={styles.footerBottom}>
					<span>© {new Date().getFullYear()} {store.name}</span>
					<span className={styles.footerCredit}>
						Secure checkout &amp; delivery by <a href={avokartoHref()} rel="noopener" target="_blank">Avokarto</a> · <a href={avokartoHref("/")} rel="noopener" target="_blank">Open your own store</a>
					</span>
					<button className={styles.backToTop} onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })} type="button">
						Back to top <ArrowUp size={14} />
					</button>
				</div>
			</div>
		</footer>
	);
}
