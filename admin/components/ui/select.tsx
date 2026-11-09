"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type * as React from "react";
import { cn } from "@/admin/utils/cn";

function Select({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
	return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
	return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
	return (
		<SelectPrimitive.Trigger
			className={cn(
				"flex w-full items-center justify-between gap-2 rounded-base border border-surface-line bg-surface-body px-3 text-ink-700 shadow-card outline-none transition-colors",
				"focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/20",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"data-[placeholder]:text-ink-400 [&_[data-placeholder]]:text-ink-400 [&>span]:line-clamp-1",
				className,
			)}
			data-slot="select-trigger"
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDown className="size-4 shrink-0 text-ink-500" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			className={cn(
				"flex cursor-default items-center justify-center py-1 text-ink-500",
				className,
			)}
			data-slot="select-scroll-up-button"
			{...props}
		>
			<ChevronUp className="size-4" />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			className={cn(
				"flex cursor-default items-center justify-center py-1 text-ink-500",
				className,
			)}
			data-slot="select-scroll-down-button"
			{...props}
		>
			<ChevronDown className="size-4" />
		</SelectPrimitive.ScrollDownButton>
	);
}

function SelectContent({
	className,
	children,
	position = "popper",
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				className={cn(
					"relative z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-base border border-surface-line bg-surface-card text-ink-700 shadow-lift",
					position === "popper" &&
						"data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
					className,
				)}
				data-slot="select-content"
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					className={cn(
						"p-1",
						position === "popper" &&
							"h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1",
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			className={cn("px-2 py-1.5 text-[12px] font-semibold text-ink-400", className)}
			data-slot="select-label"
			{...props}
		/>
	);
}

function SelectItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			className={cn(
				"relative flex w-full cursor-default select-none items-center rounded-base py-2 pl-2 pr-8 text-[14px] text-ink-700 outline-none",
				"focus:bg-surface-muted data-[highlighted]:bg-surface-muted",
				"data-[state=checked]:bg-surface-muted data-[state=checked]:font-semibold data-[state=checked]:text-ink-900",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			data-slot="select-item"
			{...props}
		>
			<span className="absolute right-2 flex size-4 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<Check className="size-4 text-brand-600" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			className={cn("-mx-1 my-1 h-px bg-surface-line", className)}
			data-slot="select-separator"
			{...props}
		/>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
