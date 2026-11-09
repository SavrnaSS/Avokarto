import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { adminResourceTopics } from "@/lib/backend/admin-data";
import { getOptionalCustomer } from "@/lib/backend/customer-auth";
import { getDatabaseConnectionErrorCode } from "@/lib/backend/db";
import { handleApiError, HttpError } from "@/lib/backend/http";
import { subscribeDatabaseNotifications } from "@/lib/backend/realtime-listener";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "reviews" is public too - approved reviews are meant to be shown on the
// storefront, and (like "orders" below) the notify payload never carries
// review content, just {topic, action, table, id, changedAt}. A product
// page uses it to refetch its own review list live when an admin approves
// or rejects a review, without exposing anyone else's pending submissions.
const publicTopics = new Set([
	"advertisements",
	"brands",
	"categories",
	// Coupon codes and their discount terms are meant to be publicly known
	// and used at checkout - nothing about this topic's payload (or the
	// coupons themselves) is customer-specific.
	"coupons",
	"products",
	// Reseller stores, listings, earnings and payouts. Carts of anonymous
	// shoppers reprice store items from it, and the payload is an opaque id
	// like every other topic - all reseller data is fetched from endpoints
	// scoped to the seller or admin.
	"resellers",
	"reviews",
	"shipping-methods",
]);
const adminTopics = new Set<string>(adminResourceTopics);
// The "orders" notification payload only ever carries {topic, action,
// table, id, changedAt} - an opaque order UUID, never customer or order
// details - so it's safe for any signed-in customer to receive, not just
// admins. A customer's account page uses it to know when to refetch
// /api/account/orders, which is separately scoped to their own orders only.
const customerTopics = new Set(["orders"]);
const supportedTopics = new Set([
	...adminTopics,
	...publicTopics,
	...customerTopics,
]);
const encoder = new TextEncoder();
const REALTIME_ERROR_LOG_INTERVAL_MS = 30_000;
let lastRealtimeErrorLogAt = 0;
const realtimeHeaders = {
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"Content-Type": "text/event-stream; charset=utf-8",
	"X-Accel-Buffering": "no",
};

