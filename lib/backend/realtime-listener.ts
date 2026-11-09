import { createRealtimeClient } from "@/lib/backend/db";

type DatabaseNotification = {
	payload?: string;
};

type RealtimeSubscriber = {
	onError: (error: Error) => void;
	onNotification: (message: DatabaseNotification) => void;
};

type RealtimeClient = ReturnType<typeof createRealtimeClient>;

type RealtimeListenerState = {
	client?: RealtimeClient;
	closeTimer?: ReturnType<typeof setTimeout>;
	connecting?: Promise<void>;
	subscribers: Set<RealtimeSubscriber>;
};

type RealtimeRuntime = typeof globalThis & {
	__unimartRealtimeListener?: RealtimeListenerState;
};

const IDLE_CLOSE_DELAY_MS = 5_000;
const realtimeRuntime = globalThis as RealtimeRuntime;
const state =
	realtimeRuntime.__unimartRealtimeListener ??
	({ subscribers: new Set() } satisfies RealtimeListenerState);

realtimeRuntime.__unimartRealtimeListener = state;

function cancelScheduledClose() {
	if (!state.closeTimer) return;
	clearTimeout(state.closeTimer);
	state.closeTimer = undefined;
}

function endClient(client: RealtimeClient) {
	client.removeAllListeners("notification");
	void client
		.end()
		.catch(() => undefined)
		.finally(() => client.removeAllListeners());
}

function scheduleCloseWhenIdle() {
	if (state.subscribers.size || state.closeTimer) return;

	state.closeTimer = setTimeout(() => {
		state.closeTimer = undefined;
		if (state.subscribers.size || !state.client) return;

		const client = state.client;
		state.client = undefined;
		endClient(client);
	}, IDLE_CLOSE_DELAY_MS);
}

function notifyConnectionError(error: Error) {
	for (const subscriber of [...state.subscribers]) {
		try {
			subscriber.onError(error);
		} catch {
			// One broken response stream must not prevent the remaining streams
			// from learning that their shared database connection was lost.
		}
	}
}

async function connectListener() {
	const client = createRealtimeClient();
	let setupError: Error | undefined;
	const onSetupError = (error: Error) => {
		setupError = error;
	};

	client.on("error", onSetupError);

	try {
		await client.connect();
		if (setupError) throw setupError;
		await client.query("LISTEN unimart_realtime");
		if (setupError) throw setupError;

		const onNotification = (message: DatabaseNotification) => {
			for (const subscriber of [...state.subscribers]) {
				try {
					subscriber.onNotification(message);
				} catch {
					// A response may have closed between the subscriber snapshot and
					// this callback. Its own teardown removes it from the next event.
				}
			}
		};
		const onClientError = (error: Error) => {
			if (state.client !== client) return;

			state.client = undefined;
			endClient(client);
			notifyConnectionError(error);
		};

		client.removeListener("error", onSetupError);
		client.on("notification", onNotification);
		client.on("error", onClientError);
		state.client = client;
	} catch (error) {
		await client.end().catch(() => undefined);
		client.removeListener("error", onSetupError);
		throw setupError ?? error;
	}
}

function ensureListener() {
	if (state.client) return Promise.resolve();
	if (state.connecting) return state.connecting;

	const connecting = connectListener();
	state.connecting = connecting;
	void connecting.then(
		() => {
			if (state.connecting === connecting) state.connecting = undefined;
			if (!state.subscribers.size) scheduleCloseWhenIdle();
		},
		() => {
			if (state.connecting === connecting) state.connecting = undefined;
		},
	);

	return connecting;
}

/**
 * Shares one PostgreSQL LISTEN session across every SSE response in this Node
 * process. A browser stream only adds an in-memory subscriber; it no longer
 * consumes another database session from a small hosted pool.
 */
export async function subscribeDatabaseNotifications(
	onNotification: (message: DatabaseNotification) => void,
	onError: (error: Error) => void,
) {
	cancelScheduledClose();

	const subscriber = { onError, onNotification };
	state.subscribers.add(subscriber);

	try {
		await ensureListener();
	} catch (error) {
		state.subscribers.delete(subscriber);
		throw error;
	}

	let subscribed = true;

	return () => {
		if (!subscribed) return;
		subscribed = false;
		state.subscribers.delete(subscriber);
		scheduleCloseWhenIdle();
	};
}
