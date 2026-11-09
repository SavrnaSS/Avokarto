import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveAttributesTable } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";

export default function AttributesPage() {
	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addAttribute}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Attribute
					</Link>
				}
				description="Manage product options such as size, color, material, and weight."
				eyebrow="Catalog"
				title="Attributes"
			/>
			<LiveAttributesTable initialAttributes={[]} />
		</>
	);
}
