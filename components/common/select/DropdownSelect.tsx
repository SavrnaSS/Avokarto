"use client";

const filterOptions = [
  "Sort by (Default)",
  "Title Ascending",
  "Title Descending",
  "Price Ascending",
  "Price Descending",
];
export default function DropdownSelect({
  options = filterOptions,
  selected,
  onChange = (_value: string) => {},
  extraClass = "",
}: {
  options?: string[];
  selected: string;
  onChange?: (value: string) => void;
  extraClass?: string;
}) {
  const handleSelect = (value: string) => onChange(value);
  return (
    <div
      className={`dropdown bootstrap-select rbt-select-activation ${extraClass}`}
    >
      <button
        type="button"
        tabIndex={-1}
        className="btn dropdown-toggle btn-light"
        data-bs-toggle="dropdown"
        aria-haspopup="listbox"
        aria-expanded="true"
        title={selected}
      >
        <div className="filter-option">
          <div className="filter-option-inner">
            <div className="filter-option-inner-inner">{selected}</div>
          </div>{" "}
        </div>
      </button>
      <div className="dropdown-menu" data-popper-placement="bottom-start">
        <div
          className="inner show"
          role="listbox"
          tabIndex={-1}
          aria-activedescendant="bs-select-3-0"
        >
          <ul className="dropdown-menu inner show" role="presentation">
            {options.map((option, i) => (
              <li
                onClick={() => handleSelect(option)}
                key={i}
                className={`selected ${selected == option ? "active" : ""} `}
              >
                <a
                  className={`dropdown-item ${
                    selected == option ? "active selected" : ""
                  } `}
                >
                  <span className="text">{option}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
