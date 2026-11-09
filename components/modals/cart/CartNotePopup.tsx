"use client";

type CartNotePopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CartNotePopup({ isOpen, onClose }: CartNotePopupProps) {
  return (
    <div
      id="cart-note-popup"
      className="rbt-offcanvas-inner-popup"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`rbt-offcanvas-inner-popup-card note-popup ${
          isOpen ? "open-note-popup" : ""
        }`}
      >
        <div className="rbt-offcanvas-card-inner">
          <h6 className="rbt-title rbt-text-bold">
            <span className="mr--4">
              <i className="fa-regular fa-pen" />
            </span>
            Add note for seller
          </h6>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="rbt-input-field-grp mb--12">
              <textarea
                className="rbt-text-field"
                name="message"
                placeholder="Notes about your order, e.g. special notes for delivery."
                defaultValue={""}
              />
            </div>
            <div className="rbt-btn-group mt--16">
              <button
                type="submit"
                className="rbt-btn rbt-btn-md rbt-btn-primary d-block w-100"
              >
                Apply
              </button>
              <button
                type="button"
                className="rbt-btn rbt-btn-md rbt-btn-naked d-block w-100 mt--8 mb--8 rbt-popup-close-btn"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
