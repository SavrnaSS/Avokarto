// admin > Products > edit > Product Specifications stores this as raw
// "Label: value; Label: value" text (see color-variants-field.tsx's sibling
// card in product-form.tsx) - parsed here rather than pre-split in the DB so
// the admin's exact free-text round-trips untouched on the next edit.
// Shared by DetailsFashion.tsx (the compact "Material/Season/Fit" list) and
// DescriptionTab1.tsx (the full "Specification" tab) - same source field,
// two different visual presentations of the same parsed rows.
export function parseProductSpecifications(raw?: string) {
  if (!raw) return [];

  return raw
    .split(";")
    .map((pair) => {
      const separatorIndex = pair.indexOf(":");
      if (separatorIndex === -1) return null;

      const label = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      return label && value ? { label, value } : null;
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
}
