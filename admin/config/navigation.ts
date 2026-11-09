import { routes } from "@/admin/config/routes";
import type { NavigationGroup, NavigationItem } from "@/admin/types/navigation";

export const primaryNavigation: Array<NavigationGroup | NavigationItem> = [
	{
		icon: "layout-dashboard",
		key: "dashboard",
		label: "Dashboard",
		href: routes.dashboard,
	},
	{
		children: [
			{
				href: routes.products,
				key: "products",
				label: "Products",
			},
			{
				href: routes.addProduct,
				key: "add-product",
				label: "Add New Product",
			},
		],
		icon: "store",
		key: "product",
		label: "Product",
	},
	{
		children: [
			{
				href: routes.categories,
				key: "categories",
				label: "Category List",
			},
			{
				href: routes.addCategory,
				key: "add-category",
				label: "Add New Category",
			},
		],
		icon: "list-tree",
		key: "category",
		label: "Category",
	},
	{
		children: [
			{
				href: routes.brands,
				key: "brands",
				label: "Brand List",
			},
			{
				href: routes.addBrand,
				key: "add-brand",
				label: "Add New Brand",
			},
		],
		icon: "star",
		key: "brand",
		label: "Brand",
	},
	{
		children: [
			{
				href: routes.attributes,
				key: "attributes",
				label: "Attributes",
			},
			{
				href: routes.addAttribute,
				key: "add-attribute",
				label: "Add Attributes",
			},
		],
		icon: "sliders-horizontal",
		key: "attributes",
		label: "Attributes",
	},
	{
		children: [
			{
				href: routes.customers,
				key: "customers",
				label: "Customer List",
			},
		],
		icon: "shopping-bag",
		key: "customer",
		label: "Customers",
	},
	{
		children: [
			{
				href: routes.resellers,
				key: "reseller-stores",
				label: "Stores",
			},
			{
				href: routes.resellerPayouts,
				key: "reseller-payouts",
				label: "Payouts",
			},
		],
		icon: "store",
		key: "resellers",
		label: "Resellers",
	},
	{
		children: [
			{
				href: routes.users,
				key: "all-users",
				label: "All Users",
			},
			{
				href: routes.addUser,
				key: "add-user",
				label: "Add New User",
			},
		],
		icon: "users",
		key: "users",
		label: "Users",
	},
	{
		href: routes.media,
		icon: "image",
		key: "media",
		label: "Media",
	},
	{
		children: [
			{
				href: routes.orders,
				key: "orders",
				label: "Order List",
			},
			{
				href: routes.addOrder,
				key: "add-order",
				label: "Add Order",
			},
		],
		icon: "shopping-bag",
		key: "orders",
		label: "Orders",
	},
	{
		children: [
			{
				href: routes.coupons,
				key: "coupons",
				label: "Coupon List",
			},
			{
				href: routes.addCoupon,
				key: "add-coupon",
				label: "Create Coupon",
			},
		],
		icon: "badge-percent",
		key: "coupons",
		label: "Coupons",
	},
	{
		children: [
			{
				href: routes.shippingMethods,
				key: "shipping-methods",
				label: "Shipping Methods",
			},
			{
				href: routes.addShippingMethod,
				key: "add-shipping-method",
				label: "Add Shipping Method",
			},
		],
		icon: "truck",
		key: "shipping-methods",
		label: "Shipping",
	},
	{
		children: [
			{
				href: routes.advertisements,
				key: "advertisements",
				label: "Advertisements",
			},
			{
				href: routes.addAdvertisement,
				key: "add-advertisement",
				label: "Add Advertisement",
			},
		],
		icon: "megaphone",
		key: "advertisements",
		label: "Advertising",
	},
	{
		href: routes.tax,
		icon: "receipt",
		key: "tax",
		label: "Tax",
	},
	{
		href: routes.productReviews,
		icon: "star",
		key: "product-reviews",
		label: "Product Reviews",
	},
	{
		href: routes.supportTickets,
		icon: "life-buoy",
		key: "support-tickets",
		label: "Support Tickets",
	},
	{
		children: [
			{
				href: routes.settings,
				key: "settings",
				label: "Store Profile",
			},
			{
				href: routes.shippingSettings,
				key: "shipping-settings",
				label: "Shipping",
			},
			{
				href: routes.paymentSettings,
				key: "payment-settings",
				label: "Payments",
			},
			{
				href: routes.permissionSettings,
				key: "permission-settings",
				label: "Permissions",
			},
			{
				href: routes.notifications,
				key: "notifications",
				label: "Notifications",
			},
		],
		icon: "settings",
		key: "settings",
		label: "Settings",
	},
	{
		href: routes.reports,
		icon: "bar-chart-3",
		key: "reports",
		label: "Reports",
	},
];
