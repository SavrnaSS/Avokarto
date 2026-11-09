import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { assertCustomDomainAllowed } from "@/lib/backend/billing";
import { getResellerSettings, requireStoreForCustomer } from "@/lib/backend/resellers";
import {
	getStoreDomain,
	removeStoreDomain,
	setStoreDomain,
	withInstructions,
} from "@/lib/backend/store-domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const store = await requireStoreForCustomer(session.sub);
		return json({ data: withInstructions(await getStoreDomain(store.id)) });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PUT(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const store = await requireStoreForCustomer(session.sub);
		await assertCustomDomainAllowed(session.sub, (await getResellerSettings()).subscriptionsRequired);
		const { domain } = await parseJson(request, z.object({ domain: z.string().max(300) }));
		return json({ data: withInstructions(await setStoreDomain(store.id, domain)) });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const store = await requireStoreForCustomer(session.sub);
		await removeStoreDomain(store.id);
		return json({ data: withInstructions(null) });
	} catch (error) {
		return handleApiError(error);
	}
}

