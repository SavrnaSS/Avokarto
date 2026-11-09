// Pure helpers for the per-product SEO fields. Shared by the admin form
// (live validation), admin-mutations (server validation) and the storefront
// (metadata / structured data), so all three agree on what's valid.

/** Search results show roughly this many characters of a title. */
export const SEO_TITLE_MAX = 60;
/** Descriptions under this read as thin; over the max get cut off. */
export const SEO_DESCRIPTION_MIN = 120;
export const SEO_DESCRIPTION_MAX = 160;
export const SEO_SLUG_MAX = 80;
export const SEO_KEYWORDS_MAX = 20;
/** Screen readers and Google both favour concise alt text. */
export const IMAGE_ALT_MAX = 125;

/** Lower-case, hyphenated URL handle ("Cozy Cat Hoodie!" -> "cozy-cat-hoodie"). */
export function slugifyHandle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SEO_SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Digits only: shoppers and suppliers write GTINs with spaces or dashes. */
export function normalizeGtin(value: string) {
  return value.replace(/[\s-]/g, "");
}

/**
 * GTIN-8/12/13/14 with a valid GS1 check digit. UPC-A is GTIN-12, EAN-13 and
 * ISBN-13 are GTIN-13. A wrong check digit is almost always a typo, and
 * Google rejects mismatched identifiers, so it's refused rather than stored.
 */
export function isValidGtin(value: string) {
  const digits = normalizeGtin(value);
  if (!/^(\d{8}|\d{12,14})$/.test(digits)) return false;
  let sum = 0;
  for (let i = digits.length - 2, weight = 3; i >= 0; i -= 1, weight = 4 - weight) {
    sum += Number(digits[i]) * weight;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
}

/** schema.org property name for a valid GTIN ("gtin8", "gtin12", …). */
export function gtinProperty(value: string) {
  const digits = normalizeGtin(value);
  return isValidGtin(digits) ? (`gtin${digits.length}` as "gtin8" | "gtin12" | "gtin13" | "gtin14") : null;
}

/** Comma-separated keywords -> trimmed, de-duplicated (case-insensitive) list. */
export function parseKeywords(value: string | readonly string[]) {
  const parts = typeof value === "string" ? value.split(",") : value.flatMap((item) => item.split(","));
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const part of parts) {
    const keyword = part.replace(/\s+/g, " ").trim().slice(0, 60);
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    keywords.push(keyword);
    if (keywords.length === SEO_KEYWORDS_MAX) break;
  }
  return keywords;
}

/**
 * Alt text map keyed by image URL. Drops non-string values, blank text and
 * (when `allowedUrls` is given) images no longer in the gallery, so removed
 * images don't leave stale entries behind.
 */
export function parseImageAlts(value: unknown, allowedUrls?: readonly string[]) {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return {};
    }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const allowed = allowedUrls ? new Set(allowedUrls) : null;
  const alts: Record<string, string> = {};
  for (const [url, alt] of Object.entries(source as Record<string, unknown>)) {
    if (typeof alt !== "string" || (allowed && !allowed.has(url))) continue;
    const text = alt.replace(/\s+/g, " ").trim().slice(0, IMAGE_ALT_MAX);
    if (text) alts[url] = text;
  }
  return alts;
}
