"use client";

const ratings = [
  { id: 1, stars: 4 },
  { id: 2, stars: 3 },
  { id: 3, stars: 2 },
  { id: 4, stars: 1 },
];

export default function FilterByReview({
  selectedItems,
  onChange,
}: {
  selectedItems: number[];
  onChange: (value: number) => void;
}) {
  const handleToggle = (stars: number) => {
    onChange(stars);
  };

  return (
    <>
      {ratings.map((rating) => {
        const isActive = selectedItems.includes(rating.stars);

        return (
          <li
            key={rating.id}
            className={`rbt-review-group ${isActive ? "active" : ""}`}
          >
            <button
              type="button"
              onClick={() => handleToggle(rating.stars)}
              className={`rbt-card-rating d-flex w-full text-left ${
                isActive ? "active" : ""
              }`}
            >
              <ul className="rbt-rating-icon-list flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i}>
                    <i
                      className={`fa-solid fa-star ${
                        i < rating.stars ? "rbt-rated-icon" : ""
                      }`}
                    />
                  </li>
                ))}
              </ul>
              <p className="rbt-rating-text ml-2">&amp; Up</p>
            </button>
          </li>
        );
      })}
    </>
  );
}
