import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { syncProductRatingSummary } from "@/lib/backend/product-ratings";

export type ReviewRatingProfile = "glowing" | "mixed" | "realistic";

export type GenerateReviewsOptions = {
	count: number;
	profile: ReviewRatingProfile;
	spreadDays: number;
	status: "approved" | "pending";
};

export type GenerateReviewsResult = {
	generated: number;
	product: {
		id: string;
		name: string;
		rating: number;
		reviewCount: number;
	};
	reviews: {
		createdAt: string;
		customerName: string;
		rating: number;
		review: string;
	}[];
};

// Weighted rating mixes - "glowing" reads as a lightly curated storefront,
// "realistic" mirrors what most genuinely-popular products land on, "mixed"
// includes enough 2-3 star spread to look unmoderated.
const RATING_WEIGHTS: Record<ReviewRatingProfile, Partial<Record<1 | 2 | 3 | 4 | 5, number>>> = {
	glowing: { 4: 30, 5: 70 },
	mixed: { 1: 5, 2: 10, 3: 25, 4: 30, 5: 30 },
	realistic: { 2: 5, 3: 15, 4: 35, 5: 45 },
};

const FIRST_NAMES = [
	"Mila", "Rafi", "Neha", "James", "Sofia", "Wei", "Carlos", "Amara",
	"Liam", "Priya", "Noah", "Elena", "Kwame", "Yuki", "Fatima", "Lucas",
	"Ingrid", "Diego", "Aisha", "Mateo", "Chloe", "Hassan", "Grace", "Arjun",
	"Ivy", "Tomas", "Nadia", "Ethan", "Zara", "Felix", "Priyanka", "Owen",
	"Layla", "Mason", "Freya", "Kenji", "Isabella", "Omar", "Ruby", "Anton",
	"Maya", "Theo", "Sana", "Jasper", "Leilani", "Victor", "Hana", "Marcus",
] as const;

const LAST_INITIALS = "ABCDEFGHIJKLMNOPRSTVW".split("");

const OPENERS: Record<1 | 2 | 3 | 4 | 5, string[]> = {
	1: [
		"Really disappointed with this purchase.",
		"Not what I expected at all.",
		"Wouldn't recommend this one.",
	],
	2: [
		"Had a few issues with this.",
		"It's okay, but I expected more.",
		"Mixed feelings about this purchase.",
	],
	3: [
		"It's decent for the price.",
		"Does the job, nothing special.",
		"An average experience overall.",
	],
	4: [
		"Really happy with this purchase!",
		"Great find, minor nitpicks only.",
		"Solid choice, would consider buying again.",
	],
	5: [
		"Absolutely love this!",
		"Exceeded my expectations!",
		"Best purchase I've made in a while.",
		"Can't recommend this enough!",
	],
};

const BODIES: Record<1 | 2 | 3 | 4 | 5, string[]> = {
	1: [
		"The {product} arrived damaged and customer support was slow to respond.",
		"Quality feels cheap compared to the photos on the listing.",
		"Stopped working within days of using the {product}.",
	],
	2: [
		"The {product} looks fine but sizing runs way off from the chart.",
		"Shipping took much longer than promised and packaging was flimsy.",
		"Color was noticeably different from the pictures shown.",
	],
	3: [
		"The {product} works as described, just nothing that stands out.",
		"Fit is okay but I probably won't reorder the same size.",
		"Fair for the price, though the material feels a bit thin.",
	],
	4: [
		"The {product} fits well and feels well made, just wish it came in more colors.",
		"Great quality overall, delivery was a couple days later than expected.",
		"Comfortable and looks just like the photos, sizing runs slightly small.",
	],
	5: [
		"The {product} fits perfectly and the material feels premium.",
		"Fast shipping and the {product} looks even better in person.",
		"Exactly as described, great quality for the price.",
		"Been using the {product} daily and it still looks brand new.",
	],
};

const CLOSERS: Record<1 | 2 | 3 | 4 | 5, string[]> = {
	1: ["Would not buy again.", "Requesting a refund.", "Save your money."],
	2: ["Probably won't repurchase.", "Expected better for the price.", "Might give it one more try."],
	3: ["Gets the job done.", "Would consider other options next time.", "It's fine, not amazing."],
	4: ["Would recommend to a friend.", "Happy with the purchase overall.", "Will likely shop here again."],
	5: [
		"Highly recommend to anyone on the fence!",
		"Already ordered another one in a different color.",
		"Five stars, no complaints at all.",
		"Will definitely be a repeat customer.",
	],
};

