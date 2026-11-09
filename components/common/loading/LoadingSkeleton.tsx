import styles from "./LoadingSkeleton.module.css";

export type LoadingLayout =
  | "products"
  // One swipeable row, sized like the home/product Swiper carousels
  // (1.8 cards per view, 2.8 from 768px, 4 from 1200px, 24px gaps).
  | "carousel"
  | "categories"
  | "categoryTiles"
  | "detail"
  | "table"
  | "dashboard"
  | "page";

export default function LoadingSkeleton({
  layout = "products",
  count = 4,
  label = "Loading content",
}: {
  layout?: LoadingLayout;
  count?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={styles.root}>
      <span className={styles.srOnly}>{label}</span>
      <div aria-hidden="true" className={styles[layout]}>
        {Array.from({ length: count }, (_, index) => (
          <div className={styles.item} key={index}>
            <div className={`${styles.block} ${styles.media}`} />
            <div className={`${styles.block} ${styles.line}`} />
            <div className={`${styles.block} ${styles.short}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoading({ admin = false, detail = false }: { admin?: boolean; detail?: boolean }) {
  return (
    <div className={`${styles.pageWrap} ${admin ? styles.admin : ""}`}>
      <LoadingSkeleton layout="page" count={1} label="Loading page" />
      <LoadingSkeleton
        layout={admin ? "dashboard" : detail ? "detail" : "products"}
        count={admin ? 4 : detail ? 2 : 4}
      />
      {admin && <LoadingSkeleton layout="table" count={6} label="Loading records" />}
    </div>
  );
}
