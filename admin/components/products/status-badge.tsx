import { cn } from "@/admin/utils/cn";

type StatusBadgeProps = {
	className?: string;
	label: string;
};

export function StatusBadge({ className, label }: StatusBadgeProps) {
	return <span className={cn("badge", className)}>{label}</span>;
}
