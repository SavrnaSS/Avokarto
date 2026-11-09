"use client";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import { Product } from "@/types";

const priceRanges = [
  { id: 1, label: "Under $25", min: 0, max: 24, count: 9 },
  { id: 2, label: "$25 to $50", min: 25, max: 50, count: 12 },
  { id: 3, label: "$50 to $100", min: 50, max: 100, count: 67 },
  { id: 4, label: "$100 to $200", min: 100, max: 200, count: 30 },
  { id: 5, label: "$200 & Above", min: 200, max: 1000, count: 89 },
];

export default function FilterByPrice({
  priceRange,
  onChange,
  getFilterCount,
}: {
  priceRange: [number, number];
  onChange: (value: [number, number]) => void;
  getFilterCount: (fn: (product: Product) => boolean) => number;
}) {
  const handleRangeChange = (range: number | number[]) => {
    const arr = Array.isArray(range) ? range : [range, range];
    onChange([arr[0], arr[1]] as [number, number]);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    handleRangeChange([value, priceRange[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    handleRangeChange([priceRange[0], value]);
  };

  return (
    <>
      {/* Price Range Checkboxes */}
      <ul className="rbt-sidebar-list-wrapper rbt-categories-list-check">
        {priceRanges.map((range) => {
          const isChecked =
            priceRange[0] === range.min && priceRange[1] === range.max;
          const inputId = `price-checkbox-${range.id}`;

          return (
            <li
              key={range.id}
              className={`rbt-check-group ${isChecked ? "active" : ""}`}
            >
              <input
                id={inputId}
                type="checkbox"
                name={inputId}
                checked={isChecked}
                onChange={() => handleRangeChange([range.min, range.max])}
              />
              <label htmlFor={inputId}>
                {range.label}
                <span className="rbt-label-count">
                  (
                  {getFilterCount(
                    (product) =>
                      product.price >= range.min && product.price <= range.max,
                  )}
                  )
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* Slider Range */}
      <div className="rbt-price-range-slider">
        <Slider
          range
          value={priceRange}
          onChange={handleRangeChange}
          max={1000}
          min={0}
          step={15}
        />
        <p className="rbt-range-value">
          <input
            type="text"
            id="amount"
            readOnly
            value={`$${priceRange[0]} - $${priceRange[1]}`}
          />
        </p>
      </div>

      {/* Manual Input Group */}
      <div className="rbt-price-input-grp">
        <input
          type="number"
          min={0}
          placeholder="$ Min"
          value={priceRange[0]}
          onChange={handleMinChange}
        />
        <input
          type="number"
          min={0}
          placeholder="$ Max"
          value={priceRange[1]}
          onChange={handleMaxChange}
        />
      </div>
    </>
  );
}
