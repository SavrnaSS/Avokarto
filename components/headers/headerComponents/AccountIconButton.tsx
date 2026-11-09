"use client";

import Tooltip from "@/components/common/ui/Tooltip";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useCustomerSession } from "@/hooks/use-customer-session";
import AccountMenu, { accountTriggerClass } from "./AccountMenu";

export default function AccountIconButton({
  className,
}: {
  className: string;
}) {
  const customer = useCustomerSession((state) => state.customer);

  if (!customer) {
    return (
      <Tooltip content="Sign In" placement="bottom">
        <ModalTriggerButton className={className} openModalName="signinModal">
          <i className="fa-regular fa-user" />
        </ModalTriggerButton>
      </Tooltip>
    );
  }

  return (
    <div className="dropdown">
      {/* No tooltip: it would sit over the open menu, which shows the name. */}
      <button
        aria-expanded="false"
        aria-label={`Account menu for ${customer.name}`}
        className={`${className} ${accountTriggerClass}`}
        data-bs-toggle="dropdown"
        type="button"
      >
        <i className="fa-solid fa-user" />
      </button>
      <AccountMenu customer={customer} />
    </div>
  );
}