function pickWeighted<T extends string | number>(weights: Partial<Record<T, number>>): T {
	const entries = Object.entries(weights) as [string, number][];
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
	let roll = Math.random() * total;

	for (const [key, weight] of entries) {
		roll -= weight;
		if (roll <= 0) {
			return (Number.isNaN(Number(key)) ? key : Number(key)) as T;
		}
	}

	return entries[entries.length - 1][0] as unknown as T;
}

function pickFrom<T>(list: readonly T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}

function randomReviewerName() {
	const first = pickFrom(FIRST_NAMES);
	const initial = pickFrom(LAST_INITIALS);
	return `${first} ${initial}.`;
}

function randomPastDate(spreadDays: number) {
	const now = Date.now();
	const offsetMs = Math.random() * spreadDays * 24 * 60 * 60 * 1000;
	return new Date(now - offsetMs);
}

function buildReviewText(rating: 1 | 2 | 3 | 4 | 5, productName: string) {
	const opener = pickFrom(OPENERS[rating]);
	const body = pickFrom(BODIES[rating]).replaceAll("{product}", productName);
	const closer = pickFrom(CLOSERS[rating]);
	return `${opener} ${body} ${closer}`;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(Math.round(value), min), max);
}

export function buildGeneratedReviews(options: {
	count: number;
	productName: string;
	profile: ReviewRatingProfile;
	spreadDays: number;
}) {
	const usedNames = new Set<string>();

	return Array.from({ length: options.count }, () => {
		const rating = pickWeighted(RATING_WEIGHTS[options.profile]);

		let customerName = randomReviewerName();
		// Small pool of first-name + initial combos can collide once a batch
		// gets past a dozen or so rows - reroll a few times rather than
		// showing the same reviewer twice in one generated batch.
		for (let attempt = 0; usedNames.has(customerName) && attempt < 5; attempt += 1) {
			customerName = randomReviewerName();
		}
		usedNames.add(customerName);

		return {
			createdAt: randomPastDate(options.spreadDays),
			customerName,
			rating,
			review: buildReviewText(rating, options.productName),
		};
	}).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function generateProductReviews(
	productId: string,
	options: GenerateReviewsOptions,
): Promise<GenerateReviewsResult> {
	const count = clamp(options.count, 1, 50);
	const spreadDays = clamp(options.spreadDays, 1, 365);
	const status = options.status === "pending" ? "pending" : "approved";

	const productResult = await dbQuery<{ id: string; name: string }>(
		`SELECT id::text, name FROM products WHERE id = $1`,
		[productId],
	);
	const product = productResult.rows[0];

	if (!product) {
		throw new HttpError(404, "Product not found.", "RESOURCE_NOT_FOUND");
	}

	const batch = buildGeneratedReviews({
		count,
		productName: product.name,
		profile: options.profile,
		spreadDays,
	});

	const values: unknown[] = [];
	const rowPlaceholders = batch.map((review, index) => {
		const base = index * 7;
		values.push(
			productId,
			product.name,
			review.customerName,
			review.rating,
			review.review,
			status,
			review.createdAt,
		);
		return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
	});

	await dbQuery(
		`
			INSERT INTO product_reviews (product_id, product_name, customer_name, rating, review, status, created_at)
			VALUES ${rowPlaceholders.join(", ")}
		`,
		values,
	);

	if (status === "approved") {
		await syncProductRatingSummary(productId);
	}

	const summaryResult = await dbQuery<{ rating: number | string; review_count: number }>(
		`SELECT rating, review_count FROM products WHERE id = $1`,
		[productId],
	);
	const summary = summaryResult.rows[0];

	return {
		generated: batch.length,
		product: {
			id: productId,
			name: product.name,
			rating: Number(summary?.rating ?? 0),
			reviewCount: summary?.review_count ?? 0,
		},
		reviews: batch.map((review) => ({
			createdAt: review.createdAt.toISOString(),
			customerName: review.customerName,
			rating: review.rating,
			review: review.review,
		})),
	};
}
