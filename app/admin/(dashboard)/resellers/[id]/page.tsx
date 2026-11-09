import type { Metadata } from "next";
import { PageHeader } from "@/admin/components/layout/page-header";
import { ResellerStoreDetail } from "@/admin/components/resellers/reseller-admin";

export const metadata: Metadata = {
	title: "Reseller Store",
};

export default async function ResellerStorePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return (
		<>
			<PageHeader
				description="Sales, earnings, products and payouts for this store."
				eyebrow="Marketplace"
				title="Reseller Store"
			/>
			<ResellerStoreDetail storeId={decodeURIComponent(id)} />
		</>
	);
}
