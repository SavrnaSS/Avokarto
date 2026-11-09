"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import type { Locale } from "@/context/languageStore";
import { useTranslation } from "@/lib/i18n/translations";
import styles from "./CurrencySelect.module.css";

const languages: { name: string; value: Locale; image: string }[] = [
  {
    name: "English",
    value: "en",
    image: "/assets/images/icons/eng.webp",
  },
  {
    name: "Danish",
    value: "da",
    image: "/assets/images/icons/den.webp",
  },
  {
    name: "Italian",
    value: "it",
    image: "/assets/images/icons/italic.webp",
  },
];

export default function LanguageSelect({
  parentClass = "rbt-dropdown-menu rbt-dropdown-menu-elastic switcher-language",
}) {
  const { locale, setLocale } = useTranslation();
  const selectedLanguage =
    languages.find((language) => language.value === locale) ?? languages[0];

  return (
    <ul className={parentClass}>
      <li className={styles.root}>
        <Select.Root
          value={selectedLanguage.value}
          onValueChange={(value) => {
            const language = languages.find(
              (option) => option.value === value,
            );

            if (language) setLocale(language.value);
          }}
        >
          <Select.Trigger
            className={styles.trigger}
            aria-label={`Language: ${selectedLanguage.name}`}
          >
            <span className={styles.triggerValue}>
              <Image
                className={styles.flag}
                alt=""
                src={selectedLanguage.image}
                width={22}
                height={22}
              />
              <Select.Value>{selectedLanguage.name}</Select.Value>
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
              className={`${styles.menu} ${styles.languageMenu}`}
              position="popper"
              sideOffset={6}
              align="end"
              collisionPadding={12}
            >
              <Select.Viewport className={styles.viewport}>
                {languages.map((language) => (
                  <Select.Item
                    key={language.value}
                    value={language.value}
                    textValue={language.name}
                    className={styles.option}
                  >
                    <Select.ItemText>
                      <span className={styles.optionValue}>
                        <Image
                          className={styles.flag}
                          alt=""
                          src={language.image}
                          width={22}
                          height={22}
                        />
                        <span>{language.name}</span>
                      </span>
                    </Select.ItemText>
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
