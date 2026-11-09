"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp, ListFilter } from "lucide-react";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useCustomerOrders } from "@/hooks/use-customer-orders";
import { useCustomerSession } from "@/hooks/use-customer-session";
import styles from "./Orders.module.css";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";

const STATUS_LABELS: Record<string, string> = {
  cancelled: "Cancelled",
  completed: "Delivered",
  delivering: "In Progress",
  failed: "Failed",
  pending: "Pending",
};

const STATUS_CLASSES: Record<string, string> = {
  cancelled: "rbt-badge rbt-badge-bg-danger rbt-badge-border rbt-badge-md rbt-badge-rounded",
  completed: "rbt-badge rbt-badge-bg-green rbt-badge-border rbt-badge-md rbt-badge-rounded",
  delivering: "rbt-badge rbt-badge-bg-warning rbt-badge-border rbt-badge-md rbt-badge-rounded",
  failed: "rbt-badge rbt-badge-bg-danger rbt-badge-border rbt-badge-md rbt-badge-rounded",
  pending: "rbt-badge rbt-badge-bg-warning rbt-badge-border rbt-badge-md rbt-badge-rounded",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Orders() {
  const customer = useCustomerSession((state) => state.customer);
  const sessionLoading = useCustomerSession((state) => state.loading);
  const { error, loading, orders } = useCustomerOrders();
  const orderStatusOptions = [
    "Select Status",
    "Pending",
    "In Progress",
    "Delivered",
    "Cancelled",
    "Failed",
  ];
  const [selectedStatus, setSelectedStatus] = useState("Select Status");

  const visibleOrders = useMemo(() => {
    if (selectedStatus === "Select Status") {
      return orders;
    }

    return orders.filter(
      (order) => STATUS_LABELS[order.status] === selectedStatus,
    );
  }, [orders, selectedStatus]);

  if (!sessionLoading && !customer) {
    return (
      <div className={`rbt-profile-content-area ${styles.panel}`}>
        <div className="rbt-component-section-title rbt-gap--4 mb--0 p-0 border-0">
          <h2 className={styles.title}>
            <span className="rbt-text-bold">My orders</span>
          </h2>
        </div>
        <hr className="mt--24" />
        <p className="mt--16">
          Sign in to view your order history.{" "}
          <ModalTriggerButton
            className="rbt-switch-btn"
            openModalName="signinModal"
          >
            Sign In
          </ModalTriggerButton>
        </p>
      </div>
    );
  }

  return (
    <div className={`rbt-profile-content-area ${styles.panel}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>My orders</h2>
        <Select.Root value={selectedStatus} onValueChange={setSelectedStatus}>
          <Select.Trigger
            className={styles.statusSelect}
            aria-label="Filter orders by status"
          >
            <ListFilter size={18} aria-hidden="true" className={styles.filterIcon} />
            <Select.Value />
            <Select.Icon className={styles.chevron}>
              <ChevronDown size={16} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className={styles.statusMenu}
              position="popper"
              align="end"
              sideOffset={8}
              collisionPadding={16}
            >
              <Select.ScrollUpButton className={styles.scrollButton}>
                <ChevronUp size={16} aria-hidden="true" />
              </Select.ScrollUpButton>
              <Select.Viewport className={styles.menuViewport}>
                <Select.Group>
                  <Select.Label className={styles.menuLabel}>Order status</Select.Label>
                  {orderStatusOptions.map((status) => (
                    <Select.Item className={styles.statusOption} key={status} value={status}>
                      <Select.ItemText>
                        {status === "Select Status" ? "All statuses" : status}
                      </Select.ItemText>
                      <Select.ItemIndicator className={styles.selectedIcon}>
                        <Check size={16} aria-hidden="true" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton className={styles.scrollButton}>
                <ChevronDown size={16} aria-hidden="true" />
              </Select.ScrollDownButton>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
      <hr className="mt--24" />
      {error ? (
        <p role="alert" className="rbt-form-error mb--0">{error}</p>
      ) : null}
      {loading || sessionLoading ? (
        <LoadingSkeleton layout="table" count={4} label="Loading your orders" />
      ) : error && orders.length === 0 ? null : visibleOrders.length === 0 ? (
        <p role="status" className="mt--16">
          {orders.length === 0
            ? "You haven't placed any orders yet."
            : "No orders match this status."}
        </p>
      ) : (
        <div
          className={`rbt-transparent-table-one-wrapper ${styles.tableScroll}`}
          role="region"
          aria-label="Order history"
          tabIndex={0}
        >
          <table className="rbt-transparent-table-one table-variation-one m--0 mb--0">
            <thead>
              <tr>
                <th className="pt--0" scope="col">
                  <i className="fa-regular fa-hashtag mr--4" />
                  Order ID
                </th>
                <th className="pt--0" scope="col">
                  <i className="fa-regular fa-calendars mr--4" />
                  Date
                </th>
                <th className="pt--0" scope="col">
                  <i className="fa-regular fa-truck-fast mr--4" />
                  Status
                </th>
                <th className="pt--0" scope="col">
                  <i className="fa-regular fa-sack-dollar mr--4" />
                  Total Price
                </th>
                <th className="pt--0" scope="col">
                  <i className="fa-regular fa-bag-shopping mr--4" />
                  Products
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order, index) => (
                <tr key={order.orderNumber}>
                  <td className={index === visibleOrders.length - 1 ? "pb--0" : undefined}>
                    <div className="cart-product-card">
                      <div className="d-flex flex-column">
                        <span className="rbt-product-id rbt-cursor-pointer">
                          <span className="rbt-text-semi-bold">Order:</span>
                          #{order.orderNumber}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={index === visibleOrders.length - 1 ? "pb--0" : undefined}>
                    <span>{formatDate(order.createdAt)}</span>
                  </td>
                  <td className={index === visibleOrders.length - 1 ? "pb--0" : undefined}>
                    <div className={STATUS_CLASSES[order.status] ?? STATUS_CLASSES.pending}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </div>
                  </td>
                  <td className={index === visibleOrders.length - 1 ? "pb--0" : undefined}>
                    <div>
                      <h6 className="price-text">
                        <span className="rbt-bold--text">
                          ${order.total.toFixed(2)}
                        </span>
                      </h6>
                    </div>
                  </td>
                  <td className={index === visibleOrders.length - 1 ? "pb--0" : undefined}>
                    <div className="rbt-order-sum-area rbt-order-sum-area-xm d-flex">
                      <div className="ordered-items-wrapper d-flex rbt-gap--4 align-items-center ms-auto">
                        {order.items.slice(0, 3).map((item, itemIndex) => (
                          <div
                            className="ordered-item ordered-item-01"
                            key={`${order.orderNumber}-${itemIndex}`}
                          >
                            <Image
                              alt={item.name}
                              src={item.imageUrl}
                              width={93}
                              height={93}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
