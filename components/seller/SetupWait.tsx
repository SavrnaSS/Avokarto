import { LoaderCircle } from "lucide-react";
import styles from "./setup-status.module.css";

type SetupWaitProps = {
  kind: "account" | "studio";
  storeName?: string;
};

/**
 * A real pending state: the spinner runs only while the request is in flight.
 * In the builder, the outline of the first step holds its place, so the form
 * arrives without the page jumping.
 */
export default function SetupWait({ kind, storeName }: SetupWaitProps) {
  const isAccount = kind === "account";
  const title = isAccount ? "Creating your account" : "Preparing your studio";
  const store = storeName?.trim();

  return (
    <section aria-busy="true" aria-label={title} className={styles.wait} data-kind={kind}>
      <div aria-atomic="true" aria-live="polite" className={styles.status} role="status">
        <span aria-hidden="true" className={styles.icon}><LoaderCircle size={18} /></span>
        <span className={styles.text}>
          <strong>{title}</strong>
          <small>
            {isAccount
              ? `We’re securely creating your account so you can continue setting up ${store || "your store"}.`
              : "We’re checking your account and loading your saved store details."}
          </small>
        </span>
      </div>
      {isAccount ? null : (
        <div aria-hidden="true" className={styles.outline}>
          <span className={styles.label} />
          <span className={styles.field} data-size="large" />
          <span className={styles.chips}><i /><i /><i /></span>
          <span className={styles.label} />
          <span className={styles.field} />
        </div>
      )}
    </section>
  );
}
