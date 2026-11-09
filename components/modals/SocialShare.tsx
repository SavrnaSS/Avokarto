"use client";

import { CloseIcon } from "../svg-icons";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import Tooltip from "@/components/common/ui/Tooltip";
import { usePathname } from "next/navigation";
import { modalSocialLinks } from "@/data/socials";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useUiElement } from "@/context/uiStore";
import { useEffect } from "react";

export default function SocialShare() {
  const { registerInputRef, getTooltip, isCopied, copyFromRef } =
    useCopyToClipboard({
      defaultTooltip: "Copy to clipboard",
      copiedTooltip: "Copied!",
    });
  const { close } = useManagedModalPanel("socialShareModal");
  const { socialSharePath, setSocialSharePath } = useUiElement();

  const pathname = usePathname();
  const sharePath = socialSharePath ?? pathname;
  const currentUrl =
    typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : "";

  useEffect(() => {
    return () => setSocialSharePath(null);
  }, [setSocialSharePath]);

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="socialShareModal"
      tabIndex={-1}
      aria-labelledby="socialShareModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered xxs-size">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <CloseIcon />
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              aria-label="Close"
              onClick={close}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-top-folder-shape-wrapper">
            <div className="rbt-bg-color-white rbt-content-trs-portion">
              <h5
                className="rbt-title mb--8 rbt-text-bold"
                id="socialShareModalLabel"
              >
                Share Options
              </h5>
              <div className="rbt-social-share-wrapper">
                <ul className="social-icon rbt-social-default mt--16 mt_sm--0 rbt-social-default-v1 lg-size justify-content-start">
                  {modalSocialLinks.map((social) => (
                    <li key={social.id}>
                      <a
                        className={social.className}
                        href={social.url}
                        target={
                          social.url.startsWith("mailto") ? undefined : "_blank"
                        }
                        rel={
                          social.url.startsWith("mailto")
                            ? undefined
                            : "noopener noreferrer"
                        }
                        aria-label={social.name}
                      >
                        <i className={social.icon} />
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="rbt-copy-link-part rbt-text-copy-activation mt--24 mt_sm--8 w-100">
                  <input
                    ref={registerInputRef("social-share-link")}
                    className="rbt-copy-value-field w-100"
                    type="text"
                    value={currentUrl}
                    readOnly
                  />
                  <Tooltip
                    content={getTooltip("social-share-link")}
                    placement="top"
                    forceOpen={isCopied("social-share-link")}
                    sideOffset={10}
                  >
                    <button
                      onClick={() => void copyFromRef("social-share-link")}
                      className="rbt-btn rbt-btn-xs has-left-icon rbt-copy-btn"
                      type="button"
                    >
                      <i className="fa-regular fa-copy" />
                      <span className="rbt-btn-text ml--4">
                        {isCopied("social-share-link") ? "Copied!" : "Copy"}
                      </span>
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
