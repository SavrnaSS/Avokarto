import type { Product } from "@/types";

interface ProductRatingProps {
  product?: Pick<Product, "rating" | "reviewCount" | "ratingCount">;
  rating?: number | null;
  reviewCount?: number | null;
  className?: string;
  starClass?: string;
  children?: React.ReactNode;
}

export default function ProductRating({
  product,
  rating: ratingProp,
  reviewCount: reviewCountProp,
  className,
  starClass,
  children,
}: ProductRatingProps) {
  const rating = ratingProp ?? product?.rating;
  const reviewCount =
    reviewCountProp ?? product?.reviewCount ?? product?.ratingCount;

  if (rating == null || rating <= 0) {
    return null;
  }

  const wrapperClassName = ["rbt-card-rating", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName}>
      <ul className={`rbt-rating-icon-list ${starClass ?? ""}`.trim()}>
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index}>
            <i
              className={`fa-solid fa-star${index < rating ? " rbt-rated-icon" : ""}`}
            />
          </li>
        ))}
      </ul>
      {reviewCount != null ? (
        <p className="rating-digit">({reviewCount})</p>
      ) : null}
      {children}
    </div>
  );
}
