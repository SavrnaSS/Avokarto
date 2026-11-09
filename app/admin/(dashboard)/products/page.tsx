import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveProductsTable } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";

export const metadata: Metadata = {
	title: "Products",
};

export default function ProductsPage() {
	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addProduct}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Product
					</Link>
				}
				description="Manage catalog items, stock, pricing, and publish state."
				eyebrow="Catalog"
				title="Products"
			/>
			<LiveProductsTable initialProducts={[]} />
		</>
	);
}
