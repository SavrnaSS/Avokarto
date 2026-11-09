"use client";

import { useEffect, useRef, useState } from "react";

/** Eases a displayed number towards `target`; jumps straight there when motion is reduced. */
export function useCountUp(target: number, duration = 500) {
	const [value, setValue] = useState(target);
	const fromRef = useRef(target);
	useEffect(() => {
		const from = fromRef.current;
		if (from === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			fromRef.current = target;
			setValue(target);
			return;
		}
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			const next = from + (target - from) * (1 - (1 - t) ** 3);
			fromRef.current = next;
			setValue(next);
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, duration]);
	return value;
}
