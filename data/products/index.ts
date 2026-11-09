import { Product } from "@/types";
import { allAccessories } from "./accessories";
import { allBeautyProducts } from "./beauty";
import { allElectronocsProducts } from "./electronics";
import { allFashionProducts } from "./fashion";
import { allFoodProducts } from "./foods";
import { allFurnitureProducts } from "./furnitures";
import { allGlassProducts } from "./glass";
import { allJewelryProducts } from "./jewelry";
import { allLookbookProducts } from "./lookbook";
import { otherProducts } from "./others";
import { phoneProducts } from "./phone";
import { allPrintingProducts } from "./printingService";
import { allSportProducts } from "./sports";
import { testimonialsProducts } from "./testimonialsProducts";

import {
  instaModalProducts,
  welcomeBannerProducts,
  headerCartStoreProducts,
} from "./modalProducts";

export const allProducts: Product[] = [
  ...allAccessories,
  ...allBeautyProducts,
  ...allElectronocsProducts,
  ...allFashionProducts,
  ...allFoodProducts,
  ...allFurnitureProducts,
  ...allGlassProducts,
  ...allJewelryProducts,
  ...phoneProducts,
  ...allPrintingProducts,
  ...allSportProducts,
  ...testimonialsProducts,

  ...otherProducts,
  ...allLookbookProducts,
  ...instaModalProducts,
  ...welcomeBannerProducts,
  ...headerCartStoreProducts,
];
