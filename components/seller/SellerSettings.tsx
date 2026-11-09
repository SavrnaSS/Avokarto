"use client";

import { ArrowRight, Brush, Check, ChevronRight, Code2, ExternalLink, Eye, Globe, KeyRound, Loader2, LogOut, Palette, Store, Undo2, UserRound, type LucideIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import SingleManagedModalLayer from "@/components/common/modals/SingleManagedModalLayer";
import PasswordEdit from "@/components/modals/PasswordEdit";
import storefront from "@/components/stores/storefront.module.css";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { storeThemeStyle } from "@/components/stores/storeTheme";
import { STORE_THEME_INFO } from "@/lib/storeThemes";
import { ModalName } from "@/types/modal";
import AccountDetails from "./AccountDetails";
import BrandingForm from "./BrandingForm";
import CustomDomainCard from "./CustomDomainCard";
import StoreCustomizer from "./StoreCustomizer";
import StoreForm from "./StoreForm";
import { storeUrl } from "./sellerApi";
import type { SellerSettings as Settings, SellerStore } from "./sellerApi";
import styles from "./seller.module.css";

const SECTIONS = [
	{ icon: Palette, id: "store-design", text: "Theme, colour & live preview", title: "Store design" },
	{ icon: Brush, id: "store-branding", text: "Logo, cover, story & socials", title: "Branding" },
	{ icon: Store, id: "store-details", text: "Name, link, WhatsApp & margin", title: "Store details" },
	{ icon: Globe, id: "store-domain", text: "Your own web address", title: "Custom domain" },
	{ icon: UserRound, id: "account", text: "Your login & sign out", title: "Account" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

/** What a finished storefront has - each missing item links to the field that fixes it. */
function setupChecklist(store: SellerStore): { done: boolean; label: string; section: SectionId }[] {
	const socials = Object.values(store.socials ?? {}).some((value) => Boolean(value?.trim()));
	return [
		{ done: Boolean(store.logoUrl), label: "Upload a logo", section: "store-branding" },
		{ done: Boolean(store.bannerUrl), label: "Add a cover banner", section: "store-branding" },
		{ done: Boolean(store.tagline.trim()), label: "Write a tagline", section: "store-details" },
		{ done: Boolean(store.about.trim()), label: "Tell your story", section: "store-branding" },
		{ done: Boolean(store.contactEmail.trim() || store.whatsapp.trim()), label: "Add a way to contact you", section: "store-details" },
		{ done: socials, label: "Link a social profile", section: "store-branding" },
	];
}

/**
 * Settings tab: every store setting on one page, with a section rail
 * (sticky sidebar on wide screens, chip row on phones) that tracks where
 * you are, and a setup score that points at what's still missing.
 */
export default function SellerSettingsPanel({
	onRefresh,
	onToast,
	settings,
	store,
}: {
	onRefresh: () => void;
	onToast: (message: string) => void;
	settings: Settings;
	store: SellerStore;
}) {
	const [active, setActive] = useState<SectionId>(SECTIONS[0].id);
	// The full-screen customizer lives in the URL (?customize=1), so it can be linked to and survives a refresh.
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const customizing = searchParams.get("customize") === "1";
	const setCustomizing = (open: boolean) => {
		const params = new URLSearchParams(searchParams.toString());
		if (open) params.set("customize", "1");
		else params.delete("customize");
		router.replace(`${pathname}?${params}`, { scroll: false });
	};
	const chips = useRef<HTMLDivElement>(null);
	const checklist = setupChecklist(store);
	const doneCount = checklist.filter((item) => item.done).length;
	const percent = Math.round((doneCount / checklist.length) * 100);
	const next = checklist.find((item) => !item.done);

	// Scroll-spy: the section nearest the top of the screen is "current".
	useEffect(() => {
		const visible = new Map<string, number>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
					else visible.delete(entry.target.id);
				}
				const first = SECTIONS.find((section) => visible.has(section.id));
				if (first) setActive(first.id);
			},
			{ rootMargin: "-140px 0px -50% 0px" },
		);
		for (const section of SECTIONS) {
			const element = document.getElementById(section.id);
			if (element) observer.observe(element);
		}
		return () => observer.disconnect();
	}, []);

	// Keep the current chip in view on the phone chip row (scrolls only the row).
	useEffect(() => {
		const row = chips.current;
		const chip = row?.querySelector<HTMLElement>('[aria-current="true"]');
		if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
		row.scrollTo({ behavior: "smooth", left: chip.offsetLeft - 12 });
	}, [active]);

	const jump = (id: SectionId) => {
		setActive(id);
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const ring = 2 * Math.PI * 20;

	return (
		<div className={styles.settingsLayout}>
			<aside className={styles.settingsAside}>
				<section aria-label="Store setup" className={styles.setupScore}>
					<div className={styles.setupScoreTop}>
						<svg aria-hidden="true" className={styles.setupRing} viewBox="0 0 48 48">
							<circle cx="24" cy="24" r="20" />
							<circle cx="24" cy="24" r="20" strokeDasharray={ring} strokeDashoffset={ring * (1 - percent / 100)} />
						</svg>
						<span className={styles.setupPercent}>{percent}%</span>
						<div style={{ minWidth: 0 }}>
							<p className={styles.setupTitle}>{percent === 100 ? "Store fully set up" : "Store setup"}</p>
							<p className={styles.hint}>{percent === 100 ? "Shoppers see a complete, trusted store." : `${checklist.length - doneCount} quick wins left`}</p>
						</div>
					</div>
					<div aria-hidden="true" className={styles.setupSegments}>
						{checklist.map((item) => <i data-done={item.done || undefined} key={item.label} />)}
					</div>
					{next ? (
						<button className={styles.setupNext} onClick={() => jump(next.section)} type="button">
							<span>
								<small>Next up</small>
								{next.label}
							</span>
							<ArrowRight aria-hidden="true" size={16} />
						</button>
					) : null}
					<details className={styles.setupDetails}>
						<summary>See all {checklist.length} steps</summary>
						<ul className={styles.setupList}>
							{checklist.map((item) => (
								<li key={item.label}>
									<button data-done={item.done || undefined} onClick={() => jump(item.section)} type="button">
										<span aria-hidden="true" className={styles.setupDot}>{item.done ? <Check size={10} strokeWidth={3} /> : null}</span>
										<span className={item.done ? styles.setupDone : undefined}>{item.label}</span>
										<span className="visually-hidden">{item.done ? " (done)" : " (to do)"}</span>
									</button>
								</li>
							))}
						</ul>
					</details>
				</section>

				<nav aria-label="Settings sections" className={styles.settingsNav} ref={chips}>
					{SECTIONS.map((section) => (
						<button
							aria-current={active === section.id ? "true" : undefined}
							className={styles.settingsNavItem}
							key={section.id}
							onClick={() => jump(section.id)}
							type="button"
						>
							<span className={styles.settingsNavIcon}><section.icon size={16} /></span>
							<span className={styles.settingsNavText}>
								<strong>{section.title}</strong>
								<small>{section.text}</small>
							</span>
						</button>
					))}
				</nav>
			</aside>

			<div className={styles.settingsBody}>
				<SettingsSection description="Theme, colours, logo, banner and content - edited on a live preview, published when you're ready." icon={Palette} id="store-design" title="Store design">
					<CustomizerLauncher onOpen={() => setCustomizing(true)} store={store} />
				</SettingsSection>
				<SettingsSection description="Make your store look like your own website - logo, cover, story and socials." icon={Brush} id="store-branding" title="Branding">
					<BrandingForm
						key={[store.logoUrl, store.bannerUrl, store.announcement, store.about, store.contactEmail, JSON.stringify(store.socials)].join("|")}
						onSaved={() => {
							onToast("Branding saved - your store is updated");
							onRefresh();
						}}
						store={store}
					/>
				</SettingsSection>
				<SettingsSection description="The basics shoppers see first, and the margin new products get." icon={Store} id="store-details" title="Store details">
					<StoreForm
						key={[store.name, store.handle, store.tagline, store.whatsapp, store.defaultMarginPercent].join("|")}
						onSaved={() => {
							onToast("Store details saved");
							onRefresh();
						}}
						settings={settings}
						store={store}
					/>
				</SettingsSection>
				<SettingsSection description="Run your store on your own web address, like shop.yourbrand.com." icon={Globe} id="store-domain" title="Custom domain">
					<CustomDomainCard
						onToast={(message) => {
							onToast(message);
							onRefresh();
						}}
					/>
				</SettingsSection>
				<SettingsSection description="Your login, security and personal details." icon={UserRound} id="account" title="Account">
					<AccountCard onToast={onToast} />
				</SettingsSection>
			</div>
			{customizing ? (
				<StoreCustomizer
					onClose={() => setCustomizing(false)}
					onPublished={() => {
						onToast("Published - your store is updated");
						onRefresh();
					}}
					store={store}
				/>
			) : null}
		</div>
	);
}

/**
 * Account: who's signed in, then one row per action - password (the shared
 * change-password modal), personal details (edited right here) and log out,
 * which returns to the homepage. Rows stack their action under the text on
 * narrow screens.
 */
function AccountCard({ onToast }: { onToast: (message: string) => void }) {
	const router = useRouter();
	const { customer, logout } = useCustomerSession();
	const [leaving, setLeaving] = useState(false);
	const [editing, setEditing] = useState(false);
	const initials = (customer?.name || customer?.email || "?").trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");

	async function signOut() {
		setLeaving(true);
		await logout();
		router.push("/");
	}

	return (
		<div className={styles.acctPanel}>
			<div className={styles.acctProfile}>
				<span aria-hidden="true" className={styles.acctAvatar}>
					{initials}
					<i className={styles.acctOnline} />
				</span>
				<div className={styles.acctText}>
					<strong>{customer?.name || "Your account"}</strong>
					<span>{customer?.email}</span>
				</div>
				<span className={styles.acctChip}><Store size={12} /> Seller</span>
			</div>

			<ul className={styles.acctRows}>
				<li className={styles.acctRow}>
					<span aria-hidden="true" className={styles.acctRowIcon}><KeyRound size={16} /></span>
					<div className={styles.acctRowText}>
						<strong>Password</strong>
						<span>Change the password you sign in with.</span>
					</div>
					<ModalTriggerButton className={styles.acctAction} openModalName={ModalName.passwordEditModal}>
						Change <ChevronRight size={15} />
					</ModalTriggerButton>
				</li>
				<li className={styles.acctRow} data-open={editing || undefined}>
					<span aria-hidden="true" className={styles.acctRowIcon}><UserRound size={16} /></span>
					<div className={styles.acctRowText}>
						<strong>Personal details</strong>
						<span>Name, email, phone and delivery addresses.</span>
					</div>
					<button aria-controls="account-details-editor" aria-expanded={editing} className={styles.acctAction} onClick={() => setEditing((open) => !open)} type="button">
						{editing ? "Close" : "Edit"} <ChevronRight className={styles.acctChevron} size={15} />
					</button>
					{editing ? (
						<div className={styles.acctEditor} id="account-details-editor">
							<AccountDetails onToast={onToast} />
						</div>
					) : null}
				</li>
				<li className={styles.acctRow} data-danger="">
					<span aria-hidden="true" className={styles.acctRowIcon}><LogOut size={16} /></span>
					<div className={styles.acctRowText}>
						<strong>Log out</strong>
						<span>Sign out of Avokarto on this device.</span>
					</div>
					<button className={styles.acctLogout} disabled={leaving} onClick={() => void signOut()} type="button">
						{leaving ? <Loader2 className={styles.spin} size={16} /> : <LogOut size={16} />}
						{leaving ? "Logging out…" : "Log out"}
					</button>
				</li>
			</ul>
			<SingleManagedModalLayer modalName={ModalName.passwordEditModal}>
				<PasswordEdit />
			</SingleManagedModalLayer>
		</div>
	);
}

/** Store design: the current look at a glance, and the way into the customizer. */
function CustomizerLauncher({ onOpen, store }: { onOpen: () => void; store: SellerStore }) {
	const theme = STORE_THEME_INFO[store.theme];
	return (
		<div className={styles.czLauncher}>
			<button aria-label="Open the customizer" className={styles.czLauncherPreview} onClick={onOpen} type="button">
				<span aria-hidden="true" className={`${storefront.themeScope} ${styles.themeMock}`} data-theme={store.theme} style={storeThemeStyle(store.accentColor)}>
					<span className={styles.mockHeader}><i /><b /></span>
					<span className={styles.mockHero}>
						<strong>Aa</strong>
						<em />
					</span>
					<span className={styles.mockGrid}><i /><i /><i /></span>
				</span>
				<span className={styles.czLauncherHover}><Eye size={16} /> Customize</span>
			</button>
			<div className={styles.czLauncherCopy}>
				<div className={styles.czLauncherMeta}>
					<span className={styles.czLauncherChip}><Palette size={13} /> {theme.label}</span>
					<span className={styles.czLauncherChip}><i style={{ background: store.accentColor }} /> {store.accentColor.toUpperCase()}</span>
				</div>
				<p className={styles.czLauncherTitle}>Design your store on a live preview</p>
				<ul className={styles.czLauncherList}>
					<li><Eye size={14} /> See every change on phone, tablet and desktop before it goes live</li>
					<li><Undo2 size={14} /> Undo, redo and an auto-saved draft - publish when you&apos;re ready</li>
					<li><Code2 size={14} /> Developer tools: JSON import/export, theme tokens, shortcuts</li>
				</ul>
				<div className={styles.czLauncherActions}>
					<button className={styles.btn} onClick={onOpen} type="button"><Palette size={16} /> Open customizer</button>
					<a className={styles.ghost} href={storeUrl(store.handle)} rel="noopener" target="_blank"><ExternalLink size={16} /> View store</a>
				</div>
			</div>
		</div>
	);
}

function SettingsSection({
	children,
	description,
	icon: Icon,
	id,
	title,
}: {
	children: ReactNode;
	description: string;
	icon: LucideIcon;
	id: SectionId;
	title: string;
}) {
	return (
		<section aria-labelledby={`${id}-title`} className={`${styles.card} ${styles.settingsSection}`} id={id}>
			<header className={styles.settingsHead}>
				<span aria-hidden="true" className={styles.settingsHeadIcon}><Icon size={18} /></span>
				<div style={{ minWidth: 0 }}>
					<h2 className={styles.cardTitle} id={`${id}-title`}>{title}</h2>
					<p className={styles.muted}>{description}</p>
				</div>
			</header>
			{children}
		</section>
	);
}
