"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime-channel";
import { requestResource, type ResourceRequestOptions } from "@/lib/resource-request";

type ResourceState<T> = {
  endpoint: string | null;
  dataKey: string | null;
  data: T;
  hasData: boolean;
  pending: boolean;
  error: string | null;
};

export function useLiveResource<T>({
  endpoint,
  initialData,
  initialDataReady = false,
  topics = [],
  retryAttempts = 0,
  deduplicate = false,
  dataKey = endpoint,
  loader = requestResource<T>,
}: {
  endpoint: string | null;
  initialData: T;
  // Server-fetched data is already renderable; ordinary callers still start pending.
  initialDataReady?: boolean;
  topics?: string[];
  retryAttempts?: 0 | 1 | 2;
  deduplicate?: boolean;
  // Pagination can retain the current result set while another page loads.
  // A different filter/search key always starts without the old data.
  dataKey?: string | null;
  loader?: (endpoint: string, options: ResourceRequestOptions) => Promise<T>;
}) {
  const [state, setState] = useState<ResourceState<T>>({
    endpoint,
    dataKey,
    data: initialData,
    hasData: initialDataReady,
    pending: true,
    error: null,
  });
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const topicKey = topics.join(",");

  const loadResource = useCallback(async (shareRequest: boolean, refreshScope?: object) => {
    if (!endpoint) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setState((previous) => ({
      ...previous,
      endpoint,
      dataKey,
      hasData: previous.dataKey === dataKey && previous.hasData,
      pending: true,
      error: null,
    }));

    try {
      const data = await loader(endpoint, {
        signal: controller.signal,
        retryAttempts,
        deduplicate: deduplicate && shareRequest,
        refreshScope,
      });
      if (requestRef.current !== controller) return;
      setState({ endpoint, dataKey, data, hasData: true, pending: false, error: null });
    } catch (error) {
      if (requestRef.current !== controller) return;
      setState((previous) => ({
        ...previous,
        pending: false,
        error: controller.signal.aborted
          ? "The request took too long. Please try again."
          : error instanceof Error ? error.message : "Unable to load data.",
      }));
    }
  }, [endpoint, dataKey, loader, retryAttempts, deduplicate]);

  // Explicit/realtime refreshes must start after the change, not reuse an older read.
  const refresh = useCallback(() => loadResource(false), [loadResource]);
  const realtimeLoadRef = useRef(loadResource);
  useEffect(() => {
    realtimeLoadRef.current = loadResource;
  }, [loadResource]);

  useEffect(() => {
    void loadResource(true);
    return () => {
      const controller = requestRef.current;
      requestRef.current = null;
      controller?.abort();
    };
  }, [loadResource]);

  const enabled = Boolean(endpoint);
  useEffect(() => {
    if (!enabled || !topicKey) return;
    return subscribeRealtime(encodeURIComponent(topicKey), (refreshScope) => {
      setLastEventAt(new Date());
      void realtimeLoadRef.current(true, refreshScope);
    });
  }, [enabled, topicKey]);

  useEffect(() => {
    if (!endpoint || !retryAttempts || !state.error) return;
    const retryOnReturn = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    };
    window.addEventListener("online", retryOnReturn);
    document.addEventListener("visibilitychange", retryOnReturn);
    return () => {
      window.removeEventListener("online", retryOnReturn);
      document.removeEventListener("visibilitychange", retryOnReturn);
    };
  }, [endpoint, retryAttempts, state.error, refresh]);

  const current = state.endpoint === endpoint;
  const hasCurrentData = state.dataKey === dataKey && state.hasData;
  return {
    data: hasCurrentData ? state.data : initialData,
    error: current ? state.error : null,
    hasData: !endpoint || hasCurrentData,
    loading: Boolean(endpoint) && !hasCurrentData && (!current || state.pending),
    refreshing: Boolean(endpoint) && hasCurrentData && (!current || state.pending),
    lastEventAt,
    refresh,
  };
}