function eventChunk(event: string, payload: unknown) {
	return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function retryableDatabaseResponse(topics: Set<string>) {
	const body = `retry: 5000\n\nevent: unavailable\ndata: ${JSON.stringify({
		code: "DATABASE_UNAVAILABLE",
		topics: [...topics],
	})}\n\n`;

	// EventSource treats non-200 or non-SSE responses as fatal in browsers.
	// A valid SSE response that ends after this frame preserves native retry.
	return new Response(body, { headers: realtimeHeaders });
}

function requestedTopics(request: NextRequest) {
	const requested = request.nextUrl.searchParams
		.get("topics")
		?.split(",")
		.map((topic) => topic.trim())
		.filter(Boolean);
	const topics = requested?.length ? new Set(requested) : new Set(publicTopics);
	const unsupported = [...topics].filter((topic) => !supportedTopics.has(topic));

	if (unsupported.length) {
		throw new HttpError(
			400,
			"One or more realtime topics are not supported.",
			"INVALID_REALTIME_TOPICS",
			{ topics: unsupported },
		);
	}

	return topics;
}

function logRealtimeDisconnect(error: unknown) {
	const now = Date.now();

	if (now - lastRealtimeErrorLogAt < REALTIME_ERROR_LOG_INTERVAL_MS) {
		return;
	}

	lastRealtimeErrorLogAt = now;
	const code = getDatabaseConnectionErrorCode(error) ?? "UNKNOWN";
	console.warn(
		`Realtime LISTEN connection interrupted (${code}). The browser will reconnect automatically.`,
	);
}

function hasAdminOnlyTopic(topics: Set<string>) {
	for (const topic of topics) {
		if (
			adminTopics.has(topic) &&
			!publicTopics.has(topic) &&
			!customerTopics.has(topic)
		) {
			return true;
		}
	}

	return false;
}

function hasCustomerTopic(topics: Set<string>) {
	for (const topic of topics) {
		if (customerTopics.has(topic) && !publicTopics.has(topic)) {
			return true;
		}
	}

	return false;
}

export async function GET(request: NextRequest) {
	try {
		const topics = requestedTopics(request);

		if (hasAdminOnlyTopic(topics)) {
			await requireAdmin(request);
		} else if (hasCustomerTopic(topics)) {
			const customer = await getOptionalCustomer(request);

			if (!customer) {
				await requireAdmin(request);
			}
		}

		let setupError: unknown;
		let setupAborted = false;
		let teardown: ((closeController?: boolean) => void) | undefined;
		let unsubscribe: (() => void) | undefined;
		let notificationHandler:
			| ((message: { payload?: string }) => void)
			| undefined;
		const pendingNotifications: { payload?: string }[] = [];
		const onListenerError = (error: Error) => {
			setupError = error;

			if (teardown) {
				logRealtimeDisconnect(error);
				teardown();
			}
		};
		const onNotification = (message: { payload?: string }) => {
			if (notificationHandler) notificationHandler(message);
			else pendingNotifications.push(message);
		};
		const onRequestAbort = () => {
			setupAborted = true;

			if (teardown) {
				teardown();
			} else unsubscribe?.();
		};

		request.signal.addEventListener("abort", onRequestAbort, { once: true });
		if (request.signal.aborted) onRequestAbort();

		try {
			if (setupAborted) throw new Error("Realtime request aborted during setup.");
			unsubscribe = await subscribeDatabaseNotifications(
				onNotification,
				onListenerError,
			);
			if (setupError || setupAborted) {
				throw setupError ?? new Error("Realtime request aborted during setup.");
			}
		} catch (error) {
			unsubscribe?.();
			request.signal.removeEventListener("abort", onRequestAbort);

			if (!setupAborted && getDatabaseConnectionErrorCode(error)) {
				logRealtimeDisconnect(error);
				return retryableDatabaseResponse(topics);
			}

			throw error;
		}

		let heartbeat: ReturnType<typeof setInterval> | undefined;
		let maxLifetime: ReturnType<typeof setTimeout> | undefined;
		let closed = false;

		const stream = new ReadableStream({
			start(controller) {
				function close(closeController = true) {
					if (closed) {
						return;
					}

					closed = true;

					if (heartbeat) {
						clearInterval(heartbeat);
					}
					if (maxLifetime) {
						clearTimeout(maxLifetime);
					}

					unsubscribe?.();
					unsubscribe = undefined;
					request.signal.removeEventListener("abort", onRequestAbort);

					if (closeController) {
						try {
							controller.close();
						} catch {
							// Already closed/errored from the client side - nothing to do.
						}
					}
				}

				function enqueue(event: string, payload: unknown) {
					if (!closed) {
						controller.enqueue(eventChunk(event, payload));
					}
				}

				function handleNotification(message: { payload?: string }) {
					if (!message.payload) {
						return;
					}

					try {
						const payload = JSON.parse(message.payload) as { topic?: string };
						if (!payload.topic || !topics.has(payload.topic)) {
							return;
						}

						enqueue("message", payload);
						enqueue(payload.topic, payload);
					} catch {
						enqueue("message", { topic: "unknown" });
					}
				}

				teardown = close;
				notificationHandler = handleNotification;
				for (const message of pendingNotifications.splice(0)) {
					handleNotification(message);
				}
				heartbeat = setInterval(() => {
					enqueue("heartbeat", { now: new Date().toISOString() });
				}, 25000);
				// Bound subscribers whose browser vanished without a clean TCP close.
				// A live EventSource reconnects automatically when this timer expires.
				maxLifetime = setTimeout(close, 10 * 60 * 1000);
				controller.enqueue(encoder.encode("retry: 5000\n\n"));
				enqueue("ready", { topics: [...topics] });
			},
			cancel() {
				teardown?.(false);
			},
		});

		return new Response(stream, { headers: realtimeHeaders });
	} catch (error) {
		return handleApiError(error);
	}
}
