import { ModalName } from "@/types/modal";

export type { ToolbarItem } from "@/types/misc";

export const toolbarItems = [
  {
    id: "compare",
    label: "Compare",
    icon: "fa-regular fa-code-compare",
    modalTarget: ModalName.compareReviewModal,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: "fa-regular fa-heart",
    modalTarget: ModalName.wishlistModal,
    hasCount: true,
  },
  {
    id: "search",
    label: "Search",
    icon: "fa-regular fa-search",
    isSearchTrigger: true,
  },
  {
    id: "shop",
    label: "Shop",
    icon: "fa-regular fa-bag-shopping",
    href: "/shop",
  },
  {
    id: "profile",
    label: "Profile",
    icon: "fa-regular fa-user",
    modalTarget: ModalName.signinModal,
  },
];
