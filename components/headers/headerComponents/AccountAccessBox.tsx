"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useCustomerSession } from "@/hooks/use-customer-session";
import AccountMenu, { accountTriggerClass } from "./AccountMenu";

// Same "Log in/Sign Up" -> real-account-dropdown pattern as AccountIconButton,
// for the headers (Header2/6/7) that render the two-line icon+text
// "rbt-access-box-wrapper" style instead of a bare icon button.
export default function AccountAccessBox() {
  const customer = useCustomerSession((state) => state.customer);

  if (!customer) {
    return (
      <ModalTriggerButton
        as="div"
        className="rbt-access-box-wrapper"
        openModalName="signinModal"
      >
        <div className="rbt-round-btn rbt-bg-static-gray">
          <i className="fa-regular fa-user" />
        </div>
        <div className="content">
          <p>Log in/Sign Up</p>
          <span>Access Account</span>
        </div>
      </ModalTriggerButton>
    );
  }

  return (
    <div className="dropdown">
      <div
        aria-expanded="false"
        className={`rbt-access-box-wrapper ${accountTriggerClass}`}
        data-bs-toggle="dropdown"
        role="button"
        tabIndex={0}
      >
        <div className="rbt-round-btn rbt-bg-static-gray">
          <i className="fa-solid fa-user" />
        </div>
        <div className="content">
          <p className="text-truncate">{customer.name}</p>
          <span>My Account</span>
        </div>
      </div>
      <AccountMenu customer={customer} />
    </div>
  );
}
