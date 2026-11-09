"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useStoreSite } from "@/components/stores/storeSite";
import styles from "@/components/stores/storefront.module.css";

// A product or page that isn't in this store: stay inside the store's own
// site and point back to its catalog. (A store that doesn't exist at all is
// handled by the layout, which falls back to Avokarto's not-found page.)
export default function StoreNotFound() {
  const site = useStoreSite();
  const home = site?.href() ?? "/";
  return (
    <div className={`${styles.container} ${styles.lostPage}`}>
      <p className={styles.lostCode}>404</p>
      <h1 className={styles.flowTitle}>This page isn&apos;t here</h1>
      <p className={styles.muted}>
        It may have sold out or moved{site ? ` - everything ${site.store.name} has right now is in the shop` : ""}.
      </p>
      <div className={styles.contactRow}>
        <Link className={styles.button} href={`${home}#shop`}>
          Browse the shop <ArrowRight size={18} />
        </Link>
        <Link className={styles.buttonGhost} href={`${home}#shop`} onClick={() => window.setTimeout(() => document.getElementById("store-search")?.focus(), 400)}>
          <Search size={18} /> Search
        </Link>
      </div>
    </div>
  );
}
