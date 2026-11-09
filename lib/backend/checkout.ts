import { z } from "zod";
import { withTransaction } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import {
	BUNDLE_DISCOUNT_PERCENT,
	priceWithBundles,
} from "@/lib/bundleDiscount";
import type { OrderEmailData } from "@/lib/backend/orderEmails";
import {
	getOrderEmailStore,
	recordResellerEarning,
	resolveCheckoutListings,
	type CheckoutListing,
} from "@/lib/backend/resellers";
import { getShippingCost } from "@/lib/shippingPolicy";
import { assertPaymentMethodAllowed, getStoreSettingsPolicy } from "@/lib/backend/store-policy";

type ProductRow = {
	id: string;
	image_url: string;
	legacy_id: number | null;
	name: string;
	price: number | string;
	sku: string;
	stock: number;
};

const checkoutAddressSchema = z
	.object({
		address1: z.string().trim().optional(),
		address2: z.string().trim().optional(),
		city: z.string().trim().optional(),
		country: z.string().trim().optional(),
		postcode: z.string().trim().optional(),
		state: z.string().trim().optional(),
	})
	.default({});

const checkoutItemSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional(),
		quantity: z.coerce.number().int().min(1).max(99),
		expectedUnitPrice: z.number().finite().nonnegative().optional(),
		sku: z.string().trim().optional(),
		// Items added together from the bundle builder share this id.
		bundleId: z.string().trim().max(64).optional(),
		// Bought through a reseller store: charged that store's price, and the
		// margin is credited to the store (see lib/backend/resellers.ts).
		resellerListingId: z.string().uuid().optional(),
	})
	.refine((item) => item.id !== undefined || Boolean(item.sku), {
		message: "Each checkout item needs an id or sku.",
	});

const checkoutSchema = z.object({
	billingAddress: checkoutAddressSchema,
	currency: z.string().trim().length(3).default("USD"),
	customerEmail: z.string().trim().email(),
	customerName: z.string().trim().min(2),
	customerPhone: z.string().trim().max(40).optional().default(""),
	items: z.array(checkoutItemSchema).min(1).max(100),
	notes: z.string().trim().max(1000).optional().default(""),
	paymentMethod: z.string().trim().max(80).optional().default("pending"),
	shippingAddress: checkoutAddressSchema,
	shippingMethodId: z.string().trim().min(1, "A shipping method is required."),
	expectedTotals: z.object({
		subtotal: z.number().finite().nonnegative(),
		shippingCost: z.number().finite().nonnegative(),
		total: z.number().finite().nonnegative(),
	}).optional(),
});

type CheckoutPayload = z.infer<typeof checkoutSchema>;

function itemKey(item: CheckoutPayload["items"][number]) {
	return item.sku || String(item.id);
}

function orderNumber() {
	const timestamp = Date.now().toString(36).toUpperCase();
	const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
	return `AVO-${timestamp}-${suffix}`;
}

function toIdentifierSet(items: CheckoutPayload["items"]) {
	const skus = new Set<string>();
	const ids = new Set<string>();

	for (const item of items) {
		if (item.sku) {
			skus.add(item.sku);
		}

		if (item.id !== undefined) {
			ids.add(String(item.id));
		}
	}

	return {
		ids: [...ids],
		skus: [...skus],
	};
}

function resolveProduct(
	item: CheckoutPayload["items"][number],
	productsByKey: Map<string, ProductRow>,
) {
	const keys = [item.sku, item.id === undefined ? undefined : String(item.id)]
		.filter((value): value is string => Boolean(value));

	for (const key of keys) {
		const product = productsByKey.get(key);

		if (product) {
			return product;
		}
	}

	throw new HttpError(
		400,
		`Product ${itemKey(item)} is not available for checkout.`,
		"CHECKOUT_PRODUCT_UNAVAILABLE",
	);
}

