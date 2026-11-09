"use client";

import type { ReactNode } from "react";
import { Icon } from "@/admin/components/layout/icon";
import { AppSelect } from "@/admin/components/ui/app-select";
import type { AppSelectOption } from "@/admin/components/ui/app-select";
import {
	resolveSelectPlaceholder,
	sanitizeSelectOptions,
} from "@/admin/components/forms/select-field-utils";
import { cn } from "@/admin/utils/cn";

type CardProps = {
	children: ReactNode;
	title: string;
	titleEnd?: ReactNode;
};

export function FormCard({ children, title, titleEnd }: CardProps) {
	return (
		<article className="rounded-card border border-surface-line bg-surface-card p-5 shadow-card">
			{titleEnd ? (
				<div className="mb-4 flex items-center justify-between gap-2">
					<h2 className="text-[16px] font-semibold text-ink-900">{title}</h2>
					{titleEnd}
				</div>
			) : (
				<h2 className="mb-4 text-[16px] font-semibold text-ink-900">{title}</h2>
			)}
			{children}
		</article>
	);
}

type FieldProps = {
	className?: string;
	defaultValue?: string;
	help?: string;
	label: string;
	name: string;
	placeholder?: string;
	required?: boolean;
	type?: string;
};

export function Field({
	className,
	defaultValue,
	help,
	label,
	name,
	placeholder,
	required,
	type = "text",
}: FieldProps) {
	return (
		<label className={cn("block", className)}>
			<span className="text-[13px] font-semibold text-ink-700">
				{label} {required ? <span className="text-danger-500">*</span> : null}
			</span>
			<input
				className="mt-1.5 h-10 w-full rounded-base border border-surface-line bg-surface-body px-3 text-[14px] placeholder:text-ink-400 focus:border-brand-600"
				defaultValue={defaultValue}
				min={type === "number" ? "0" : undefined}
				name={name}
				placeholder={placeholder}
				required={required}
				step={type === "number" ? "1" : undefined}
				type={type}
			/>
			{help ? <p className="mt-1 text-[12px] text-ink-400">{help}</p> : null}
		</label>
	);
}

type SelectFieldProps = {
	defaultValue?: string;
	className?: string;
	help?: string;
	hideLabel?: boolean;
	label: string;
	name: string;
	onChange?: (value: string) => void;
	options: readonly AppSelectOption[] | readonly string[];
	placeholder?: string;
	required?: boolean;
	value?: string;
};

export function SelectField({
	defaultValue,
	className,
	help,
	hideLabel = false,
	label,
	name,
	onChange,
	options,
	placeholder,
	required,
	value,
}: SelectFieldProps) {
	const cleanedOptions = sanitizeSelectOptions(options);
	const resolvedPlaceholder = resolveSelectPlaceholder(
		label,
		placeholder,
		defaultValue,
		value,
	);

	return (
		<label className="block">
			{hideLabel ? null : (
				<span className="mb-2 block text-[13px] font-semibold text-ink-700">
					{label}{" "}
					{required ? <span className="text-danger-500">*</span> : null}
				</span>
			)}
			<AppSelect
				className={className}
				defaultValue={defaultValue}
				name={name}
				onValueChange={onChange}
				options={cleanedOptions}
				placeholder={resolvedPlaceholder}
				value={value}
			/>
			{help ? <p className="mt-1 text-[12px] text-ink-400">{help}</p> : null}
		</label>
	);
}

type TextAreaFieldProps = {
	className?: string;
	defaultValue?: string;
	help?: string;
	label: string;
	name: string;
	placeholder?: string;
	rows?: number;
};

export function TextAreaField({
	className,
	defaultValue,
	help,
	label,
	name,
	placeholder,
	rows = 3,
}: TextAreaFieldProps) {
	return (
		<label className={cn("block", className)}>
			<span className="text-[13px] font-semibold text-ink-700">{label}</span>
			<textarea
				className="mt-1.5 min-h-[92px] w-full resize-y rounded-base border border-surface-line bg-surface-body px-3 py-3 text-[14px] focus:border-brand-600"
				defaultValue={defaultValue}
				name={name}
				placeholder={placeholder}
				rows={rows}
			/>
			{help ? <p className="mt-1 text-[12px] text-ink-400">{help}</p> : null}
		</label>
	);
}

