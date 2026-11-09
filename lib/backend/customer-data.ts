import bcrypt from "bcryptjs";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { syncProductRatingSummary } from "@/lib/backend/product-ratings";

type CustomerOrderRow = {
	created_at: string;
	items: { imageUrl: string; name: string }[] | null;
	order_number: string;
	status: string;
	total: number | string;
};

export type CustomerOrder = {
	createdAt: string;
	items: { imageUrl: string; name: string }[];
	orderNumber: string;
	status: string;
	total: number;
};

export async function getCustomerOrders(
	customerId: string,
): Promise<CustomerOrder[]> {
	const result = await dbQuery<CustomerOrderRow>(
		`
			SELECT
				o.order_number,
				o.status,
				o.total,
				o.created_at,
				COALESCE(
					json_agg(
						json_build_object('imageUrl', oi.image_url, 'name', oi.product_name)
						ORDER BY oi.created_at
					) FILTER (WHERE oi.id IS NOT NULL),
					'[]'
				) AS items
			FROM orders o
			LEFT JOIN order_items oi ON oi.order_id = o.id
			WHERE o.customer_id = $1
			GROUP BY o.id
			ORDER BY o.created_at DESC
			LIMIT 100
		`,
		[customerId],
	);

	return result.rows.map((row) => ({
		createdAt: row.created_at,
		items: row.items ?? [],
		orderNumber: row.order_number,
		status: row.status,
		total: Number(row.total),
	}));
}

export type CustomerAddress = {
	address1: string;
	city: string;
	country: string;
	postcode: string;
};

const EMPTY_ADDRESS: CustomerAddress = {
	address1: "",
	city: "",
	country: "",
	postcode: "",
};

type CustomerProfileRow = {
	alternate_address: Partial<CustomerAddress> | null;
	date_of_birth: string | null;
	default_address: Partial<CustomerAddress> | null;
	email: string;
	locale: string;
	name: string;
	phone: string;
};

export type CustomerProfile = {
	alternateAddress: CustomerAddress;
	dateOfBirth: string | null;
	defaultAddress: CustomerAddress;
	email: string;
	locale: string;
	name: string;
	phone: string;
};

export async function getCustomerProfile(
	customerId: string,
): Promise<CustomerProfile | null> {
	const result = await dbQuery<CustomerProfileRow>(
		`
			SELECT name, email, phone, date_of_birth, locale, default_address, alternate_address
			FROM customers
			WHERE id = $1
			LIMIT 1
		`,
		[customerId],
	);
	const row = result.rows[0];

	if (!row) {
		return null;
	}

	return {
		alternateAddress: { ...EMPTY_ADDRESS, ...(row.alternate_address ?? {}) },
		dateOfBirth: row.date_of_birth,
		defaultAddress: { ...EMPTY_ADDRESS, ...(row.default_address ?? {}) },
		email: row.email,
		locale: row.locale,
		name: row.name,
		phone: row.phone,
	};
}

type CustomerProfileUpdate = Partial<{
	alternateAddress: CustomerAddress;
	dateOfBirth: string | null;
	defaultAddress: CustomerAddress;
	email: string;
	locale: string;
	name: string;
	phone: string;
}>;

export async function updateCustomerProfile(
	customerId: string,
	input: CustomerProfileUpdate,
): Promise<CustomerProfile> {
	const columns: Record<string, unknown> = {
		alternate_address: input.alternateAddress,
		date_of_birth: input.dateOfBirth,
		default_address: input.defaultAddress,
		email: input.email?.trim().toLowerCase(),
		locale: input.locale,
		name: input.name?.trim(),
		phone: input.phone,
	};
	const sets: string[] = [];
	const values: unknown[] = [];

	for (const [column, value] of Object.entries(columns)) {
		if (value === undefined) {
			continue;
		}

		values.push(value);
		sets.push(`${column} = $${values.length}`);
	}

	if (sets.length) {
		values.push(customerId);

		try {
			await dbQuery(
				`UPDATE customers SET ${sets.join(", ")} WHERE id = $${values.length}`,
				values,
			);
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "23505"
			) {
				throw new HttpError(
					409,
					"That email is already in use by another account.",
					"EMAIL_TAKEN",
				);
			}

			throw error;
		}
	}

	const updated = await getCustomerProfile(customerId);

	if (!updated) {
		throw new HttpError(404, "Account not found.", "NOT_FOUND");
	}

	return updated;
}

