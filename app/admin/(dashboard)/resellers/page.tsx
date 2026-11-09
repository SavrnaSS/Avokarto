import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { ResellersPanel } from "@/admin/components/resellers/reseller-admin";
import { routes } from "@/admin/config/routes";

export const metadata: Metadata = {
	title: "Reseller Stores",
};

export default function ResellersPage() {
	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.resellerPayouts}
					>
						<Icon className="h-4 w-4" name="receipt" />
						Payout queue
					</Link>
				}
				description="Customer-run stores reselling the catalog: live sales, earnings, moderation and marketplace rules."
				eyebrow="Marketplace"
				title="Reseller Stores"
			/>
			<ResellersPanel />
		</>
	);
}
