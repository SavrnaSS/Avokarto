"use client";

import { ChevronDown, ChevronRight, Download, House, Info, Mail, Menu, MessageCircle, Search, ShoppingBag, Store, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ProductImage from "@/components/seller/ProductImage";
import { money } from "@/components/seller/sellerApi";
import type { PublicStore } from "@/lib/backend/resellers";
import { AvokartoCollabCard, BrandCollab } from "./AvokartoCredit";
import { StoreLogo, whatsappChatUrl } from "./StoreShell";
import StoreSearch, { type StoreSearchItem } from "./StoreSearch";
import { useGoShop, type StoreFilterDetail } from "./storeSite";
import styles from "./storefront.module.css";

export type StoreCategory = { count: number; name: string };
export type StoreSocialLink = { href: string; Icon: LucideIcon; label: string };

type Section = "about" | "contact" | "home" | "shop";

/**
 * The store's header. Phones: menu button, logo, search and cart; the menu
 * is a slide-in panel (search, categories, contact, socials). Desktop: inline
 * nav with a categories dropdown and a header search box. On phones the
 * header tucks away while scrolling down and returns on any scroll up.
 */
export default function StoreHeader({
	basePath,
	cartCount,
	cartTotal,
	categories,
	install,
	onOpenCart,
		pauseAutoHide,
		searchIndex,
		socials,
		store,
	}: {
	basePath: string;
	cartCount: number;
	/** This store's cart subtotal, shown beside the cart on wide screens. */
	cartTotal: number;
	categories: StoreCategory[];
	install: (() => unknown) | null;
	onOpenCart: () => void;
	/** e.g. while the cart drawer is open. */
	pauseAutoHide: boolean;
	searchIndex: StoreSearchItem[];
	socials: StoreSocialLink[];
	store: PublicStore;
}) {
	const pathname = usePathname();
	const home = basePath || "/";
	const onHome = pathname === home || pathname === `${basePath}/`;
	const [menuOpen, setMenuOpen] = useState(false);
	const [shopOpen, setShopOpen] = useState(false);
	const [hidden, setHidden] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [section, setSection] = useState<Section>("home");
	const menu = useRef<HTMLDialogElement>(null);
	const menuPanel = useRef<HTMLDivElement>(null);
	const menuSearch = useRef<HTMLInputElement>(null);
	const headerSearch = useRef<HTMLInputElement>(null);
	// Phones: search drops down under the header instead of opening the menu.
	const [searchOpen, setSearchOpen] = useState(false);
	const mobileSearch = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (searchOpen) mobileSearch.current?.focus();
	}, [searchOpen]);
	const navRef = useRef<HTMLElement>(null);
	const [hovered, setHovered] = useState<HTMLElement | null>(null);
	const [indicator, setIndicator] = useState<CSSProperties>({ opacity: 0 });
	const shopMenu = useRef<HTMLDivElement>(null);

	// Open/close the menu panel as a real modal (focus trapped, Esc closes,
	// focus returns to the button).
	useEffect(() => {
		const dialog = menu.current;
		if (!dialog) return;
		if (menuOpen && !dialog.open) {
			dialog.showModal();
			menuPanel.current?.focus({ preventScroll: true });
		}
		if (!menuOpen && dialog.open) dialog.close();
	}, [menuOpen]);

	// Scroll: a shadow once the page moves; on phones, hide while reading
	// downwards and come back on any scroll up (or near the top).
	const paused = pauseAutoHide || menuOpen || searchOpen;
	useEffect(() => {
		let last = window.scrollY;
		let frame = 0;
		const update = () => {
			frame = 0;
			const y = window.scrollY;
			setScrolled(y > 8);
			if (paused || y < 120) setHidden(false);
			else if (y > last + 6) setHidden(true);
			else if (y < last - 6) setHidden(false);
			last = y;
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			if (frame) cancelAnimationFrame(frame);
		};
	}, [paused]);

	// On the store home, the nav follows the section being read.
	useEffect(() => {
		if (!onHome || typeof IntersectionObserver === "undefined") return;
		const targets = (["shop", "about", "contact"] as const)
			.map((id) => document.getElementById(id))
			.filter((element): element is HTMLElement => Boolean(element));
		const visible = new Map<string, boolean>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
				const current = (["contact", "about", "shop"] as const).find((id) => visible.get(id));
				setSection(current ?? "home");
			},
			{ rootMargin: "-40% 0px -55% 0px" },
		);
		targets.forEach((target) => observer.observe(target));
		return () => observer.disconnect();
	}, [onHome]);

	// The desktop Shop dropdown closes on Escape or a click elsewhere.
	useEffect(() => {
		if (!shopOpen) return;
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && setShopOpen(false);
		const onPointer = (event: PointerEvent) => {
			if (!shopMenu.current?.contains(event.target as Node)) setShopOpen(false);
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("pointerdown", onPointer);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("pointerdown", onPointer);
		};
	}, [shopOpen]);

	/** Show the catalog filtered: in place on the home page, otherwise navigate there. */
	const showShop = useGoShop(basePath);
	const goShop = (detail: StoreFilterDetail) => {
		setMenuOpen(false);
		setShopOpen(false);
		showShop(detail);
	};
	const onSearch = (query: string) => {
		setSearchOpen(false);
		goShop({ category: "", q: query });
	};

	// Desktop nav: one highlight that glides to the current section, and to
	// whichever link the pointer is over.
	useLayoutEffect(() => {
		const nav = navRef.current;
		if (!nav) return;
		const place = () => {
			const target = hovered ?? nav.querySelector<HTMLElement>(":scope > [aria-current], :scope > div > [aria-current]");
			if (!target || !target.offsetWidth) return setIndicator((current) => ({ ...current, opacity: 0 }));
			const box = target.getBoundingClientRect();
			const origin = nav.getBoundingClientRect();
			setIndicator({ opacity: 1, transform: `translateX(${box.left - origin.left}px)`, width: box.width });
		};
		place();
		const observer = new ResizeObserver(place);
		observer.observe(nav);
		return () => observer.disconnect();
	}, [hovered, onHome, section]);

	// "/" jumps to search on every store page (the home page's catalog search
	// handles it there): the header box on desktop, the menu on phones.
	useEffect(() => {
		if (onHome) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
			if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
			event.preventDefault();
			if (headerSearch.current?.offsetParent) headerSearch.current.focus();
			else setSearchOpen(true);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onHome]);
	const sectionLink = (id: Exclude<Section, "home">) => `${basePath}/#${id}`;
	const productTotal = categories.reduce((total, entry) => total + entry.count, 0) || searchIndex.length;
	// A photo per category for the menu's category tiles (an in-stock product first).
	const categoryImages = useMemo(() => {
		const images = new Map<string, string>();
		for (const item of [...searchIndex].sort((a, b) => Number(b.inStock) - Number(a.inStock))) {
			if (item.category && item.imageUrl && !images.has(item.category)) images.set(item.category, item.imageUrl);
		}
		return images;
	}, [searchIndex]);
	const current = (id: Section) => (onHome && section === id ? "location" : undefined);

	return (
		<>
			<header className={styles.header} data-st="header" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
				<div className={styles.container}>
					<div className={`${styles.headerInner} ${styles.headerBar}`}>
						<div className={styles.headerStart}>
							<button aria-expanded={menuOpen} aria-haspopup="dialog" aria-label="Open menu" className={styles.menuButton} onClick={() => setMenuOpen(true)} type="button">
								<Menu size={22} />
							</button>
							<button
								aria-controls="store-mobile-search"
								aria-expanded={searchOpen}
								aria-label={searchOpen ? "Close search" : "Search"}
								className={`${styles.iconButton} ${styles.searchToggle}`}
								onClick={() => setSearchOpen((open) => !open)}
								type="button"
							>
								{searchOpen ? <X size={20} /> : <Search size={20} />}
							</button>
						</div>
						<Link aria-label={`${store.name} home`} className={styles.brand} href={home}>
							<StoreLogo eager store={store} />
							<span className={styles.brandText}>
								<span className={styles.brandName}>{store.name}</span>
								<BrandCollab />
							</span>
						</Link>

						<nav
							aria-label={`${store.name} menu`}
							className={styles.nav}
							onPointerLeave={() => setHovered(null)}
							onPointerOver={(event) => {
								const link = (event.target as HTMLElement).closest<HTMLElement>(`.${styles.navLink}`);
								if (link && navRef.current?.contains(link)) setHovered(link);
							}}
							ref={navRef}
						>
							<span aria-hidden="true" className={styles.navIndicator} style={indicator} />
							<Link aria-current={onHome && section === "home" ? "page" : undefined} className={styles.navLink} href={home}>Home</Link>
							{categories.length > 1 ? (
								<div className={styles.navMenu} data-open={shopOpen || undefined} ref={shopMenu}>
									<button aria-current={current("shop")} aria-expanded={shopOpen} className={styles.navLink} onClick={() => setShopOpen((open) => !open)} type="button">
										Shop <ChevronDown aria-hidden="true" size={15} />
									</button>
									<div className={styles.navPopover}>
										<button className={styles.navPopoverAll} onClick={() => goShop({ category: "", q: "" })} type="button">
											Shop all <span>{categories.reduce((total, entry) => total + entry.count, 0)}</span>
										</button>
										{categories.slice(0, 12).map((entry) => (
											<button key={entry.name} onClick={() => goShop({ category: entry.name, q: "" })} type="button">
												{entry.name} <span>{entry.count}</span>
											</button>
										))}
									</div>
								</div>
							) : (
								<Link aria-current={current("shop")} className={styles.navLink} href={sectionLink("shop")}>Shop</Link>
							)}
							{store.about ? <Link aria-current={current("about")} className={styles.navLink} href={sectionLink("about")}>About</Link> : null}
							<Link aria-current={current("contact")} className={styles.navLink} href={sectionLink("contact")}>Contact</Link>
						</nav>

						<div className={styles.headerEnd}>
						<StoreSearch basePath={basePath} index={searchIndex} onSearch={onSearch} placeholder={`Search ${store.name}`} ref={headerSearch} variant="header" />
						<div className={styles.headerActions}>

							{install ? (
								<button aria-label={`Install the ${store.name} app`} className={`${styles.iconButton} ${styles.installButton}`} onClick={() => void install()} title="Install app" type="button">
									<Download size={20} />
								</button>
							) : null}
							<button aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}${cartCount ? `, ${money(cartTotal)}` : ""}`} className={`${styles.iconButton} ${styles.cartButton}`} onClick={onOpenCart} type="button">
								<ShoppingBag size={20} />
								{/* Re-keyed so it pops each time the count changes. */}
								{cartCount ? <span className={styles.cartCount} key={cartCount}>{cartCount}</span> : null}
								{cartCount ? <span aria-hidden="true" className={styles.cartTotal}>{money(cartTotal)}</span> : null}
							</button>
						</div>
						</div>
					</div>
					{searchOpen ? (
						<div
							className={styles.mobileSearch}
							id="store-mobile-search"
							onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)}
						>
							<StoreSearch basePath={basePath} index={searchIndex} onNavigate={() => setSearchOpen(false)} onSearch={onSearch} placeholder={`Search ${store.name}`} ref={mobileSearch} variant="header" />
							<button className={styles.textButton} onClick={() => setSearchOpen(false)} type="button">Cancel</button>
						</div>
					) : null}
				</div>
			</header>

			<dialog
				aria-label={`${store.name} menu`}
				className={styles.menuSheet}
				onClick={(event) => event.target === event.currentTarget && setMenuOpen(false)}
				onClose={() => setMenuOpen(false)}
				ref={menu}
			>
				{/* Focus starts on the panel itself (no ring on the first link); Tab moves into it. */}
				<div className={styles.menuPanel} ref={menuPanel} tabIndex={-1}>
					<div className={styles.menuHead}>
						<Link className={styles.menuBrand} href={home} onClick={() => setMenuOpen(false)}>
							<StoreLogo size={44} store={store} />
							<span className={styles.menuBrandText}>
								<span className={styles.brandName}>{store.name}</span>
								{store.tagline ? <small>{store.tagline}</small> : null}
							</span>
						</Link>
						<button aria-label="Close menu" className={styles.iconButton} onClick={() => setMenuOpen(false)} type="button"><X size={22} /></button>
					</div>
					<StoreSearch basePath={basePath} index={searchIndex} onNavigate={() => setMenuOpen(false)} onSearch={onSearch} placeholder={`Search ${store.name}`} ref={menuSearch} variant="menu" />

					<nav aria-label={`${store.name} menu`} className={styles.menuNav}>
						<Link aria-current={onHome && section === "home" ? "page" : undefined} href={home} onClick={() => setMenuOpen(false)}>
							<House aria-hidden="true" size={20} /> <span>Home</span> <ChevronRight aria-hidden="true" className={styles.menuChevron} size={18} />
						</Link>
						<button onClick={() => goShop({ category: "", q: "" })} type="button">
							<Store aria-hidden="true" size={20} />
							<span>Shop all <small className={styles.menuNavMeta}>{productTotal} {productTotal === 1 ? "product" : "products"}</small></span>
							<ChevronRight aria-hidden="true" className={styles.menuChevron} size={18} />
						</button>
						{store.about ? (
							<Link href={sectionLink("about")} onClick={() => setMenuOpen(false)}>
								<Info aria-hidden="true" size={20} /> <span>About</span> <ChevronRight aria-hidden="true" className={styles.menuChevron} size={18} />
							</Link>
						) : null}
						<Link href={sectionLink("contact")} onClick={() => setMenuOpen(false)}>
							<MessageCircle aria-hidden="true" size={20} /> <span>Contact</span> <ChevronRight aria-hidden="true" className={styles.menuChevron} size={18} />
						</Link>
					</nav>

					{categories.length > 1 ? (
						<section aria-label="Categories" className={styles.menuSection}>
							<p className={styles.menuLabel}>Shop by category</p>
							<ul className={styles.menuCategoryGrid}>
								{categories.map((entry) => (
									<li key={entry.name}>
										<button onClick={() => goShop({ category: entry.name, q: "" })} type="button">
											<span aria-hidden="true" className={styles.menuCategoryThumb}>
												{categoryImages.get(entry.name) ? <ProductImage alt="" sizes="44px" src={categoryImages.get(entry.name)!} /> : null}
											</span>
											<span className={styles.menuCategoryName}>{entry.name}</span>
											<span className={styles.menuCategoryCount}>{entry.count}</span>
										</button>
									</li>
								))}
							</ul>
						</section>
					) : null}

					<button className={styles.menuCart} onClick={() => { setMenuOpen(false); onOpenCart(); }} type="button">
						<ShoppingBag aria-hidden="true" size={20} />
						<span className={styles.menuCartText}>
							<strong>Your cart</strong>
							<small>{cartCount ? `${cartCount} ${cartCount === 1 ? "item" : "items"} · ${money(cartTotal)}` : "Nothing here yet"}</small>
						</span>
						<ChevronRight aria-hidden="true" className={styles.menuChevron} size={18} />
					</button>

					<div className={styles.menuFoot}>
						{store.whatsapp || store.contactEmail ? (
							<div className={styles.menuContact}>
								{store.whatsapp ? (
									<a className={styles.buttonWhatsapp} href={whatsappChatUrl(store.whatsapp, `Hi ${store.name}!`)} rel="noopener noreferrer" target="_blank">
										<MessageCircle size={18} /> Chat on WhatsApp
									</a>
								) : null}
								{store.contactEmail ? (
									<a className={styles.buttonGhost} href={`mailto:${store.contactEmail}`}>
										<Mail size={18} /> Email us
									</a>
								) : null}
							</div>
						) : null}
						{socials.length ? (
							<div className={styles.menuSocials}>
								{socials.map(({ href, Icon, label }) => (
									<a aria-label={label} href={href} key={label} rel="noopener noreferrer nofollow" target="_blank"><Icon size={18} /></a>
								))}
							</div>
						) : null}
						{install ? (
							<button className={styles.textButton} onClick={() => void install()} type="button"><Download size={16} /> Install the {store.name} app</button>
						) : null}
						<AvokartoCollabCard store={store} variant="menu" />
						<p className={styles.menuNote}>Secure checkout &amp; delivery by Avokarto</p>
					</div>
				</div>
			</dialog>
		</>
	);
}
