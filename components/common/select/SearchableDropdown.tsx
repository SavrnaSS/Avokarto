"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface SearchableDropdownProps {
  options: string[];
  selected: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  extraClass?: string;
  menuMinWidth?: string;
}

export default function SearchableDropdown({
  options,
  selected,
  onChange = () => {},
  placeholder = "Select an option",
  searchPlaceholder = "Search",
  extraClass = "w-100",
  menuMinWidth,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();

    return options.filter((option) => {
      const identity = option.trim().toLocaleLowerCase();
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uniqueOptions;
    return uniqueOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [query, uniqueOptions]);

  const handleSelect = (value: string) => {
    onChange(value);
    setQuery("");
    setIsOpen(false);
  };

  const label = selected || placeholder;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`dropdown bootstrap-select rbt-select-activation ${
        isOpen ? "show" : ""
      } ${extraClass}`}
    >
      <button
        type="button"
        tabIndex={0}
        className="btn dropdown-toggle btn-light w-100 text-start"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={label}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="filter-option">
          <div className="filter-option-inner">
            <div className="filter-option-inner-inner">{label}</div>
          </div>
        </div>
      </button>
      <div
        className={`dropdown-menu w-100 ${isOpen ? "show" : ""}`}
        data-popper-placement="bottom-start"
        style={menuMinWidth ? { minWidth: menuMinWidth } : undefined}
      >
        <div className="bs-searchbox">
          <input
            type="search"
            className="form-control"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="inner show" role="listbox" tabIndex={-1}>
          <ul className="dropdown-menu inner show" role="presentation">
            {filtered.map((option) => (
              <li
                key={option}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                className={`${
                  selected === option ? "active selected" : ""
                }`.trim()}
              >
                <div
                  className={`dropdown-item ${
                    selected === option ? "active selected" : ""
                  }`.trim()}
                >
                  <span className="text">{option}</span>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="disabled">
                <div className="dropdown-item disabled">
                  <span className="text">No results found</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
