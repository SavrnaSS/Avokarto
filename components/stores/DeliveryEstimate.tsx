"use client";

import { CalendarClock } from "lucide-react";
import { useShippingMethods, type ShippingMethod } from "@/hooks/use-shipping-methods";
import styles from "./storefront.module.css";

const etaDate = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

/** "5-7 days" / "3 days" from the shipping method's estimate, as [min, max] days. */
export function etaDays(method: ShippingMethod): [number, number] | null {
	return daysFromEstimate(method.deliveryEstimate);
}

/** "5-7 days" / "3 days" as [min, max] days; null if it doesn't say. */
export function daysFromEstimate(text: string): [number, number] | null {
	const match = /(\d+)\s*(?:-\s*(\d+))?\s*day/i.exec(text);
	if (!match) return null;
	const min = Number(match[1]);
	return [min, match[2] ? Number(match[2]) : min];
}

/** The arrival window as dates, counted from `from` (default: now). */
export function etaRange([min, max]: [number, number], from = Date.now()) {
	const day = (offset: number) => new Date(from + offset * 86_400_000);
	// formatRange shortens same-month ranges: "Oct 26 – 28".
	return min === max ? etaDate.format(day(min)) : etaDate.formatRange(day(min), day(max));
}

/**
 * When it would arrive, from the live shipping methods: the method checkout
 * picks by default, plus the fastest one if it's quicker. Hidden until the
 * methods load (or if they can't), so it never shows a made-up date.
 */
export default function DeliveryEstimate({ compact = false }: { compact?: boolean }) {
	const { methods } = useShippingMethods();
	const timed = methods.map((method) => ({ days: etaDays(method), method })).filter((entry): entry is { days: [number, number]; method: ShippingMethod } => Boolean(entry.days));
	if (!timed.length) return null;
	const standard = timed[0];
	const fastest = timed.reduce((best, entry) => (entry.days[1] < best.days[1] ? entry : best), standard);
	if (compact) {
		return (
			<p className={styles.etaLine}>
				<CalendarClock aria-hidden="true" size={15} /> Arrives <strong>{etaRange(standard.days)}</strong> with {standard.method.name}
			</p>
		);
	}
	return (
		<div className={styles.eta}>
			<CalendarClock aria-hidden="true" size={18} />
			<div>
				<p>
					Arrives <strong>{etaRange(standard.days)}</strong> <span className={styles.etaMethod}>with {standard.method.name}</span>
				</p>
				{fastest !== standard ? (
					<p className={styles.etaFast}>
						Need it sooner? {fastest.method.name} arrives <strong>{etaRange(fastest.days)}</strong>
					</p>
				) : null}
			</div>
		</div>
	);
}