export async function changeCustomerPassword(
	customerId: string,
	currentPassword: string,
	newPassword: string,
) {
	const result = await dbQuery<{ password_hash: string | null }>(
		"SELECT password_hash FROM customers WHERE id = $1 LIMIT 1",
		[customerId],
	);
	const hash = result.rows[0]?.password_hash;

	if (!hash) {
		throw new HttpError(
			400,
			"This account has no password set.",
			"NO_PASSWORD",
		);
	}

	const matches = await bcrypt.compare(currentPassword, hash);

	if (!matches) {
		throw new HttpError(
			401,
			"Current password is incorrect.",
			"INVALID_PASSWORD",
		);
	}

	const newHash = await bcrypt.hash(newPassword, 12);
	await dbQuery("UPDATE customers SET password_hash = $1 WHERE id = $2", [
		newHash,
		customerId,
	]);
}

// Soft delete - orders/reviews/support tickets keep their customer_id link
// intact for the merchant's records. Signing back in with the correct
// password reactivates the account (see authorizeCustomer).
export async function deactivateCustomer(customerId: string) {
	await dbQuery("UPDATE customers SET status = 'deleted' WHERE id = $1", [
		customerId,
	]);
}

type ReviewableProductRow = {
	image_url: string;
	product_id: string;
	product_name: string;
	rating: number | null;
	review: string | null;
	sku: string;
	status: string | null;
	unit_price: number | string;
};

export type ReviewableProduct = {
	imageUrl: string;
	productId: string;
	productName: string;
	rating: number | null;
	review: string | null;
	sku: string;
	status: string | null;
	unitPrice: number;
};

// Every distinct product this customer has ever ordered, left-joined with
// their own review for it (if any) - "reviewable" here means "purchased",
// which is the same rule the storefront's own review moderation assumes.
export async function getCustomerReviewableProducts(
	customerId: string,
): Promise<ReviewableProduct[]> {
	const result = await dbQuery<ReviewableProductRow>(
		`
			SELECT DISTINCT ON (oi.product_id)
				oi.product_id::text,
				oi.sku,
				oi.product_name,
				oi.image_url,
				oi.unit_price,
				pr.rating,
				pr.review,
				pr.status
			FROM order_items oi
			JOIN orders o ON o.id = oi.order_id
			LEFT JOIN product_reviews pr
				ON pr.product_id = oi.product_id AND pr.customer_id = $1
			WHERE o.customer_id = $1 AND oi.product_id IS NOT NULL
			ORDER BY oi.product_id, oi.created_at DESC
		`,
		[customerId],
	);

	return result.rows.map((row) => ({
		imageUrl: row.image_url,
		productId: row.product_id,
		productName: row.product_name,
		rating: row.rating,
		review: row.review,
		sku: row.sku,
		status: row.status,
		unitPrice: Number(row.unit_price),
	}));
}

export async function submitCustomerReview(
	customerId: string,
	customerName: string,
	productId: string,
	rating: number,
	review: string,
) {
	const product = await dbQuery<{ name: string }>(
		"SELECT name FROM products WHERE id = $1 LIMIT 1",
		[productId],
	);

	if (!product.rows[0]) {
		throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
	}

	await dbQuery(
		`
			INSERT INTO product_reviews (product_id, product_name, customer_id, customer_name, rating, review, status)
			VALUES ($1, $2, $3, $4, $5, $6, 'pending')
			ON CONFLICT (product_id, customer_id)
			DO UPDATE SET
				customer_name = EXCLUDED.customer_name,
				rating = EXCLUDED.rating,
				review = EXCLUDED.review,
				status = 'pending'
		`,
		[productId, product.rows[0].name, customerId, customerName, rating, review],
	);

	// A re-submitted review always resets to 'pending' (see above), which can
	// drop a previously-approved review out of the average - keep the
	// product's cached rating/review_count honest either way.
	await syncProductRatingSummary(productId);
}