export async function createCheckoutOrder(
	body: unknown,
	{ customerId }: { customerId?: string } = {},
) {
	const input = checkoutSchema.parse(body);
	const identifiers = toIdentifierSet(input.items);
	// The admin's live rules (Settings -> Shipping / Payments), not the browser's copy.
	const policy = await getStoreSettingsPolicy();
	assertPaymentMethodAllowed(input.paymentMethod, policy);

	return withTransaction(async (client) => {
		// This identifier is supplied only by the server's verified session,
		// never by the checkout body or an unverified matching email address.
		let authenticatedCustomerId: string | null = null;
		if (customerId) {
			const customer = await client.query<{ id: string }>(
				`SELECT id::text FROM customers
				 WHERE id = $1 AND password_hash IS NOT NULL AND status = 'active'
				 LIMIT 1`,
				[customerId],
			);
			authenticatedCustomerId = customer.rows[0]?.id ?? null;
			if (!authenticatedCustomerId) {
				throw new HttpError(401, "Sign in again to place this order.", "CHECKOUT_CUSTOMER_SESSION_INVALID");
			}
		}

		const products = await client.query<ProductRow>(
			`
				SELECT id::text, legacy_id, sku, name, image_url, price, stock
				FROM products
				WHERE status IN ('published', 'low stock')
				AND (
					sku = ANY($1::text[])
					OR id::text = ANY($2::text[])
					OR legacy_id::text = ANY($2::text[])
				)
				FOR UPDATE
			`,
			[identifiers.skus, identifiers.ids],
		);
		const productsByKey = new Map<string, ProductRow>();

		for (const product of products.rows) {
			productsByKey.set(product.sku, product);
			productsByKey.set(product.id, product);

			if (product.legacy_id !== null) {
				productsByKey.set(String(product.legacy_id), product);
			}
		}

		const quantities = new Map<
			string,
			{
				product: ProductRow;
				quantity: number;
				bundleId?: string;
				// What one unit costs before any bundle discount: the store's
				// price for reseller lines, the catalog price otherwise.
				unitPrice: number;
				listing?: CheckoutListing;
			}
		>();
		const listings = await resolveCheckoutListings(
			client,
			input.items.flatMap((item) => (item.resellerListingId ? [item.resellerListingId] : [])),
		);

		for (const item of input.items) {
			const product = resolveProduct(item, productsByKey);
			const listing = item.resellerListingId ? listings.get(item.resellerListingId) : undefined;
			if (item.resellerListingId && (!listing || listing.productId !== product.id)) {
				throw new HttpError(
					409,
					`${product.name} is no longer sold by that store. Review the updated price before placing your order.`,
					"CHECKOUT_PRICE_CHANGED",
				);
			}
			const unitPrice = listing ? listing.salePrice : Number(product.price);
			if (item.expectedUnitPrice !== undefined &&
				Math.round(item.expectedUnitPrice * 100) !== Math.round(unitPrice * 100)) {
				throw new HttpError(409, "Prices have changed. Review the updated total before placing your order.", "CHECKOUT_PRICE_CHANGED");
			}
			const existing = quantities.get(product.id);

			if (existing) {
				if (existing.listing?.listingId !== listing?.listingId) {
					throw new HttpError(400, `${product.name} is in your cart twice at different prices. Remove one to continue.`, "CHECKOUT_DUPLICATE_ITEM");
				}
				existing.quantity += item.quantity;
				existing.bundleId ??= item.bundleId || undefined;
			} else {
				quantities.set(product.id, {
					product,
					quantity: item.quantity,
					bundleId: item.bundleId || undefined,
					unitPrice,
					listing,
				});
			}
		}

		for (const { product, quantity } of quantities.values()) {
			if (quantity > 99) {
				throw new HttpError(400, `Choose no more than 99 of ${product.name}.`, "CHECKOUT_QUANTITY_INVALID");
			}
			if (product.stock < quantity) {
				throw new HttpError(
					409,
					`${product.name} only has ${product.stock} in stock.`,
					"CHECKOUT_STOCK_CONFLICT",
				);
			}
		}

		// Same bundle rule as the storefront (lib/bundleDiscount.ts), applied to
		// database prices - a bundle only qualifies with 2+ distinct products
		// from it in this order, so client-sent ids can't discount lone items.
		const pricing = priceWithBundles(
			[...quantities.values()].map(({ product, quantity, bundleId, unitPrice }) => ({
				key: product.id,
				bundleId,
				unitPrice,
				quantity,
			})),
		);
		const subtotal = pricing.total;
		const bundleDiscount = pricing.discount;
		const orderNotes = bundleDiscount > 0
			? [
					input.notes,
					`Bundle discount (${BUNDLE_DISCOUNT_PERCENT}%): -${bundleDiscount.toFixed(2)} ${input.currency.toUpperCase()}`,
				]
					.filter(Boolean)
					.join("\n")
			: input.notes;

		const shippingMethod = await client.query<{
			id: string;
			name: string;
			price: number | string;
			min_delivery_days: number | null;
			max_delivery_days: number | null;
		}>(
			`
				SELECT id::text, name, price, min_delivery_days, max_delivery_days
				FROM shipping_methods
				WHERE id = $1 AND status = 'active'
				LIMIT 1
			`,
			[input.shippingMethodId],
		);
		const shippingMethodRow = shippingMethod.rows[0];

		if (!shippingMethodRow) {
			throw new HttpError(
				400,
				"Select a shipping method to continue.",
				"CHECKOUT_SHIPPING_METHOD_INVALID",
			);
		}

		// Qualify using authoritative USD merchandise prices after bundle discounts.
		// The customer still selects a valid active method; its fee is waived once
		// the order reaches the admin's free-shipping minimum (if that's on).
		const shippingCost = getShippingCost(subtotal, Number(shippingMethodRow.price), policy.freeShipping);
		const total = subtotal + shippingCost;
		if (input.expectedTotals && (
			Math.round(input.expectedTotals.subtotal * 100) !== Math.round(subtotal * 100) ||
			Math.round(input.expectedTotals.shippingCost * 100) !== Math.round(shippingCost * 100) ||
			Math.round(input.expectedTotals.total * 100) !== Math.round(total * 100)
		)) {
			throw new HttpError(409, "Prices or delivery charges have changed. Review the updated total before placing your order.", "CHECKOUT_PRICE_CHANGED");
		}
		// Guest contact details stay on the order snapshot. A guest cannot
		// attach an order to, rename, or reactivate an account using its email.
		const order = await client.query<{ id: string; order_number: string }>(
			`
				INSERT INTO orders (
					order_number, customer_id, customer_name, customer_email,
					customer_phone, status, total, currency, payment_status,
					payment_method, source, billing_address, shipping_address, notes,
					shipping_method_id, shipping_method_name, shipping_cost
				)
				VALUES (
					$1, $2, $3, $4, $5, 'pending', $6, $7, 'unpaid',
					$8, 'storefront', $9, $10, $11, $12, $13, $14
				)
				RETURNING id::text, order_number
			`,
			[
				orderNumber(),
				authenticatedCustomerId,
				input.customerName,
				input.customerEmail.toLowerCase(),
				input.customerPhone,
				Number(total.toFixed(2)),
				input.currency.toUpperCase(),
				input.paymentMethod,
				input.billingAddress,
				input.shippingAddress,
				orderNotes,
				shippingMethodRow.id,
				shippingMethodRow.name,
				Number(shippingCost.toFixed(2)),
			],
		);
		const orderId = order.rows[0]?.id;

		if (!orderId) {
			throw new HttpError(500, "Unable to create order.", "CHECKOUT_FAILED");
		}

		for (const { product, quantity, unitPrice, listing } of quantities.values()) {
			// Bundle items are recorded at the price actually charged.
			const chargedUnitPrice = pricing.discountedUnitPrice.get(product.id) ?? unitPrice;
			const orderItem = await client.query<{ id: string }>(
				`
					INSERT INTO order_items (
						order_id, product_id, product_name, sku, image_url, qty, unit_price
					)
					VALUES ($1, $2, $3, $4, $5, $6, $7)
					RETURNING id::text
				`,
				[
					orderId,
					product.id,
					product.name,
					product.sku,
					product.image_url,
					quantity,
					chargedUnitPrice,
				],
			);
			if (listing) {
				await recordResellerEarning(client, {
					basePrice: Number(product.price),
					chargedUnitPrice,
					orderId,
					orderItemId: orderItem.rows[0].id,
					productId: product.id,
					productName: product.name,
					quantity,
					storeId: listing.storeId,
				});
			}
			await client.query(
				"UPDATE products SET stock = stock - $1 WHERE id = $2",
				[quantity, product.id],
			);
		}

		const { min_delivery_days: minDays, max_delivery_days: maxDays } = shippingMethodRow;
		const estimate =
			minDays && maxDays
				? minDays === maxDays
					? `${minDays} days`
					: `${minDays}-${maxDays} days`
				: minDays || maxDays
					? `${minDays || maxDays} days`
					: undefined;

		// Data for the confirmation email - returned separately so none of it
		// leaks into the API response beyond what the storefront already gets.
		// An order bought entirely through one store (always the case from the
		// store's own checkout) gets that store's branded confirmation email.
		const storeIds = new Set([...quantities.values()].map(({ listing }) => listing?.storeId ?? ""));
		const emailStore = storeIds.size === 1 && !storeIds.has("") ? await getOrderEmailStore(client, [...storeIds][0]) : null;

		const confirmationEmail: OrderEmailData = {
			orderNumber: order.rows[0].order_number,
			customerName: input.customerName,
			customerEmail: input.customerEmail.toLowerCase(),
			placedAt: new Date(),
			currency: input.currency.toUpperCase(),
			items: [...quantities.values()].map(({ product, quantity, unitPrice }) => {
				const charged = pricing.discountedUnitPrice.get(product.id);
				return {
					name: product.name,
					sku: product.sku || undefined,
					quantity,
					unitPrice: charged ?? unitPrice,
					regularUnitPrice: charged !== undefined ? unitPrice : undefined,
				};
			}),
			itemsSubtotal: pricing.subtotal,
			bundleDiscount,
			shippingCost: Number(shippingCost.toFixed(2)),
			total: Number(total.toFixed(2)),
			shippingMethod: { name: shippingMethodRow.name, estimate },
			shippingAddress: input.shippingAddress,
			paymentMethod: input.paymentMethod,
			...(emailStore ? { store: emailStore } : {}),
		};

		return {
			order: {
				id: orderId,
				items: [...quantities.values()].map(({ product, quantity, unitPrice }) => {
					const charged = pricing.discountedUnitPrice.get(product.id);
					return {
						title: product.name,
						imgSrc: product.image_url,
						href: `/product/${encodeURIComponent(product.id)}`,
						quantity,
						unitPrice: charged ?? unitPrice,
						regularUnitPrice: charged !== undefined ? unitPrice : undefined,
					};
				}),
				itemCount: [...quantities.values()].reduce(
					(sum, { quantity }) => sum + quantity,
					0,
				),
				orderNumber: order.rows[0].order_number,
				shippingCost: Number(shippingCost.toFixed(2)),
				bundleDiscount,
				subtotal: Number(subtotal.toFixed(2)),
				total: Number(total.toFixed(2)),
			},
			confirmationEmail,
		};
	});
}
