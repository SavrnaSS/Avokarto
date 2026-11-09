import { baseURL } from "@/admin/utils/cn";

export type Role = {
	name: string;
	permissions: string;
	status: "active" | "draft";
	users: string;
};

export type Order = {
	added: string;
	customer: string;
	id: string;
	modified: string;
	status: "cancelled" | "completed" | "delivering" | "failed" | "pending";
	total: string;
};

export type CurrencyRate = {
	code: string;
	lastUpdated: string;
	name: string;
	rate: number;
};

export type Coupon = {
	code: string;
	discount: string;
	iconClass: string;
	name: string;
	status: "active" | "draft" | "expired" | "scheduled";
	summary: string;
	type: "fixed" | "percentage" | "shipping";
	used: string;
	validity: string;
};

export type ShippingMethod = {
	carrier: string;
	deliveryEstimate: string;
	description: string;
	id: string;
	name: string;
	price: number;
	sortOrder: number;
	status: "active" | "inactive";
};

export type Advertisement = {
	id: string;
	title: string;
	imageUrl: string;
	linkUrl: string;
	sortOrder: number;
	status: "active" | "inactive";
};

export type ProductReview = {
	customer: string;
	product: string;
	rating: number;
	review: string;
	status: "approved" | "draft" | "pending";
};

export type SupportTicket = {
	assignee: string;
	customer: string;
	email?: string;
	message?: string;
	phone?: string;
	priority: "High" | "Low" | "Medium";
	status: "open" | "pending" | "resolved";
	title: string;
};

export type TemplateListItem = {
	name: string;
	owner: string;
	status: "active" | "draft" | "scheduled";
	updated: string;
};

export const roles: Role[] = [
	{
		name: "Administrator",
		permissions: "Full access",
		status: "active",
		users: "4 users",
	},
	{
		name: "Store Manager",
		permissions: "Products, orders, coupons",
		status: "active",
		users: "12 users",
	},
	{
		name: "Support Agent",
		permissions: "Customers, tickets, orders",
		status: "draft",
		users: "8 users",
	},
];

export const orders: Order[] = [
	[
		"13290",
		"Francis Mitcham",
		"delivering",
		"$449.00",
		"11/06/2026",
		"16/06/2026",
	],
	[
		"13291",
		"Francis Mitcham",
		"completed",
		"$136.00",
		"12/06/2026",
		"15/06/2026",
	],
	["13292", "Ana Crown", "delivering", "$168.00", "11/06/2026", "14/06/2026"],
	[
		"13293",
		"Francis Mitcham",
		"completed",
		"$254.00",
		"07/06/2026",
		"13/06/2026",
	],
	["13294", "Dan Wilson", "delivering", "$342.00", "11/06/2026", "12/06/2026"],
	["13295", "Brian Cox", "completed", "$486.00", "08/06/2026", "11/06/2026"],
	["13296", "Ana Crown", "completed", "$176.00", "04/06/2026", "10/06/2026"],
	["13297", "Robert Doe", "failed", "$238.00", "08/06/2026", "09/06/2026"],
	["13298", "Ana Crown", "completed", "$86.00", "05/06/2026", "08/06/2026"],
	[
		"13299",
		"Mikaela Collins",
		"completed",
		"$233.00",
		"06/06/2026",
		"07/06/2026",
	],
].map(([id, customer, status, total, added, modified]) => ({
	added,
	customer,
	id,
	modified,
	status: status as Order["status"],
	total,
}));

export const currencyRates: CurrencyRate[] = [
	{ code: "USD", lastUpdated: "Today", name: "US Dollar", rate: 1 },
	{ code: "BDT", lastUpdated: "Today", name: "Bangladeshi Taka", rate: 117.42 },
	{ code: "EUR", lastUpdated: "Yesterday", name: "Euro", rate: 0.92 },
];

