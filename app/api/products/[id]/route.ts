import { NextRequest } from "next/server";
import { handleApiError, HttpError, json } from "@/lib/backend/http";
import { getStorefrontProduct } from "@/lib/backend/storefront-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const product = await getStorefrontProduct(id);

		if (!product) {
			throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
		}

		return json({ data: product });
	} catch (error) {
		return handleApiError(error);
	}
}
