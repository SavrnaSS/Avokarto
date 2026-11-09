"use client";

import DataBoundary from "@/components/common/loading/DataBoundary";

// The admin's own error state (it no longer shares the storefront's root).
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="px-6 py-10">
      <DataBoundary error="This page failed to load." loading={false} onRetry={reset} ready={false}>
        {null}
      </DataBoundary>
    </main>
  );
}
