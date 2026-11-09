import { baseURL } from "@/admin/utils/cn";

export type Status = "active" | "archived" | "draft" | "published" | "review";

export type Category = {
	count: number;
	id: string;
	image: string;
	name: string;
	slug: string;
	sortOrder: number;
	status: Extract<Status, "draft" | "published">;
};

export type Brand = {
	count: number;
	initials: string;
	name: string;
	slug: string;
	status: Extract<Status, "archived" | "draft" | "published">;
	tileClass: string;
	visibility: "Featured" | "Hidden" | "Standard";
	website: string;
};

export type Attribute = {
	name: string;
	products: number;
	status: Extract<Status, "active" | "draft">;
	type: "Dropdown" | "Swatch" | "Text";
	values: string[];
};

export type Customer = {
	avatarClass: string;
	email: string;
	ltv: string;
	name: string;
	orders: number;
	segment: string;
	status: Extract<Status, "active" | "review">;
};

export const categories: Category[] = [
	["Headphones", "headphones", 42, "published", "cat-bg-headphones-01.webp"],
	[
		"Charging Cable",
		"charging-cable",
		28,
		"published",
		"cat-transp-img-01.webp",
	],
	["Power Adapter", "power-adapter", 19, "published", "cat-transp-img-02.webp"],
	["Power Bank", "power-bank", 31, "published", "cat-transp-img-03.webp"],
	[
		"Bluetooth Speaker",
		"bluetooth-speaker",
		24,
		"published",
		"cat-bg-headphones-02.webp",
	],
	["Mini Speaker", "mini-speaker", 12, "draft", "cat-bg-headphones-03.webp"],
	["Smart Watch", "smart-watch", 37, "published", "cat-transp-img-08.webp"],
	["Smart TV", "smart-tv", 9, "draft", "cat-transp-img-09.webp"],
	[
		"Wireless Headphones",
		"wireless-headphones",
		44,
		"published",
		"cat-transp-img-10.webp",
	],
	[
		"Portable Speaker",
		"portable-speaker",
		18,
		"published",
		"cat-bg-headphones-04.webp",
	],
	["Microphone", "microphone", 15, "draft", "cat-bg-headphones-05.webp"],
	[
		"Over-Ear Headphones",
		"over-ear-headphones",
		26,
		"published",
		"cat-transp-img-06.webp",
	],
	["Camera", "camera", 33, "published", "cat-transp-img-07.webp"],
	["Tablet", "tablet", 21, "published", "cat-transp-img-11.webp"],
	["Gaming Mouse", "gaming-mouse", 17, "draft", "cat-transp-img-12.webp"],
].map(([name, slug, count, status, file]) => ({
	count: Number(count),
	id: String(slug),
	image: `${baseURL}assets/images/catagory-img/${file}`,
	name: String(name),
	slug: String(slug),
	sortOrder: 100,
	status: status as Category["status"],
}));

export const brands: Brand[] = [
	[
		"AA",
		"Acme Audio",
		"acmeaudio.com",
		"acme-audio",
		42,
		"Featured",
		"published",
		"bg-brand-50 text-brand-600",
	],
	[
		"FF",
		"FreshFarm",
		"freshfarm.co",
		"freshfarm",
		28,
		"Featured",
		"published",
		"bg-success-50 text-success-600",
	],
	[
		"UW",
		"UrbanWear",
		"urbanwear.shop",
		"urbanwear",
		35,
		"Standard",
		"published",
		"bg-accent-50 text-accent-700",
	],
	[
		"HH",
		"HomeHaven",
		"homehaven.store",
		"homehaven",
		21,
		"Standard",
		"published",
		"bg-warning-50 text-warning-600",
	],
	[
		"GC",
		"GlowCare",
		"glowcare.com",
		"glowcare",
		18,
		"Featured",
		"draft",
		"bg-danger-50 text-danger-500",
	],
	[
		"TN",
		"TechNova",
		"technova.dev",
		"technova",
		56,
		"Featured",
		"published",
		"bg-surface-muted text-ink-600",
	],
	[
		"FT",
		"FitFuel",
		"fitfuel.life",
		"fitfuel",
		16,
		"Standard",
		"draft",
		"bg-brand-100 text-brand-700",
	],
	[
		"PN",
		"PetNest",
		"petnest.shop",
		"petnest",
		12,
		"Standard",
		"published",
		"bg-success-100 text-success-700",
	],
	[
		"PD",
		"PureDairy",
		"puredairy.co",
		"puredairy",
		24,
		"Hidden",
		"archived",
		"bg-warning-100 text-warning-600",
	],
	[
		"DB",
		"DailyBake",
		"dailybake.store",
		"dailybake",
		31,
		"Standard",
		"published",
		"bg-accent-100 text-accent-700",
	],
	[
		"GL",
		"GreenLeaf",
		"greenleaf.market",
		"greenleaf",
		27,
		"Featured",
		"published",
		"bg-success-50 text-success-600",
	],
	[
		"NK",
		"NovaKids",
		"novakids.shop",
		"novakids",
		14,
		"Standard",
		"draft",
		"bg-brand-50 text-brand-600",
	],
].map(
	([initials, name, website, slug, count, visibility, status, tileClass]) => ({
		count: Number(count),
		initials: String(initials),
		name: String(name),
		slug: String(slug),
		status: status as Brand["status"],
		tileClass: String(tileClass),
		visibility: visibility as Brand["visibility"],
		website: String(website),
	}),
);

export const attributes: Attribute[] = [
	{
		name: "Color",
		products: 128,
		status: "active",
		type: "Swatch",
		values: ["Red", "Blue", "Green", "Black"],
	},
	{
		name: "Size",
		products: 96,
		status: "active",
		type: "Dropdown",
		values: ["XS", "S", "M", "L", "XL"],
	},
	{
		name: "Material",
		products: 44,
		status: "draft",
		type: "Text",
		values: ["Cotton", "Steel", "Wood"],
	},
];

export const customers: Customer[] = [
	{
		avatarClass: "bg-brand-50 text-brand-600",
		email: "mila@example.com",
		ltv: "$4,812",
		name: "Mila Horton",
		orders: 28,
		segment: "VIP",
		status: "active",
	},
	{
		avatarClass: "bg-warning-50 text-warning-600",
		email: "rafi@example.com",
		ltv: "$2,108",
		name: "Rafi Ahmed",
		orders: 12,
		segment: "Wholesale",
		status: "review",
	},
	{
		avatarClass: "bg-success-50 text-success-600",
		email: "neha@example.com",
		ltv: "$946",
		name: "Neha Carter",
		orders: 7,
		segment: "Retail",
		status: "active",
	},
];
