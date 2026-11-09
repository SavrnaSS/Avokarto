"use client";

const tagFilters = [
  { label: "Featured", icon: "fa-regular fa-truck-fast", tag: "featured" },
  {
    label: "Best Sellers",
    icon: "fa-sharp fa-regular fa-stars",
    tag: "best-seller",
  },
  { label: "Top Rated", icon: "fa-regular fa-badge-check", tag: "top-rated" },
  { label: "New", icon: "fa-regular fa-money-bill", tag: "new" },
];

export default function FilterByTagTwo({
  selectedItems,
  onChange,
}: {
  selectedItems: string[];
  onChange: (value: string) => void;
}) {
  const handleTagClick = (tag: string) => {
    onChange(tag);
  };

  return (
    <>
      {tagFilters.map(({ label, icon, tag }, i) => (
        <a
          key={i}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleTagClick(tag);
          }}
          className={selectedItems.includes(tag) ? "active" : ""}
        >
          <i className={icon} /> {label}
        </a>
      ))}
    </>
  );
}
