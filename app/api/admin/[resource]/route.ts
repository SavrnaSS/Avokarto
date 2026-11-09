import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/backend/auth";
import {
	deleteAdminResource,
	getAdminResource,
} from "@/lib/backend/admin-data";
import { mutateAdminResource } from "@/lib/backend/admin-mutations";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const deleteSchema = z.object({
	ids: z.array(z.string().min(1)).min(1).max(100),
});

type RouteContext = {
	params: Promise<{ resource: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
	try {
		await requireAdmin(request);
		const { resource } = await params;
		const data = await getAdminResource(resource);

		return json({ data });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { resource } = await params;
		const { ids } = await parseJson(request, deleteSchema);
		const result = await deleteAdminResource(resource, ids);

		return json(result);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { resource } = await params;
		const body = await request.json().catch(() => ({}));
		const data = await mutateAdminResource(resource, body, "create");

		return json({ data }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { resource } = await params;
		const body = await request.json().catch(() => ({}));
		const data = await mutateAdminResource(resource, body, "update");

		return json({ data });
	} catch (error) {
		return handleApiError(error);
	}
}
