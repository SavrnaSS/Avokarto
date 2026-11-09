"use client";

import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import LoadingSkeleton, { type LoadingLayout } from "./LoadingSkeleton";
import styles from "./LoadingSkeleton.module.css";

export default function DataBoundary({
  loading, error, ready, empty = false, onRetry, children, skeleton,
  layout = "products", count = 4, label = "Loading content", emptyMessage = "Nothing to display yet.",
}: {
  // Custom placeholder that mirrors the section's real layout (used instead
  // of the generic skeleton so nothing shifts when content arrives).
  skeleton?: ReactNode;
  loading: boolean;
  error: string | null;
  ready: boolean;
  empty?: boolean;
  onRetry: () => void;
  children: ReactNode;
  layout?: LoadingLayout;
  count?: number;
  label?: string;
  emptyMessage?: string;
}) {
  if (loading) {
    return skeleton ? (
      <div role="status" aria-busy="true" aria-label={label}>{skeleton}</div>
    ) : (
      <LoadingSkeleton layout={layout} count={count} label={label} />
    );
  }
  if (!ready && error) return (
    <div className={styles.state} role="alert">
      <p>Unable to load this content. Please try again.</p>
      <button type="button" onClick={onRetry}><RotateCw size={16} aria-hidden="true" />Try again</button>
    </div>
  );
  if (!ready) return null;
  if (empty) return <div className={styles.state} role="status"><p>{emptyMessage}</p></div>;
  return children;
}
