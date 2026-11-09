const DEFAULT_LAYER_BASE_Z_INDEX = 1200;
const DEFAULT_LAYER_STEP = 20;
const DEFAULT_MODAL_OFFSET = 10;

export function getStackedModalZIndexForIndex(
  stackIndex: number,
  options?: {
    baseZIndex?: number;
    step?: number;
    modalOffset?: number;
  },
): number | undefined {
  if (stackIndex < 0) return undefined;

  const baseZIndex = options?.baseZIndex ?? DEFAULT_LAYER_BASE_Z_INDEX;
  const step = options?.step ?? DEFAULT_LAYER_STEP;
  const modalOffset = options?.modalOffset ?? DEFAULT_MODAL_OFFSET;

  return baseZIndex + stackIndex * step + modalOffset;
}

export function getStackedModalZIndex(
  activeModalNames: string[],
  modalName: string,
  options?: {
    baseZIndex?: number;
    step?: number;
    modalOffset?: number;
  },
): number | undefined {
  return getStackedModalZIndexForIndex(
    activeModalNames.indexOf(modalName),
    options,
  );
}
