"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { isCurrencyCode } from "@/context/currencyStore";
import { CURRENCY_OPTIONS, useCurrency } from "@/lib/currency";
import styles from "./CurrencySelect.module.css";

export default function CurrencySelect({
  parentClass = "rbt-dropdown-menu rbt-dropdown-menu-elastic currency-menu",
}) {
  const { currency, setCurrency, ready } = useCurrency();
  const label = CURRENCY_OPTIONS.find((option) => option.code === currency)!.label;

  return (
    <ul className={parentClass}>
      <li className={styles.root}>
        <Select.Root
          value={currency}
          onValueChange={(value) => {
            if (isCurrencyCode(value)) setCurrency(value);
          }}
        >
          <Select.Trigger
            className={styles.trigger}
            aria-label={`Currency: ${label}`}
            disabled={!ready}
          >
            <span className={styles.triggerValue}>
              <Select.Value>{label}</Select.Value>
            </span>
            <Select.Icon asChild>
              <ChevronDown
                className={styles.chevron}
                size={16}
                aria-hidden="true"
              />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className={styles.menu}
              position="popper"
              sideOffset={6}
              align="end"
              collisionPadding={12}
            >
              <Select.Viewport className={styles.viewport}>
                {CURRENCY_OPTIONS.map((option) => (
                  <Select.Item
                    key={option.code}
                    value={option.code}
                    className={styles.option}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className={styles.indicator}>
                      <Check
                        size={16}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </li>
    </ul>
  );
}
