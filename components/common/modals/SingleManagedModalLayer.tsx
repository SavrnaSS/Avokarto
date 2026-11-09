"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { useUiStore } from "@/context/uiStore";
import { getStackedModalZIndexForIndex } from "@/lib/modalStack";
import { type ModalNameType } from "@/types/modal";

type SingleManagedModalLayerProps = {
  modalName: ModalNameType;
  withoutWrapper?: boolean;
  children: ReactNode;
};

const mountedModalNameCounts = new Map<string, number>();

export default function SingleManagedModalLayer({
  modalName,
  withoutWrapper = false,
  children,
}: SingleManagedModalLayerProps) {
  const portalRoot = typeof document !== "undefined" ? document.body : null;
  const { stackIndex, isClosing, delayedShowBsModal } = useUiStore(
    useShallow((s) => ({
      stackIndex: s.activeBsModal.indexOf(modalName),
      isClosing: s.closingBsModal.includes(modalName),
      delayedShowBsModal: s.delayedShowBsModal,
    })),
  );

  const closeSpecificBsModal = useUiStore((s) => s.closeSpecificBsModal);

  useEffect(() => {
    const nextCount = (mountedModalNameCounts.get(modalName) ?? 0) + 1;
    mountedModalNameCounts.set(modalName, nextCount);
    if (nextCount > 1) {
      throw new Error(
        `[SingleManagedModalLayer] Duplicate modal layer for "${modalName}". This modal id is mounted more than once in the current page tree. Fix: keep exactly one <SingleManagedModalLayer modalName="${modalName}" /> and keep as many trigger buttons as needed with openModalName="${modalName}".`,
      );
    }
    return () => {
      const currentCount = mountedModalNameCounts.get(modalName) ?? 0;
      if (currentCount <= 1) {
        mountedModalNameCounts.delete(modalName);
        return;
      }
      mountedModalNameCounts.set(modalName, currentCount - 1);
    };
  }, [modalName]);

  if (stackIndex < 0 || !portalRoot) return null;

  if (withoutWrapper) {
    const isPanelScrimActive = delayedShowBsModal && !isClosing;
    const layerNode = (
      <>
        <div
          aria-hidden
          onClick={(e) => {
            e.preventDefault();
            closeSpecificBsModal(modalName);
          }}
          className={`close_side_menu catagories-close_side_menu${
            isPanelScrimActive ? " active" : ""
          }`}
          style={{
            zIndex: getStackedModalZIndexForIndex(stackIndex, {
              modalOffset: 0,
            }),
          }}
        />
        {children}
      </>
    );
    return createPortal(layerNode, portalRoot);
  }

  const isOpen = !isClosing;
  const layerNode = (
    <div
      className={`managed-bs-modal-layer${isOpen ? " is-open" : ""}`}
      style={{
        zIndex: getStackedModalZIndexForIndex(stackIndex),
      }}
      onWheelCapture={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".modal-content")) e.preventDefault();
      }}
      onTouchMoveCapture={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".modal-content")) e.preventDefault();
      }}
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".modal-content")) closeSpecificBsModal(modalName);
      }}
    >
      {children}
    </div>
  );
  return createPortal(layerNode, portalRoot);
}
