import type { Product } from "@/types/product";

type RegistrationProduct = Pick<Product, "title" | "category" | "filterCategory">;

/** Keep account benefits factual; registration does not change product pricing. */
export function getProductRegistrationMessage(product: RegistrationProduct) {
  const categories = [...(product.category ?? []), ...(product.filterCategory ?? [])]
    .join(" ")
    .toLowerCase();
  const title = product.title.toLowerCase();
  const context = `${categories} ${title}`;
  let introduction = "Discover your next favourite find.";

  if (/\b(electronics?|tech|gadgets?|lighting)\b/.test(categories)) {
    introduction = "Love clever gadgets and smart finds?";
  } else if (/\b(pets?|cats?|dogs?|pupp(?:y|ies)|kittens?|paw\w*)\b/.test(context)) {
    if (/\b(pawwash|groom\w*|wash\w*|clean\w*|care|brush\w*)\b/.test(context)) {
      introduction = "Give your pet a little extra care.";
    } else if (/\b(backpacks?|carriers?|harness(?:es)?|leash(?:es)?)\b/.test(title)) {
      introduction = "Discover more favourites for your pet.";
    } else if (/\b(costumes?|outfits?|shirts?|jackets?|dress[ -]?up)\b/.test(context)) {
      introduction = "Find your pet’s next favourite outfit.";
    } else {
      introduction = "Discover more favourites for your pet.";
    }
  } else if (/phone|\b(gadgets?|lights?|headphones?|speakers?|chargers?)\b/.test(title)) {
    introduction = "Love clever gadgets and smart finds?";
  } else if (/\b(costumes?|dress[ -]?up|cosplay)\b/.test(context)) {
    introduction = "Find your next standout costume.";
  } else if (/\b(novelty|gifts?|props?|horror|scare)\b/.test(context)) {
    introduction = "Love unique gifts and playful finds?";
  }

  return `${introduction} Create an account to keep track of your orders.`;
}
