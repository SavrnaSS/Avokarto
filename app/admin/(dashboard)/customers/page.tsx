import Link from "next/link";
import { Icon } from "@/admin/components/layout/icon";
import { PageHeader } from "@/admin/components/layout/page-header";
import { LiveCustomersPanel } from "@/admin/components/realtime/live-admin-resources";
import { routes } from "@/admin/config/routes";

export default function CustomersPage() {
	return (
		<>
			<PageHeader
				actions={
					<div className="flex flex-wrap gap-2">
						{/* A plain link: the browser downloads the CSV with the admin session cookie. */}
						<a
							className="inline-flex h-10 items-center gap-2 rounded-base border border-surface-line bg-surface-card px-4 text-[14px] font-semibold text-ink-700 hover:bg-surface-body"
							download
							href="/api/admin/newsletter"
						>
							<Icon className="h-4 w-4" name="download" />
							Newsletter list
						</a>
						<Link
							className="inline-flex h-10 items-center gap-2 rounded-base bg-brand-600 px-4 text-[14px] font-semibold text-white hover:bg-brand-700"
							href={routes.addUser}
						>
							<Icon className="h-4 w-4" name="user-plus" />
							Add Customer
						</Link>
					</div>
				}
				description="Review customer value, recent orders, and account health."
				eyebrow="CRM"
				title="Customers"
			/>
			<LiveCustomersPanel initialCustomers={[]} />
		</>
	);
}
