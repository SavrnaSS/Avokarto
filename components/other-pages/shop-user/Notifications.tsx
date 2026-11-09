export default function Notifications() {
  return (
    <div className="rbt-profile-content-area">
      <div className="row row--12 mt_dec--24">
        <div className="col-12 mt--24">
          <div className="rbt-component-section-title rbt-gap--4 mb--0 p-0 border-0">
            <h2 className="rbt-title mb--0">
              <span className="rbt-text-bold">Set Notifications</span>
            </h2>
          </div>
        </div>
      </div>
      <hr className="mt--20 mb--16" />
      <div className="rbt-scrollable-content hide-scrollbar mt_dec--24">
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-1"
          />
          <label htmlFor="rbt-check-1" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              Billing Alerts
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Get notified about upcoming payments, failed transactions, or
              changes in your subscription.
            </span>
          </label>
        </div>
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-2"
            defaultChecked={true}
          />
          <label htmlFor="rbt-check-2" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              Login Activity
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Receive alerts when a new device or location accesses your
              account.
            </span>
          </label>
        </div>
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-3"
          />
          <label htmlFor="rbt-check-3" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              Promotional Offers
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Get exclusive discounts, coupons, and limited-time deals.
            </span>
          </label>
        </div>
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-4"
          />
          <label htmlFor="rbt-check-4" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              Social Mentions &amp; Tags
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Stay updated when someone mentions or tags you in a comment or
              post.
            </span>
          </label>
        </div>
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-5"
          />
          <label htmlFor="rbt-check-5" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              Privacy &amp; Security Updates
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Receive alerts about policy changes or new security features.
            </span>
          </label>
        </div>
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-6"
            defaultChecked={true}
          />
          <label htmlFor="rbt-check-6" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              App Feature Updates
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Stay informed about new features and improvements in the app.
            </span>
          </label>
        </div>
        <div className="form-check mt--24">
          <input
            type="checkbox"
            className="form-check-input rbt-check-btn-top"
            id="rbt-check-7"
            defaultChecked={true}
          />
          <label htmlFor="rbt-check-7" className="form-check-label">
            <span className="d-block rbt-text-bold rbt-text-color-black">
              Review Reminders
            </span>
            <span className="rbt-text-regular rbt-text-color-body">
              Get a reminder to leave a review after purchasing a product.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
