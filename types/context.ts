import { Product, CartProduct } from "./product";

export interface DataContextValue {
  cartProducts: CartProduct[];
  setCartProducts: React.Dispatch<React.SetStateAction<CartProduct[]>>;
  totalPrice: number;
  addProductToCart: (item: Product, qty?: number) => void;
  isAddedToCartProducts: (id: number) => boolean;
  removeFromWishlist: (id: number) => void;
  addToWishlist: (item: Product) => void;
  isAddedtoWishlist: (id: number) => boolean;
  quickViewItem: Product;
  wishList: Product[];
  setQuickViewItem: React.Dispatch<React.SetStateAction<Product>>;
  quickAddItem: number;
  setQuickAddItem: React.Dispatch<React.SetStateAction<number>>;
  addToCompareItem: (item: Product) => void;
  isAddedToCompareItem: (id: number) => boolean;
  removeFromCompareItem: (id: number) => void;
  compareItem: Product[];
  setCompareItem: React.Dispatch<React.SetStateAction<Product[]>>;
  updateQuantity: (id: number, qty: number) => void;
  quantityInCart: (id: number) => number;
}
