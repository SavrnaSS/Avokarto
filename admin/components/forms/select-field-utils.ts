import type { AppSelectOption } from "@/admin/components/ui/app-select";

const FAKE_SELECT_OPTIONS = new Set([
	"Select an option",
	"Select category",
]);

export function sanitizeSelectOptions(
	options: readonly AppSelectOption[] | readonly string[],
): AppSelectOption[] {
	return options.flatMap((option) => {
		const label = typeof option === "string" ? option : option.label;
		if (FAKE_SELECT_OPTIONS.has(label)) return [];

		return [
			typeof option === "string" ? { label: option, value: option } : option,
		];
	});
}

export function resolveSelectPlaceholder(
	label: string,
	placeholder?: string,
	defaultValue?: string,
	value?: string,
) {
	if (placeholder) {
		return placeholder;
	}

	if (defaultValue !== undefined || value !== undefined) {
		return undefined;
	}

	const trimmed = label.trim();
	if (/^select\b/i.test(trimmed)) {
		return trimmed;
	}

	return `Select ${trimmed.toLowerCase()}`;
}