export const coupons: Coupon[] = [
	{
		code: "SUMMER25",
		discount: "25% off",
		iconClass: "bg-brand-50 text-brand-600",
		name: "Summer Essentials",
		status: "active",
		summary: "Applies to selected seasonal products",
		type: "percentage",
		used: "318 / 500",
		validity: "01 Jun - 30 Jun 2026",
	},
	{
		code: "WELCOME10",
		discount: "$10 off",
		iconClass: "bg-success-50 text-success-600",
		name: "First Order Bonus",
		status: "active",
		summary: "New customers only",
		type: "fixed",
		used: "1,204 / 2,000",
		validity: "Always active",
	},
	{
		code: "SHIPFREE",
		discount: "Free shipping",
		iconClass: "bg-warning-50 text-warning-600",
		name: "Free Delivery Weekend",
		status: "scheduled",
		summary: "Cart total over $49",
		type: "shipping",
		used: "88 / 300",
		validity: "22 Jun - 24 Jun 2026",
	},
	{
		code: "BAKE15",
		discount: "15% off",
		iconClass: "bg-accent-50 text-accent-700",
		name: "Bakery Flash Sale",
		status: "active",
		summary: "Bakery category only",
		type: "percentage",
		used: "142 / 250",
		validity: "10 Jun - 20 Jun 2026",
	},
	{
		code: "GROCERY50",
		discount: "$50 off",
		iconClass: "bg-brand-100 text-brand-700",
		name: "Bulk Grocery Deal",
		status: "active",
		summary: "Minimum cart $250",
		type: "fixed",
		used: "67 / 120",
		validity: "05 Jun - 05 Jul 2026",
	},
	{
		code: "GLOW20",
		discount: "20% off",
		iconClass: "bg-danger-50 text-danger-500",
		name: "Beauty Launch",
		status: "scheduled",
		summary: "Beauty collection launch campaign",
		type: "percentage",
		used: "0 / 400",
		validity: "01 Jul - 15 Jul 2026",
	},
	{
		code: "COMEBACK",
		discount: "$15 off",
		iconClass: "bg-surface-muted text-ink-600",
		name: "Cart Recovery",
		status: "draft",
		summary: "Email campaign coupon",
		type: "fixed",
		used: "93 / 1,000",
		validity: "No end date",
	},
	{
		code: "HOLIDAYSHIP",
		discount: "Free shipping",
		iconClass: "bg-warning-100 text-warning-600",
		name: "Holiday Shipping",
		status: "expired",
		summary: "Holiday campaign shipping offer",
		type: "shipping",
		used: "741 / 900",
		validity: "01 Dec - 31 Dec 2025",
	},
];

export const orderProducts = [
	{
		image: `${baseURL}assets/images/products/organic-food-a-01.webp`,
		name: "Product 1",
		price: 60,
		qty: 31,
		sku: "04029007",
	},
	{
		image: `${baseURL}assets/images/products/bakery-product-img-02.webp`,
		name: "Product 2",
		price: 122,
		qty: 23,
		sku: "02706007",
	},
	{
		image: `${baseURL}assets/images/products/coffee-b-01.webp`,
		name: "Product 3",
		price: 16,
		qty: 29,
		sku: "03842004",
	},
	{
		image: `${baseURL}assets/images/products/organic-food-a-01.webp`,
		name: "Product 4",
		price: 269,
		qty: 41,
		sku: "02554001",
	},
	{
		image: `${baseURL}assets/images/products/bakery-product-img-02.webp`,
		name: "Product 5",
		price: 48,
		qty: 12,
		sku: "01933006",
	},
	{
		image: `${baseURL}assets/images/products/coffee-b-01.webp`,
		name: "Product 6",
		price: 89,
		qty: 8,
		sku: "07712003",
	},
];

export const productReviews: ProductReview[] = [
	{
		customer: "Robert Doe",
		product: "Organic Grocery Pack",
		rating: 5,
		review: "Fresh quality and fast delivery.",
		status: "pending",
	},
	{
		customer: "Mikaela Collins",
		product: "Coffee Beans",
		rating: 4,
		review: "Great aroma, packaging was good.",
		status: "approved",
	},
	{
		customer: "Amin Khan",
		product: "Snack Box",
		rating: 3,
		review: "Good mix, wanted more spicy items.",
		status: "draft",
	},
];

export const supportTickets: SupportTicket[] = [
	{
		assignee: "Sumit Singh",
		customer: "Robert Doe",
		priority: "High",
		status: "open",
		title: "#TK-1042 Delivery delay",
	},
	{
		assignee: "Support Team",
		customer: "Mikaela Collins",
		priority: "Medium",
		status: "pending",
		title: "#TK-1041 Refund request",
	},
	{
		assignee: "Support Team",
		customer: "Amin Khan",
		priority: "Low",
		status: "resolved",
		title: "#TK-1040 Product question",
	},
];

export const templateListItems: TemplateListItem[] = [
	{
		name: "Featured homepage block",
		owner: "Marketing",
		status: "active",
		updated: "Today",
	},
	{
		name: "Seasonal campaign",
		owner: "Sales",
		status: "scheduled",
		updated: "Yesterday",
	},
	{
		name: "Draft collection",
		owner: "Catalog",
		status: "draft",
		updated: "3 days ago",
	},
];
