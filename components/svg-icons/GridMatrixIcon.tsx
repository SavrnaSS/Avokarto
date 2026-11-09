import React from 'react';

export const GridMatrixIcon = (_props: React.SVGProps<SVGSVGElement>) => (
  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={52}
                    height={50}
                    viewBox="0 0 52 50"
                    // See WaveSquareIcon.tsx for why this is needed - keeps
                    // the curve flush with the tab's full height even when a
                    // narrower widget overrides --shape-width.
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      className="rbt-svg-fill-one"
                      d="M0.505402 49.9854C116.894 49.9991 -64.388 49.9777 52 49.9914C52 31.2633 52 20.7632 52 2.03504C40.8 1.63545 35.5357 4.56594 32.5357 10.5615L22.0357 38.5324C18.0017 47.9353 6.6182 49.4495 0.505402 49.9854Z"
                    />
                    <path
                      className="rbt-svg-fill-two"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M38.793 1.97666C35.457 3.50832 33.2276 5.91092 31.6412 9.08146L31.6178 9.1283L21.1076 37.1263C18.9861 42.0545 15.232 44.7995 11.3024 46.3063C7.3457 47.8234 3.2411 48.0696 0.566002 47.9886C0.566002 47.9886 0.529102 49.2057 0.505402 49.9856C3.3303 50.0711 7.7257 49.8177 12.019 48.1715C16.3338 46.5171 20.5747 43.4403 22.9549 37.8925L22.9639 37.8713C22.9639 37.8713 32.0421 12.7293 33.4534 9.92838C34.8648 7.12739 36.7799 5.09976 39.6283 3.79203C43.5435 1.50049 52 2.03525 52 2.03525C52 20.7634 52 31.2635 52 49.9916L51.9982 0.0363376C46.331 -0.164216 42.0898 0.46304 38.793 1.97666Z"
                    />
                  </svg>
);
