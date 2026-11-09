import React from "react";

type SvgIcon4Props = React.SVGProps<SVGSVGElement> & {
  scrolled: number;
  scrollHeight: number;
};

const CIRCUMFERENCE = 307.919;

export const ScrollTopIcon = ({
  scrolled,
  scrollHeight,
  ...props
}: SvgIcon4Props) => {
  // scrollHeight is 0 on a page with nothing to scroll (or momentarily,
  // mid-render) - scrolled/scrollHeight would divide by zero into NaN/
  // Infinity, which React rejects as an invalid strokeDashoffset value.
  // Clamping the ratio keeps this valid no matter what a caller passes.
  const ratio = scrollHeight > 0 ? Math.min(1, Math.max(0, scrolled / scrollHeight)) : 0;

  return (
    <svg
      className="rbt-back-circle svg-inner"
      width="100%"
      height="100%"
      viewBox="-1 -1 102 102"
      {...props}
    >
      <path
        d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
        style={{
          strokeDasharray: `${CIRCUMFERENCE}, ${CIRCUMFERENCE}`,
          transition: "none",
          strokeDashoffset: CIRCUMFERENCE - ratio * CIRCUMFERENCE,
        }}
      />
    </svg>
  );
};
