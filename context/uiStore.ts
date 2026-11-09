"use client";

import { create } from "zustand";
import type { TeamMember } from "@/types/team";
import type { ModalNameType } from "@/types/modal";

const TOASTER_DURATION_MS = 3000;

interface UiState {
  commonSearchOpen: boolean;
  searchOpen: boolean;
  toasterCompareVisible: boolean;
  toasterWishlistVisible: boolean;
  cartToasterVisible: boolean;
  wishlistMessage: string;
  menuHoverOpen: boolean;
  pane: HTMLElement | null;
  isZooming: boolean;
  activeBsModal: ModalNameType[];
  closingBsModal: ModalNameType[];
  showBsModal: boolean;
  delayedShowBsModal: boolean;
  activeMember: TeamMember | null;
  socialSharePath: string | null;
  // Actions
  setPane: (el: HTMLElement | null) => void;
  setIsZooming: (zooming: boolean) => void;
  toggleCommonSearch: () => void;
  closeCommonSearch: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  showToasterCompare: () => void;
  showToaster: (message?: string) => void;
  showCartToaster: () => void;
  closeCartToaster: () => void;
  setMenuHoverOpen: (open: boolean) => void;
  openBsModal: (modalName: ModalNameType) => void;
  openSpecificBsModal: (modalName: ModalNameType) => void;
  closeBsModal: () => void;
  closeSpecificBsModal: (modalName: ModalNameType) => void;
  closeLatestBsModal: () => void;
  isBsModalOpen: (modalName: ModalNameType) => boolean;
  closeAll: () => void;
  setActiveMember: (member: TeamMember | null) => void;
  setSocialSharePath: (path: string | null) => void;
}

// -----------------------------------------------------------------------------
// Modal stack
// - `activeBsModal`: ordered ids; last = focused / top of stack.
// - `closingBsModal`: ids currently in the close animation (still in DOM).
// - `delayedShowBsModal`: briefly false on a fresh open so CSS transitions can
//   run after `dynamic()` chunks mount (see `usePanelSlideInReady`).
// -----------------------------------------------------------------------------

const MODAL_CLOSE_MS = 850;
const modalCloseTimers = new Map<
  ModalNameType,
  ReturnType<typeof setTimeout>
>();

type ModalStackSlice = Pick<
  UiState,
  "activeBsModal" | "closingBsModal" | "showBsModal" | "delayedShowBsModal"
>;

function clearModalCloseTimer(modalName: ModalNameType) {
  const existing = modalCloseTimers.get(modalName);
  if (existing) {
    clearTimeout(existing);
    modalCloseTimers.delete(modalName);
  }
}

function clearEveryModalCloseTimer() {
  modalCloseTimers.forEach((timer) => clearTimeout(timer));
  modalCloseTimers.clear();
}

function nextStackAfterOpen(
  state: Pick<UiState, "activeBsModal" | "closingBsModal">,
  modalName: ModalNameType,
  shouldAnimateOpen: boolean,
): ModalStackSlice {
  return {
    activeBsModal: [
      ...state.activeBsModal.filter((name) => name !== modalName),
      modalName,
    ],
    closingBsModal: state.closingBsModal.filter((name) => name !== modalName),
    showBsModal: true,
    delayedShowBsModal: shouldAnimateOpen ? false : true,
  };
}

function nextClosingAfterRequest(
  closingBsModal: ModalNameType[],
  modalName: ModalNameType,
): Pick<UiState, "closingBsModal"> {
  if (closingBsModal.includes(modalName)) {
    return { closingBsModal };
  }
  return { closingBsModal: [...closingBsModal, modalName] };
}

function nextStackAfterCloseAnimation(
  state: Pick<UiState, "activeBsModal" | "closingBsModal">,
  modalName: ModalNameType,
): ModalStackSlice {
  const nextActive = state.activeBsModal.filter((name) => name !== modalName);
  const nextClosing = state.closingBsModal.filter((name) => name !== modalName);
  const anyLeft = nextActive.length > 0;
  return {
    activeBsModal: nextActive,
    closingBsModal: nextClosing,
    showBsModal: anyLeft,
    delayedShowBsModal: anyLeft,
  };
}

function isModalOpenOnStack(
  state: Pick<UiState, "activeBsModal" | "closingBsModal">,
  modalName: ModalNameType,
) {
  return (
    state.activeBsModal.includes(modalName) &&
    !state.closingBsModal.includes(modalName)
  );
}

/** After `nextClosingAfterRequest`, run CSS close then drop from stacks. */
function armModalCloseCompletion(
  modalName: ModalNameType,
  onComplete: () => void,
) {
  clearModalCloseTimer(modalName);
  const timer = setTimeout(() => {
    modalCloseTimers.delete(modalName);
    onComplete();
  }, MODAL_CLOSE_MS);
  modalCloseTimers.set(modalName, timer);
}

