import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveCouponsPanel } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";

export default function CouponsPage() {
	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addCoupon}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Coupon
					</Link>
				}
				description="Manage discount codes, usage limits, validity windows, and campaign status."
				eyebrow="Marketing"
				title="Coupons"
			/>
			<LiveCouponsPanel initialCoupons={[]} />
		</>
	);
}
