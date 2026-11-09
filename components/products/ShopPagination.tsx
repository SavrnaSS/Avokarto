import { Dispatch } from "react";
import { setCurrentPage } from "../reducer/filterActions";
import { FilterState, FilterAction } from "@/types";
import NavEffectTabs from "@/components/common/ui/NavEffectTabs";

export default function ShopPagination({
  state,
  dispatch,
  parentClass = "rbt-nav-effect-activation text-center",
  listClass = "rbt-pagination",
  highlightClass = "rbt-bg-highlight rbt-pagination-bg-highlight",
  prevNextClass = "transp-link b3",
}: {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  parentClass?: string;
  listClass?: string;
  highlightClass?: string;
  prevNextClass?: string;
}) {
  const totalPages = Math.ceil(state.sorted.length / state.itemPerPage);

  if (totalPages <= 1) return null;

  const setPage = (page: number) => {
    setCurrentPage(page, dispatch);
  };

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const options = pages.map((page) => ({
    id: String(page),
    label: String(page),
  }));

  return (
    <nav className={parentClass}>
      <NavEffectTabs
        parentClassName="text-center d-flex align-items-center justify-content-center rbt-gap--8"
        options={options}
        active={String(state.currentPage)}
        setActive={(id) => setPage(Number(id))}
        groupClassName={listClass}
        itemClassName=""
        highlightClassName={highlightClass}
        startAdornment={
          <button
            type="button"
            className={prevNextClass}
            onClick={() => {
              if (state.currentPage > 1) setPage(state.currentPage - 1);
            }}
            aria-label="Previous"
          >
            <i className="fa-regular fa-chevron-left" />
          </button>
        }
        endAdornment={
          <button
            type="button"
            className={prevNextClass}
            onClick={() => {
              if (state.currentPage < totalPages)
                setPage(state.currentPage + 1);
            }}
            aria-label="Next"
          >
            <i className="fa-regular fa-chevron-right" />
          </button>
        }
      />
    </nav>
  );
}
