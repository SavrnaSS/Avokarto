"use client";

import { useEffect, useRef } from "react";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";

// Auto-loads the next batch of products as the sentinel scrolls into view -
// no click required. `onIntersect` decides whether that means revealing
// products already fetched or asking the caller to fetch more from the
// backend (see ShopDefault's usage), so this component only owns the
// observing + loading/done UI, not the data itself.
export default function InfiniteScrollTrigger({
  onIntersect,
  loading = false,
  done = false,
  skeletonCount = 3,
  itemCount = 0,
}: {
  onIntersect: () => void;
  loading?: boolean;
  done?: boolean;
  skeletonCount?: number;
  itemCount?: number;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (done) return;
    const node = sentinelRef.current;
    if (!node) return;

    // Guards against the observer firing again before React has re-rendered
    // with the updated `loading` prop, which would otherwise double-trigger
    // a batch reveal or a duplicate backend fetch on a single scroll.
    let busy = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || busy || loading) return;
        busy = true;
        onIntersectRef.current();
        requestAnimationFrame(() => {
          busy = false;
        });
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  // A short batch can leave the sentinel inside the viewport. Reobserve
  // after revealing products so another intersection can advance the list.
  }, [done, loading, itemCount]);

  if (done) {
    return (
      <p className="text-center rbt-text-color-body mb--0">
        You&apos;ve reached the end of the catalog.
      </p>
    );
  }

  return (
    <div ref={sentinelRef} style={{ minHeight: 1 }}>
      {loading && (
        <LoadingSkeleton
          layout="products"
          count={skeletonCount}
          label="Loading more products"
        />
      )}
    </div>
  );
}
