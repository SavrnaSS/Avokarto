"use client";

import { useCallback } from "react";
import { useUiElement } from "@/context/Context";
import { isOffCanvasManagedModal } from "@/lib/managedModalUi";
import { usePanelSlideInReady } from "@/hooks/usePanelSlideInReady";
import type { ModalNameType } from "@/types/modal";

type Options = {
  /**
   * Override slide-in gate (e.g. false for a future off-canvas that animates differently).
   * Default: slide-in for all `OFF_CANVAS_MANAGED_MODAL_IDS`.
   */
  usePanelSlideIn?: boolean;
};

/**
 * Shared open / close / animation gate for layout-managed modals.
 * Off-canvas panels combine `delayedShowBsModal` with `usePanelSlideInReady` so the first
 * open after load still runs CSS transitions when the chunk is `dynamic()`-loaded.
 */
export function useManagedModalPanel(
  modalId: ModalNameType,
  options?: Options,
) {
  const {
    delayedShowBsModal,
    isBsModalOpen,
    closeSpecificBsModal,
    activeBsModal,
  } = useUiElement();

  const isOpen = isBsModalOpen(modalId);
  const useSlideIn =
    options?.usePanelSlideIn ?? isOffCanvasManagedModal(modalId);
  const slideReady = usePanelSlideInReady(useSlideIn ? isOpen : false);

  const isAnimatedOpen =
    Boolean(delayedShowBsModal) &&
    isOpen &&
    (!useSlideIn || slideReady);

  const close = useCallback(
    () => closeSpecificBsModal(modalId),
    [closeSpecificBsModal, modalId],
  );

  return {
    modalId,
    isOpen,
    /** Use for `side-menu-active`, `comparison-active`, `active`, etc. */
    isAnimatedOpen,
    delayedShowBsModal,
    activeBsModal,
    close,
  };
}
