import { PageLoading } from "@/components/common/loading/LoadingSkeleton";

// Opt-in fallback: root loading.tsx flushes 200 before product existence is known.
export default function GlobalRouteLoading() {
  return <PageLoading />;
}
