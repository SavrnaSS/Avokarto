"use client";

import { useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { GenerateReviewsModal } from "@/admin/components/products/generate-reviews-modal";

export function GenerateReviewsButton() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
				onClick={() => setOpen(true)}
				type="button"
			>
				<Icon className="h-4 w-4" name="sparkles" />
				Generate Reviews
			</button>
			{open ? <GenerateReviewsModal onClose={() => setOpen(false)} /> : null}
		</>
	);
}
