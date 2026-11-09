import type { ModalNameType } from "@/types/modal";

/**
 * Side / off-canvas layers: portaled without `managed-bs-modal-layer`, scrim + slide-in.
 * Keep in sync with entries in `lib/layoutModalRegistry.tsx`.
 */
export const OFF_CANVAS_MANAGED_MODAL_IDS = new Set<ModalNameType>([
  "cartSidebar",
  "mobileMenu",
]);

export function isOffCanvasManagedModal(name: ModalNameType): boolean {
  return OFF_CANVAS_MANAGED_MODAL_IDS.has(name);
}

/** `SingleManagedModalLayer` `withoutWrapper` prop */
export function managedModalUsesPortalOnly(name: ModalNameType): boolean {
  return isOffCanvasManagedModal(name);
}
