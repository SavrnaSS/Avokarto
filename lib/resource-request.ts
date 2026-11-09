export type ResourceRequestOptions = {
  signal: AbortSignal;
  retryAttempts?: 0 | 1 | 2;
  deduplicate?: boolean;
  refreshScope?: object;
};

class ResourceError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
  }
}

function abortReason(signal: AbortSignal) {
  return signal.reason ?? new DOMException("Request cancelled.", "AbortError");
}

function retryDelay(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(abortReason(signal));
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortReason(signal));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delay);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchResource(endpoint: string, signal: AbortSignal, retries: number): Promise<unknown> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal.aborted) throw abortReason(signal);
    const controller = new AbortController();
    const cancel = () => controller.abort(abortReason(signal));
    signal.addEventListener("abort", cancel, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20000);

    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as {
        data?: unknown;
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        throw new ResourceError(
          payload?.error?.message ?? "Unable to load data.",
          response.status === 408 || response.status === 429 || response.status >= 500,
        );
      }
      if (timedOut) throw new ResourceError("The request took too long. Please try again.", true);
      if (signal.aborted) throw abortReason(signal);
      if (payload?.data === undefined) {
        throw new ResourceError("The server returned an incomplete response.", false);
      }
      return payload.data;
    } catch (error) {
      if (signal.aborted) throw abortReason(signal);
      const failure = timedOut
        ? new ResourceError("The request took too long. Please try again.", true)
        : error;
      if (attempt === retries || (failure instanceof ResourceError && !failure.retryable)) throw failure;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
    }
    await retryDelay(500 * 2 ** attempt, signal);
  }
  throw new Error("Unable to load data.");
}

type InFlightRequest = {
  controller: AbortController;
  promise: Promise<unknown>;
  refreshScope?: object;
  subscribers: number;
  settled: boolean;
};

const requests = new Map<string, InFlightRequest>();

export function requestResource<T>(endpoint: string, {
  signal,
  retryAttempts = 0,
  deduplicate = false,
  refreshScope,
}: ResourceRequestOptions): Promise<T> {
  if (signal.aborted) return Promise.reject(abortReason(signal));
  if (!deduplicate) return fetchResource(endpoint, signal, retryAttempts) as Promise<T>;

  // Share pending reads only from the same freshness scope. A realtime event
  // starts a new scope, never reusing a read started before that change.
  // Settled prices and inventory are never cached here.
  const key = `${retryAttempts}:${endpoint}`;
  let entry = requests.get(key);
  if (!entry || entry.refreshScope !== refreshScope) {
    const controller = new AbortController();
    entry = {
      controller,
      promise: fetchResource(endpoint, controller.signal, retryAttempts),
      refreshScope,
      subscribers: 0,
      settled: false,
    };
    const current = entry;
    const cleanup = () => {
      current.settled = true;
      if (requests.get(key) === current) requests.delete(key);
    };
    void current.promise.then(cleanup, cleanup);
    requests.set(key, current);
  }

  const current = entry;
  current.subscribers++;
  return new Promise<T>((resolve, reject) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      signal.removeEventListener("abort", onAbort);
      current.subscribers--;
      if (!current.subscribers && !current.settled) {
        if (requests.get(key) === current) requests.delete(key);
        current.controller.abort();
      }
    };
    const onAbort = () => {
      release();
      reject(abortReason(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
    void current.promise.then((data) => {
      if (released) return;
      release();
      resolve(data as T);
    }, (error) => {
      if (released) return;
      release();
      reject(error);
    });
  });
}
