"use client";

import { useLiveResource } from "@/hooks/use-live-resource";

export function useRealtimeResource<T>({
  endpoint,
  fallbackData,
  topics,
}: {
  endpoint: string;
  fallbackData: T;
  topics: string[];
}) {
  // Consumers gate fallback shapes behind hasData; they are never presented as live records.
  return useLiveResource({ endpoint, initialData: fallbackData, topics });
}
