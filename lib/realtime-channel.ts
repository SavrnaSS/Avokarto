"use client";

type Subscriber = {
	onError?: (message: string) => void;
	onMessage: (refreshScope: object) => void;
};

const INTERRUPTED_MESSAGE =
	"Realtime connection interrupted. Live data will retry automatically.";

// Topics the server streams without authentication (mirrors publicTopics in
// app/api/realtime/route.ts). Only these are multiplexed onto the shared
// public stream; admin/customer topics keep their own authenticated
// connections so an auth failure can never take the public stream down.
const PUBLIC_TOPICS = new Set([
	"advertisements",
	"brands",
	"categories",
	"coupons",
	"products",
	"resellers",
	"reviews",
	"shipping-methods",
]);

// Grace period before closing an idle stream, so route transitions (and
// React's dev double-mount) re-use the connection instead of reopening it.
const IDLE_CLOSE_MS = 1500;

function parseTopics(topicsQuery: string) {
	let decoded = topicsQuery;
	try {
		decoded = decodeURIComponent(topicsQuery);
	} catch {
		// Not URI-encoded - use as given.
	}
	return decoded
		.split(",")
		.map((topic) => topic.trim())
		.filter(Boolean);
}

/* ------------------------------------------------------------------------
 * Shared public stream
 *
 * Browsers cap concurrent HTTP/1.1 connections per origin (6 in Chrome),
 * shared by every tab. SSE connections stay open indefinitely, so one
 * EventSource per topic (a product page used 5) exhausts that pool: a
 * second tab - or even this tab's own fetches and code-split chunks -
 * stalls until something times out. All public topics therefore share ONE
 * EventSource per tab, subscribed to the union of topics in use, and each
 * notification is routed only to subscribers of its topic.
 * --------------------------------------------------------------------- */

type HubSubscriber = Subscriber & {
	topics: ReadonlySet<string>;
	// Whether this subscriber has seen a "ready" frame yet - the first one
	// triggers its catch-up refetch (NOTIFY is ephemeral, so anything that
	// changed between its initial fetch and LISTEN becoming ready is re-read).
	caughtUp: boolean;
};

type HubStream = {
	source: EventSource;
	topics: ReadonlySet<string>;
	readyCount: number;
};

const hub = {
	subscribers: new Set<HubSubscriber>(),
	current: null as HubStream | null,
	// A replacement stream (topic union grew) that isn't ready yet; the
	// current one keeps delivering until it is, so no notification is lost.
	pending: null as HubStream | null,
	syncTimer: null as ReturnType<typeof setTimeout> | null,
	closeTimer: null as ReturnType<typeof setTimeout> | null,
};

function hubUnion() {
	const union = new Set<string>();
	for (const subscriber of hub.subscribers) {
		for (const topic of subscriber.topics) union.add(topic);
	}
	return union;
}

function covers(stream: HubStream | null, topics: ReadonlySet<string>) {
	if (!stream) return false;
	for (const topic of topics) if (!stream.topics.has(topic)) return false;
	return true;
}

function closeStream(stream: HubStream | null) {
	stream?.source.close();
}

function openStream(topics: ReadonlySet<string>): HubStream {
	const sorted = [...topics].sort();
	const source = new EventSource(
		`/api/realtime?topics=${encodeURIComponent(sorted.join(","))}`,
	);
	const stream: HubStream = { source, topics: new Set(sorted), readyCount: 0 };

	source.addEventListener("message", (event) => {
		// Only the active stream delivers - during a hand-over the pending
		// one is silent until it takes over, so nothing is delivered twice.
		if (hub.current !== stream) return;
		let topic: string | undefined;
		try {
			topic = (JSON.parse((event as MessageEvent<string>).data) as { topic?: string })
				.topic;
		} catch {
			topic = undefined;
		}
		// Components responding to this event may share a fresh read. Every
		// later event gets its own scope, so it cannot reuse a pre-change read.
		const refreshScope = {};
		for (const subscriber of [...hub.subscribers]) {
			if (!topic || topic === "unknown" || subscriber.topics.has(topic)) {
				subscriber.onMessage(refreshScope);
			}
		}
	});

	source.addEventListener("ready", () => {
		stream.readyCount += 1;
		if (hub.pending === stream) {
			// Hand-over: the wider stream is live - retire the old one.
			closeStream(hub.current);
			hub.current = stream;
			hub.pending = null;
		}
		if (hub.current !== stream) return;

		// First ready of a stream: only subscribers that haven't caught up
		// yet refetch (existing ones were covered by the previous stream).
		// Any later ready is an automatic reconnect after an outage, where
		// events may have been missed - everyone refetches.
		const reconnect = stream.readyCount > 1;
		const refreshScope = {};
		for (const subscriber of [...hub.subscribers]) {
			if (reconnect || !subscriber.caughtUp) {
				subscriber.caughtUp = true;
				subscriber.onMessage(refreshScope);
			}
		}
	});

	source.addEventListener("error", () => {
		if (hub.current !== stream) return;
		for (const subscriber of [...hub.subscribers]) {
			subscriber.onError?.(INTERRUPTED_MESSAGE);
		}
	});

	return stream;
}

