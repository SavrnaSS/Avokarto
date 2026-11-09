import type { Metadata } from "next";
import { PageHeader } from "@/admin/components/layout/page-header";
import { ResellerPayoutsPanel } from "@/admin/components/resellers/reseller-admin";

export const metadata: Metadata = {
	title: "Reseller Payouts",
};

export default function ResellerPayoutsPage() {
	return (
		<>
			<PageHeader
				description="Transfer each request to the seller's UPI or bank account, then mark it paid with the transfer reference."
				eyebrow="Marketplace"
				title="Reseller Payouts"
			/>
			<ResellerPayoutsPanel />
		</>
	);
}
