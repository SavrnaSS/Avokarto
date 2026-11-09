import React from 'react';

type SvgIcon39Props = React.SVGProps<SVGSVGElement> & { circumference: number; offset: number };

export const CircleProgressIcon = ({ circumference, offset, ...props }: SvgIcon39Props) => (
  <svg {...props} viewBox="0 0 100 100" style={{ display: "block", width: "100%" }}>
        <path
          d="M 50,50 m 0,-42 a 42,42 0 1 1 0,84 a 42,42 0 1 1 0,-84"
          stroke="#24BD25"
          strokeWidth={4}
          fillOpacity={0}
          style={{
            strokeDasharray: `${circumference}, ${circumference}`,
            strokeDashoffset: offset,
          }}
        />
      </svg>
);
