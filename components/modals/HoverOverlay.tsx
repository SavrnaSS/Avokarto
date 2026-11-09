"use client";

import { useUiElement } from "@/context/Context";

export default function HoverOverlay() {
  const { menuHoverOpen, setMenuHoverOpen, closeAll } = useUiElement();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    setMenuHoverOpen(false);
    closeAll();
  };

  return (
    <button
      type="button"
      className={`common-close_search_dropdown${
        menuHoverOpen ? " active" : ""
      }`}
      aria-label="Close opened overlays"
      onClick={handleClick}
    />
  );
}
