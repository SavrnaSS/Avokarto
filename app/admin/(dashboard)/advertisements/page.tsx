import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveAdvertisementsPanel } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";
import { getAdminAdvertisements } from "@/lib/backend/admin-data";

export default async function AdvertisementsPage() {
	const advertisements = await getAdminAdvertisements();

	return (
		<>
			<PageHeader
				actions={
					<Link
						className="inline-flex h-11 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
						href={routes.addAdvertisement}
					>
						<Icon className="h-4 w-4" name="plus" />
						Add Advertisement
					</Link>
				}
				description="Manage the promotional banners shown on product pages. A banner only appears on the storefront while it's Active."
				eyebrow="Marketing"
				title="Advertising"
			/>
			<LiveAdvertisementsPanel initialAdvertisements={advertisements} />
		</>
	);
}
