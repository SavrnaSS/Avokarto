import { baseURL } from "@/admin/utils/cn";

export type ProductStatus = "draft" | "low stock" | "published";

export type Product = {
	category: string;
	// Populated once a product is loaded from the database (see
	// getAdminProducts in lib/backend/admin-data.ts); absent from the static
	// demo rows below, which only exist as a pre-hydration fallback.
	id?: string;
	image: string;
	name: string;
	price: number;
	sku: string;
	status: ProductStatus;
	stock: number;
};

export const products: Product[] = [
	{
		category: "Grocery",
		image: `${baseURL}assets/images/products/organic-food-a-01.webp`,
		name: "Organic Food Pack",
		price: 29,
		sku: "GRC-2041",
		status: "published",
		stock: 510,
	},
	{
		category: "Snacks",
		image: `${baseURL}assets/images/products/bakery-product-img-02.webp`,
		name: "Bakery Breakfast Box With Long Marketplace Name",
		price: 24,
		sku: "GRC-2188",
		status: "low stock",
		stock: 18,
	},
	{
		category: "Bundle",
		image: `${baseURL}assets/images/products/coffee-b-01.webp`,
		name: "Premium Coffee Pack",
		price: 36,
		sku: "GRC-2207",
		status: "draft",
		stock: 188,
	},
];

export const productFormDefaults = {
	add: {
		description:
			"Create a catalog item with media, pricing, inventory, and SEO details.",
		formId: "add-product-form",
		subtitle: "Add New Product",
		title: "Product Form",
	},
	edit: {
		description:
			"Update product content, media, pricing, inventory, reviews, and storefront display settings.",
		formId: "edit-product-form",
		subtitle: "Edit Product",
		title: "Edit Product",
	},
} as const;
