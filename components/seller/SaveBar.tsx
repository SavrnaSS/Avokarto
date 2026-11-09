"use client";

import { Check } from "lucide-react";
import styles from "./seller.module.css";

/**
 * Sticky footer for a settings form: quiet "all saved" line when clean,
 * pinned to the bottom of the screen with Discard / Save while there are
 * unsaved changes (sticky inside its own form, so two forms never overlap).
 */
export default function SaveBar({ dirty, label, onDiscard, saving }: { dirty: boolean; label: string; onDiscard: () => void; saving: boolean }) {
	return (
		<div className={styles.saveBar} data-dirty={dirty || undefined}>
			<p className={styles.saveBarText} role="status">
				{dirty ? <><span aria-hidden="true" className={styles.saveBarDot} /> Unsaved changes</> : <><Check aria-hidden="true" size={14} /> All changes saved</>}
			</p>
			{dirty ? (
				<button className={`${styles.ghost} ${styles.btnSm}`} disabled={saving} onClick={onDiscard} type="button">Discard</button>
			) : null}
			<button className={`${styles.btn} ${styles.btnSm}`} disabled={!dirty || saving} type="submit">
				{saving ? "Saving…" : label}
			</button>
		</div>
	);
}
