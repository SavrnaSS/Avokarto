"use client";
import Tooltip from "@/components/common/ui/Tooltip";

const GRIDS = [
  { column: 2, icon: "fa-regular fa-grid-2", label: "Two columns" },
  { column: 3, icon: "fa-sharp fa-light fa-grid", label: "Three columns" },
  { column: 4, icon: "fa-sharp fa-light fa-grid-4", label: "Four columns" },
] as const;

/** Grid density for the product list - changes the layout in place. */
export default function LayoutHandler({
  column,
  onChange,
}: {
  column?: number;
  onChange?: (column: number) => void;
}) {
  if (!onChange) return null;
  return (
    <>
      {GRIDS.map((grid) => (
        <Tooltip content={grid.label} key={grid.column} placement="top">
          <button
            aria-label={grid.label}
            aria-pressed={column === grid.column}
            className={column === grid.column ? "active tooltips" : "tooltips"}
            onClick={() => onChange(grid.column)}
            type="button"
          >
            <i className={grid.icon} />
          </button>
        </Tooltip>
      ))}
    </>
  );
}