export const useUiStore = create<UiState>((set, _get) => ({
  commonSearchOpen: false,
  searchOpen: false,
  toasterCompareVisible: false,
  toasterWishlistVisible: false,
  cartToasterVisible: false,
  wishlistMessage: "Added in Wishlist",
  menuHoverOpen: false,
  pane: null,
  isZooming: false,
  activeBsModal: [],
  closingBsModal: [],
  showBsModal: false,
  delayedShowBsModal: false,
  activeMember: null,
  socialSharePath: null,
  toggleCommonSearch: () =>
    set((s) => ({ commonSearchOpen: !s.commonSearchOpen })),
  closeCommonSearch: () => set({ commonSearchOpen: false }),

  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  closeSearch: () => set({ searchOpen: false }),

  showToasterCompare: () => {
    set({ toasterCompareVisible: true });
    setTimeout(
      () => set({ toasterCompareVisible: false }),
      TOASTER_DURATION_MS,
    );
  },
  showToaster: (message = "Added in Wishlist") => {
    set({ toasterWishlistVisible: true, wishlistMessage: message });
    setTimeout(
      () => set({ toasterWishlistVisible: false }),
      TOASTER_DURATION_MS,
    );
  },
  showCartToaster: () => {
    set({ cartToasterVisible: true });
    setTimeout(() => set({ cartToasterVisible: false }), TOASTER_DURATION_MS);
  },
  closeCartToaster: () => set({ cartToasterVisible: false }),

  setPane: (pane) => set({ pane }),
  setIsZooming: (isZooming) => set({ isZooming }),

  setMenuHoverOpen: (open) => set({ menuHoverOpen: open }),

  openSpecificBsModal: (modalName) => {
    if (!modalName) return;
    clearModalCloseTimer(modalName);
    const shouldAnimateOpen = !_get().delayedShowBsModal;
    set((state) => ({
      ...nextStackAfterOpen(state, modalName, shouldAnimateOpen),
    }));
    if (shouldAnimateOpen) {
      setTimeout(() => set({ delayedShowBsModal: true }), 2);
    }
  },
  openBsModal: (modalName) => _get().openSpecificBsModal(modalName),

  closeLatestBsModal: () => {
    const latestModal = _get().activeBsModal.at(-1);
    if (!latestModal) return;
    _get().closeSpecificBsModal(latestModal);
  },
  closeBsModal: () => _get().closeLatestBsModal(),
  closeSpecificBsModal: (modalName) => {
    if (!modalName) return;
    const state = _get();
    if (!state.activeBsModal.includes(modalName)) return;
    set((prev) => ({
      ...nextClosingAfterRequest(prev.closingBsModal, modalName),
    }));
    armModalCloseCompletion(modalName, () => {
      set((prev) => ({
        ...nextStackAfterCloseAnimation(prev, modalName),
      }));
    });
  },
  isBsModalOpen: (modalName) => isModalOpenOnStack(_get(), modalName),

  closeAll: () => {
    const activeModalNames = _get().activeBsModal;
    clearEveryModalCloseTimer();

    set((prev) => ({
      commonSearchOpen: false,
      searchOpen: false,
      menuHoverOpen: false,
      cartToasterVisible: false,
      closingBsModal: Array.from(
        new Set([...prev.closingBsModal, ...activeModalNames]),
      ),
      showBsModal: activeModalNames.length > 0,
      delayedShowBsModal: activeModalNames.length > 0,
    }));

    if (activeModalNames.length === 0) {
      set({ showBsModal: false, delayedShowBsModal: false });
      return;
    }

    setTimeout(() => {
      set({
        activeBsModal: [],
        closingBsModal: [],
        showBsModal: false,
        delayedShowBsModal: false,
      });
    }, MODAL_CLOSE_MS);
  },

  setActiveMember: (member) => set({ activeMember: member }),
  setSocialSharePath: (path) => set({ socialSharePath: path }),
}));

function getUiSnapshot(state: UiState) {
  return {
    commonSearchOpen: state.commonSearchOpen,
    searchOpen: state.searchOpen,
    toasterCompareVisible: state.toasterCompareVisible,
    toasterWishlistVisible: state.toasterWishlistVisible,
    cartToasterVisible: state.cartToasterVisible,
    wishlistMessage: state.wishlistMessage,
    menuHoverOpen: state.menuHoverOpen,
    toggleCommonSearch: state.toggleCommonSearch,
    closeCommonSearch: state.closeCommonSearch,
    toggleSearch: state.toggleSearch,
    closeSearch: state.closeSearch,
    showToasterCompare: state.showToasterCompare,
    showToaster: state.showToaster,
    showCartToaster: state.showCartToaster,
    closeCartToaster: state.closeCartToaster,
    setMenuHoverOpen: state.setMenuHoverOpen,
    pane: state.pane,
    isZooming: state.isZooming,
    activeBsModal: state.activeBsModal,
    closingBsModal: state.closingBsModal,
    showBsModal: state.showBsModal,
    delayedShowBsModal: state.delayedShowBsModal,
    activeMember: state.activeMember,
    socialSharePath: state.socialSharePath,
    setPane: state.setPane,
    setIsZooming: state.setIsZooming,
    openBsModal: state.openBsModal,
    openSpecificBsModal: state.openSpecificBsModal,
    closeBsModal: state.closeBsModal,
    closeSpecificBsModal: state.closeSpecificBsModal,
    closeLatestBsModal: state.closeLatestBsModal,
    isBsModalOpen: state.isBsModalOpen,
    closeAll: state.closeAll,
    setActiveMember: state.setActiveMember,
    setSocialSharePath: state.setSocialSharePath,
  };
}

type UiSnapshot = ReturnType<typeof getUiSnapshot>;

let cachedUiState: UiState | null = null;
let cachedUiSnapshot: UiSnapshot | null = null;

function getStableUiSnapshot(state: UiState): UiSnapshot {
  if (state === cachedUiState && cachedUiSnapshot !== null) {
    return cachedUiSnapshot;
  }
  cachedUiState = state;
  cachedUiSnapshot = getUiSnapshot(state);
  return cachedUiSnapshot;
}

/** Cached hook for UI store - use this for destructuring like useContextElement() */
export const useUiElement = () => {
  return useUiStore(getStableUiSnapshot);
};