type RichTextAreaProps = {
	defaultValue?: string;
	help: string;
	label: string;
	name: string;
};

export function RichTextArea({
	defaultValue,
	help,
	label,
	name,
}: RichTextAreaProps) {
	return (
		<div>
			<span className="text-[13px] font-semibold text-ink-700">{label}</span>
			<div className="mt-1.5 rounded-base border border-surface-line bg-surface-body">
				<div className="flex flex-wrap items-center gap-1 border-b border-surface-line px-3 py-2">
					<AppSelect
						className="w-[132px]"
						defaultValue="Normal"
						options={["Normal", "Heading 1", "Heading 2"]}
						size="sm"
					/>
					<div className="mx-1 h-5 w-px bg-surface-line" />
					{["B", "I", "U"].map((item) => (
						<button
							className={cn(
								"rounded px-2 py-1 text-[13px] text-ink-600 hover:bg-surface-muted",
								item === "B" ? "font-bold" : "",
								item === "I" ? "italic" : "",
								item === "U" ? "underline" : "",
							)}
							key={item}
							type="button"
						>
							{item}
						</button>
					))}
					<div className="mx-1 h-5 w-px bg-surface-line" />
					<button
						aria-label="Insert image"
						className="rounded px-2 py-1 hover:bg-surface-muted"
						type="button"
					>
						<Icon className="h-3.5 w-3.5 text-ink-600" name="image" />
					</button>
					<button
						aria-label="Insert code snippet"
						className="rounded px-2 py-1 hover:bg-surface-muted"
						type="button"
					>
						<Icon className="h-3.5 w-3.5 text-ink-600" name="code" />
					</button>
				</div>
				<textarea
					className="min-h-[132px] w-full resize-y bg-transparent px-3 py-3 text-[14px] text-ink-700 placeholder:text-ink-400 focus:outline-none"
					defaultValue={defaultValue}
					name={name}
					placeholder="Type your text here..."
					rows={4}
				/>
			</div>
			<p className="mt-1 text-[12px] text-ink-400">{help}</p>
		</div>
	);
}

type FormGuideProps = {
	onClose: () => void;
};

export function FormGuideDrawer({ onClose }: FormGuideProps) {
	return (
		<div
			aria-modal="true"
			className="fixed inset-0 z-50 flex justify-end"
			role="dialog"
		>
			<button
				aria-label="Close form guide"
				className="absolute inset-0 bg-ink-900/45"
				onClick={onClose}
				type="button"
			/>
			<aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-surface-card shadow-lift">
				<div className="flex items-start justify-between gap-4 border-b border-surface-line px-5 py-4">
					<div>
						<p className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
							Form Guide
						</p>
						<h2 className="mt-1 text-[18px] font-semibold text-ink-900">
							Compact editing checklist
						</h2>
						<p className="mt-1 text-[13px] text-ink-500">
							Use the sections to finish only the catalog details you are
							working on.
						</p>
					</div>
					<button
						aria-label="Close form guide"
						className="grid h-9 w-9 shrink-0 place-items-center rounded-base border border-surface-line text-ink-500 hover:bg-surface-muted hover:text-ink-900"
						onClick={onClose}
						type="button"
					>
						<Icon className="h-4 w-4" name="x" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto px-5 py-5">
					<div className="space-y-4">
						{[
							"Required name and slug fields are filled.",
							"Images match the storefront thumbnail.",
							"SEO, status, and assignment rules are reviewed before saving.",
						].map((item) => (
							<p
								className="flex gap-2 rounded-base border border-surface-line p-4 text-[13px] text-ink-500"
								key={item}
							>
								<Icon
									className="mt-0.5 h-4 w-4 shrink-0 text-success-500"
									name="check"
								/>
								{item}
							</p>
						))}
					</div>
				</div>
			</aside>
		</div>
	);
}
