"use client";

import DataBoundary from "@/components/common/loading/DataBoundary";

export default function Error({ reset }: { reset: () => void }) {
  return <DataBoundary loading={false} error="Page failed to load" ready={false} onRetry={reset}>{null}</DataBoundary>;
}