// Coalesces subscription changes (a page mounts many components in one
// tick) into a single connect/reconnect decision.
function scheduleHubSync() {
	if (hub.syncTimer) return;
	hub.syncTimer = setTimeout(() => {
		hub.syncTimer = null;
		syncHub();
	}, 0);
}

function syncHub() {
	if (!hub.subscribers.size) {
		if (hub.closeTimer) return;
		hub.closeTimer = setTimeout(() => {
			hub.closeTimer = null;
			if (hub.subscribers.size) return;
			closeStream(hub.pending);
			closeStream(hub.current);
			hub.pending = null;
			hub.current = null;
		}, IDLE_CLOSE_MS);
		return;
	}

	if (hub.closeTimer) {
		clearTimeout(hub.closeTimer);
		hub.closeTimer = null;
	}

	const union = hubUnion();
	// Only a GROWING union needs a new connection; a stream carrying a few
	// topics nobody listens to any more is harmless (filtered client-side)
	// and cheaper than reconnecting.
	if (covers(hub.current, union) || covers(hub.pending, union)) return;

	closeStream(hub.pending);
	const next = openStream(union);
	if (hub.current) {
		hub.pending = next;
	} else {
		hub.current = next;
	}
}

function subscribePublic(topics: string[], subscriber: Subscriber) {
	const entry: HubSubscriber = {
		...subscriber,
		topics: new Set(topics),
		caughtUp: false,
	};
	hub.subscribers.add(entry);
	scheduleHubSync();

	let disposed = false;
	return () => {
		if (disposed) return;
		disposed = true;
		hub.subscribers.delete(entry);
		scheduleHubSync();
	};
}

/* ------------------------------------------------------------------------
 * Authenticated (admin / customer) topics: one EventSource per exact topics
 * string, shared by every subscriber to it.
 * --------------------------------------------------------------------- */

type Channel = {
	onError: () => void;
	onMessage: () => void;
	onReady: () => void;
	source: EventSource;
	subscribers: Set<Subscriber>;
};

const channels = new Map<string, Channel>();

function subscribeChannel(topicsQuery: string, subscriber: Subscriber) {
	let channel = channels.get(topicsQuery);

	if (!channel) {
		const source = new EventSource(`/api/realtime?topics=${topicsQuery}`);
		const subscribers = new Set<Subscriber>();
		const notifySubscribers = () => {
			const refreshScope = {};
			for (const entry of subscribers) entry.onMessage(refreshScope);
		};
		const createdChannel: Channel = {
			onError: () => {
				for (const entry of subscribers) entry.onError?.(INTERRUPTED_MESSAGE);
			},
			onMessage: notifySubscribers,
			// PostgreSQL NOTIFY is intentionally ephemeral. Refetch after an
			// authenticated LISTEN becomes ready so neither the initial fetch-to-
			// LISTEN race nor an outage can leave the UI stale. An unavailable
			// retry frame deliberately does not trigger this callback.
			onReady: notifySubscribers,
			source,
			subscribers,
		};

		source.addEventListener("error", createdChannel.onError);
		source.addEventListener("message", createdChannel.onMessage);
		source.addEventListener("ready", createdChannel.onReady);

		channel = createdChannel;
		channels.set(topicsQuery, channel);
	}

	const current = channel;
	current.subscribers.add(subscriber);
	let disposed = false;

	return () => {
		if (disposed) return;
		disposed = true;
		current.subscribers.delete(subscriber);

		if (current.subscribers.size === 0) {
			current.source.removeEventListener("error", current.onError);
			current.source.removeEventListener("message", current.onMessage);
			current.source.removeEventListener("ready", current.onReady);
			current.source.close();
			if (channels.get(topicsQuery) === current) {
				channels.delete(topicsQuery);
			}
		}
	};
}

/**
 * Subscribes to server-sent change notifications for the given topics
 * (comma-separated, optionally URI-encoded). `onMessage` fires when a
 * relevant change is published - and once when the stream first becomes
 * ready, so callers re-read anything that changed before LISTEN was live.
 * Returns an unsubscribe function.
 */
export function subscribeRealtime(
	topicsQuery: string,
	onMessage: (refreshScope: object) => void,
	onError?: (message: string) => void,
) {
	const topics = parseTopics(topicsQuery);
	const subscriber = { onError, onMessage };

	if (topics.length && topics.every((topic) => PUBLIC_TOPICS.has(topic))) {
		return subscribePublic(topics, subscriber);
	}
	return subscribeChannel(topicsQuery, subscriber);
}
