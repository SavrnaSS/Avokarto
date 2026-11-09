"use client";

import { forwardRef, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type PickerVariant = "date" | "expiry";

type RbtDatePickerFieldProps = {
  id?: string;
  placeholder?: string;
  defaultValue?: string;
  variant?: PickerVariant;
  wrapperClassName?: string;
  inputClassName?: string;
  // Optional - this field was previously fully uncontrolled with no way to
  // read the selected date back out, so any real form using it couldn't
  // actually submit what the shopper picked.
  onDateChange?: (isoDate: string | null) => void;
};

function toIsoDate(date: Date | null) {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DatePickerInputProps = {
  value?: string;
  onClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
};

const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
  ({ value, onClick, onChange, placeholder, className, id, inputRef }, ref) => (
    <input
      ref={(el) => {
        if (typeof ref === "function") {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
        if (inputRef) {
          inputRef.current = el;
        }
      }}
      id={id}
      type="text"
      value={value ?? ""}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  ),
);

DatePickerInput.displayName = "DatePickerInput";

function parseDefaultDate(value: string | undefined, variant: PickerVariant) {
  if (!value) return null;

  if (variant === "expiry") {
    const [monthText, yearText] = value.split("/");
    const month = Number(monthText) - 1;
    const year = Number(yearText);
    if (Number.isNaN(month) || Number.isNaN(year)) return null;
    const fullYear = yearText.length <= 2 ? 2000 + year : year;
    return new Date(fullYear, month, 1);
  }

  const [monthText, dayText, yearText] = value.split("/");
  const month = Number(monthText) - 1;
  const day = Number(dayText);
  const year = Number(yearText);
  if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) return null;
  return new Date(year, month, day);
}

export default function RbtDatePickerField({
  id,
  placeholder,
  defaultValue,
  variant = "date",
  wrapperClassName = "",
  inputClassName = "form-control",
  onDateChange,
}: RbtDatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialDate = useMemo(
    () => parseDefaultDate(defaultValue, variant),
    [defaultValue, variant],
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  const variantClass =
    variant === "expiry"
      ? "rbt-datepicker rbt-expiry-date"
      : "rbt-date-picker-activation rbt-datepicker";

  const openFromIcon = () => {
    inputRef.current?.focus();
    inputRef.current?.click();
  };

  return (
    <div className={`input-group date ${variantClass} ${wrapperClassName}`.trim()}>
      <DatePicker
        id={id}
        selected={selectedDate}
        onChange={(date: Date | null) => {
          setSelectedDate(date);
          onDateChange?.(toIsoDate(date));
        }}
        dateFormat={variant === "expiry" ? "MM/yy" : "MM/dd/yyyy"}
        placeholderText={placeholder}
        showMonthYearPicker={variant === "expiry"}
        wrapperClassName="flex-grow-1"
        customInput={
          <DatePickerInput
            id={id}
            className={`${inputClassName} w-100`}
            inputRef={inputRef}
          />
        }
      />
      <span className="input-group-append" role="button" onClick={openFromIcon}>
        <span className="input-group-text d-block">
          <i className="fa fa-calendar" />
        </span>
      </span>
    </div>
  );
}
