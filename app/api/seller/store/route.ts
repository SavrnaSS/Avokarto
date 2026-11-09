import { after, NextRequest } from "next/server";
import { notifyAdmins } from "@/lib/backend/admin-alerts";
import { billingConfigured } from "@/lib/backend/billing";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import {
	createStore,
	getResellerSettings,
	getStoreForCustomer,
	maskPayoutDetails,
	updateStore,
} from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The signed-in customer's store (null before they open one), the
// marketplace rules the seller UI needs, and whether plan checkout is open.
export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const [store, settings] = await Promise.all([getStoreForCustomer(session.sub), getResellerSettings()]);
		return json({
			data: {
				billing: { configured: billingConfigured(), required: settings.subscriptionsRequired },
				settings,
				store: store ? { ...store, payoutDetails: maskPayoutDetails(store.payoutDetails) } : null,
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const store = await createStore(session.sub, await request.json().catch(() => ({})));
		after(() =>
			notifyAdmins("newStore", {
				lines: [["Store", store.name], ["Link", `/store/${store.handle}`], ["Owner", session.email]],
				link: "/admin/resellers",
				subject: `New seller store: ${store.name}`,
				title: "A new store just opened",
			}),
		);
		return json({ data: store }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const store = await updateStore(session.sub, await request.json().catch(() => ({})));
		return json({ data: { ...store, payoutDetails: maskPayoutDetails(store.payoutDetails) } });
	} catch (error) {
		return handleApiError(error);
	}
}
