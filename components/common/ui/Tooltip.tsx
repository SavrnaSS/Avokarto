"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";

type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: React.ReactNode;
  placement?: TooltipSide;
  children: React.ReactNode;
  forceOpen?: boolean;
  sideOffset?: number;
}

export default function Tooltip({
  content,
  placement = "top",
  children,
  forceOpen = false,
  sideOffset = 3,
}: TooltipProps) {
  const contentKey =
    typeof content === "string" || typeof content === "number"
      ? String(content)
      : undefined;

  return (
    <RadixTooltip.Provider delayDuration={150}>
      <RadixTooltip.Root open={forceOpen ? true : undefined}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            key={contentKey}
            side={placement}
            align="center"
            sideOffset={sideOffset}
            className="rbt-tooltip-bubble"
          >
            {content}
            <RadixTooltip.Arrow className="rbt-tooltip-arrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
