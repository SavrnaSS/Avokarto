import { PageHeader } from "@/admin/components/layout/page-header";
import { GenerateReviewsButton } from "@/admin/components/products/generate-reviews-button";
import { LiveProductReviewsPanel } from "@/admin/components/realtime/live-admin-resources";

export default function ProductReviewsPage() {
	return (
		<>
			<PageHeader
				actions={<GenerateReviewsButton />}
				description="Review, approve, and respond to customer product feedback."
				eyebrow="Moderation"
				title="Product Reviews"
			/>
			<LiveProductReviewsPanel initialReviews={[]} />
		</>
	);
}
