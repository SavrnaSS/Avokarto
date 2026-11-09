export const ADMIN_BASE_PATH = "/admin";

const adminRoute = (path: string) =>
	path === "/" ? ADMIN_BASE_PATH : `${ADMIN_BASE_PATH}${path}`;

export const routes = {
	addAdvertisement: adminRoute("/advertisements/new"),
	addAttribute: adminRoute("/attributes/new"),
	addBrand: adminRoute("/brands/new"),
	addCategory: adminRoute("/categories/new"),
	addCoupon: adminRoute("/coupons/new"),
	addOrder: adminRoute("/orders/new"),
	addProduct: adminRoute("/products/new"),
	addShippingMethod: adminRoute("/shipping-methods/new"),
	addUser: adminRoute("/users/new"),
	advertisements: adminRoute("/advertisements"),
	attributes: adminRoute("/attributes"),
	brands: adminRoute("/brands"),
	categories: adminRoute("/categories"),
	coupons: adminRoute("/coupons"),
	customers: adminRoute("/customers"),
	dashboard: ADMIN_BASE_PATH,
	editAdvertisement: (title: string) =>
		adminRoute(`/advertisements/${encodeURIComponent(title)}/edit`),
	editBrand: (slug: string) => adminRoute(`/brands/${encodeURIComponent(slug)}/edit`),
	editCategory: (slug: string) =>
		adminRoute(`/categories/${encodeURIComponent(slug)}/edit`),
	editCoupon: (code: string) => adminRoute(`/coupons/${encodeURIComponent(code)}/edit`),
	editOrder: (orderNumber: string) =>
		adminRoute(`/orders/${encodeURIComponent(orderNumber)}/edit`),
	editProduct: (sku: string) => adminRoute(`/products/${encodeURIComponent(sku)}/edit`),
	editShippingMethod: (name: string) =>
		adminRoute(`/shipping-methods/${encodeURIComponent(name)}/edit`),
	media: adminRoute("/media"),
	notifications: adminRoute("/notifications"),
	orderDetail: (orderNumber: string) =>
		adminRoute(`/orders/${encodeURIComponent(orderNumber)}`),
	orders: adminRoute("/orders"),
	resellerPayouts: adminRoute("/resellers/payouts"),
	resellerStore: (id: string) => adminRoute(`/resellers/${encodeURIComponent(id)}`),
	resellers: adminRoute("/resellers"),
	paymentSettings: adminRoute("/settings/payments"),
	permissionSettings: adminRoute("/settings/permissions"),
	productReviews: adminRoute("/product-reviews"),
	products: adminRoute("/products"),
	reports: adminRoute("/reports"),
	settings: adminRoute("/settings"),
	shippingMethods: adminRoute("/shipping-methods"),
	shippingSettings: adminRoute("/settings/shipping"),
	signIn: adminRoute("/signin"),
	supportTickets: adminRoute("/support-tickets"),
	tax: adminRoute("/tax"),
	users: adminRoute("/users"),
} as const;

export type RouteKey = keyof typeof routes;
