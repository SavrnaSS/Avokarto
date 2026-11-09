import Link from "next/link";
import { routes } from "@/admin/config/routes";

export default function AdminNotFound() {
	return (
		<main className="grid min-h-screen place-items-center px-6">
			<div className="max-w-sm text-center">
				<p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600">404</p>
				<h1 className="mt-2 text-[24px] font-semibold text-ink-900">This admin page doesn&apos;t exist</h1>
				<p className="mt-2 text-[14px] text-ink-500">It may have been moved or removed.</p>
				<Link
					className="mt-6 inline-flex h-11 items-center rounded-base bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
					href={routes.dashboard}
				>
					Back to dashboard
				</Link>
			</div>
		</main>
	);
}
