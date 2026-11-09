"use client";

import { useState } from "react";
import { Icon } from "@/admin/components/layout/icon";
import type { AdminProductFaq } from "@/lib/backend/admin-data";

type FaqRow = AdminProductFaq & { id: string };

function randomId() {
	return typeof crypto.randomUUID === "function"
		? crypto.randomUUID()
		: `faq-${Math.random().toString(36).slice(2)}`;
}

/**
 * Lets an admin manage the real FAQ entries shown on the product page's
 * Questions tab - previously a fixed, site-wide FAQ list with no per-product
 * control at all. Same repeatable-rows + hidden-JSON-input pattern as
 * color-variants-field.tsx.
 */
export function FaqsField({
	initialFaqs,
}: {
	initialFaqs: AdminProductFaq[];
}) {
	const [rows, setRows] = useState<FaqRow[]>(() =>
		initialFaqs.map((faq) => ({ ...faq, id: randomId() })),
	);

	function updateRow(id: string, patch: Partial<AdminProductFaq>) {
		setRows((current) =>
			current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		);
	}

	function addRow() {
		setRows((current) => [...current, { answer: "", id: randomId(), question: "" }]);
	}

	function removeRow(id: string) {
		setRows((current) => current.filter((row) => row.id !== id));
	}

	return (
		<article className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card">
			<h2 className="mb-1 text-[16px] font-semibold text-ink-900">
				Product Questions
			</h2>
			<p className="mb-4 text-[12px] text-ink-400">
				Shown as a real FAQ accordion on the product page&apos;s Questions
				tab. A question needs both text and an answer to be saved.
			</p>
			<div className="space-y-4">
				{rows.map((row) => (
					<div
						className="rounded-base border border-surface-line p-3"
						key={row.id}
					>
						<div className="flex items-start gap-3">
							<div className="flex-1 space-y-2">
								<input
									className="h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] placeholder:text-ink-400 focus:border-brand-600"
									onChange={(event) =>
										updateRow(row.id, { question: event.target.value })
									}
									placeholder="Question, e.g. How do I choose the right size?"
									value={row.question}
								/>
								<textarea
									className="min-h-[72px] w-full resize-y rounded-base border border-surface-line bg-surface-body px-3 py-2 text-[14px] placeholder:text-ink-400 focus:border-brand-600"
									onChange={(event) =>
										updateRow(row.id, { answer: event.target.value })
									}
									placeholder="Answer"
									rows={2}
									value={row.answer}
								/>
							</div>
							<button
								aria-label="Remove question"
								className="grid h-10 w-10 shrink-0 place-items-center rounded-base text-danger-500 hover:bg-danger-50"
								onClick={() => removeRow(row.id)}
								type="button"
							>
								<Icon className="h-3.5 w-3.5" name="trash-2" />
							</button>
						</div>
					</div>
				))}
			</div>
			<button
				className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-base border border-surface-line px-3 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted"
				onClick={addRow}
				type="button"
			>
				<Icon className="h-3.5 w-3.5" name="plus" />
				Add Question
			</button>
			<input
				name="faqs"
				type="hidden"
				value={JSON.stringify(
					rows.map(({ answer, question }) => ({ answer, question })),
				)}
			/>
		</article>
	);
}
