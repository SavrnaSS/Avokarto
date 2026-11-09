import { notFound } from "next/navigation";
import { CouponForm } from "@/admin/components/coupons/coupon-form";
import { getAdminCouponByCode } from "@/lib/backend/admin-data";

export default async function EditCouponPage({
	params,
}: {
	params: Promise<{ code: string }>;
}) {
	const { code } = await params;
	const coupon = await getAdminCouponByCode(decodeURIComponent(code).toUpperCase());

	if (!coupon) {
		notFound();
	}

	return <CouponForm coupon={coupon} mode="edit" />;
}
