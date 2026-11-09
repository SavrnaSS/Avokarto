"use client";

import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/admin/components/ui/select";
import { cn } from "@/admin/utils/cn";

export type AppSelectOption = {
	label: string;
	value: string;
};

type AppSelectProps = {
	ariaLabel?: string;
	className?: string;
	defaultValue?: string;
	disabled?: boolean;
	id?: string;
	name?: string;
	onValueChange?: (value: string) => void;
	options: readonly AppSelectOption[] | readonly string[];
	placeholder?: string;
	size?: "default" | "lg" | "sm";
	triggerClassName?: string;
	value?: string;
};

const triggerSizes = {
	default: "h-10 text-[14px]",
	lg: "h-11 text-[14px]",
	sm: "h-8 py-1.5 text-[13px] font-semibold",
} as const;

function normalizeOptions(
	options: readonly AppSelectOption[] | readonly string[],
): AppSelectOption[] {
	return options.map((option) =>
		typeof option === "string" ? { label: option, value: option } : option,
	);
}

export function AppSelect({
	ariaLabel,
	className,
	defaultValue,
	disabled,
	id,
	name,
	onValueChange,
	options,
	placeholder,
	size = "default",
	triggerClassName,
	value,
}: AppSelectProps) {
	const items = normalizeOptions(options);
	const isControlled = value !== undefined;
	const [internalValue, setInternalValue] = useState<string | undefined>();
	const currentValue = isControlled ? value : (internalValue ?? defaultValue);

	function handleValueChange(nextValue: string) {
		if (!isControlled) {
			setInternalValue(nextValue);
		}

		onValueChange?.(nextValue);
	}

	return (
		<div className={cn(className)}>
			{name ? (
				<input name={name} type="hidden" value={currentValue ?? ""} />
			) : null}
			<Select
				disabled={disabled}
				onValueChange={handleValueChange}
				{...(currentValue !== undefined ? { value: currentValue } : {})}
			>
				<SelectTrigger
					aria-label={ariaLabel}
					className={cn(triggerSizes[size], triggerClassName)}
					id={id}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
