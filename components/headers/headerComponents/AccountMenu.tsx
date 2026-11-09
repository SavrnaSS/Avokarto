"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, LogOut, Package, Star, Store, UserRound } from "lucide-react";
import { useCustomerSession, type Customer } from "@/hooks/use-customer-session";
import { avatarHueFor, initialsFor } from "@/lib/customerAvatar";
import styles from "./AccountMenu.module.css";

const MENU_ITEMS = [
  { href: "/my-order-history", label: "My Orders", Icon: Package },
  { href: "/my-wishlist", label: "Wishlist", Icon: Heart },
  { href: "/my-reviews", label: "My Reviews", Icon: Star },
  { href: "/account-info", label: "Account Info", Icon: UserRound },
  { href: "/seller", label: "My Store / Sell", Icon: Store },
];

/** Class for the dropdown's toggle: brand focus ring and an "open" state. */
export const accountTriggerClass = styles.trigger;

/**
 * Signed-in account dropdown shared by AccountIconButton and AccountAccessBox.
 * Rendered as the `.dropdown-menu` sibling of a `data-bs-toggle="dropdown"`
 * trigger; Bootstrap's dropdown JS handles open/close and positioning.
 */
export default function AccountMenu({ customer }: { customer: Customer }) {
  const logout = useCustomerSession((state) => state.logout);
  const [signingOut, setSigningOut] = useState(false);
  const hue = avatarHueFor(customer.sub);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ul className={`dropdown-menu dropdown-menu-end ${styles.menu}`}>
      <li className={styles.profile}>
        <span
          className={styles.avatar}
          style={{
            background: `hsl(${hue}, 55%, 90%)`,
            color: `hsl(${hue}, 45%, 32%)`,
          }}
          aria-hidden="true"
        >
          {initialsFor(customer.name)}
        </span>
        <span className={styles.identity}>
          <span className={styles.name}>{customer.name}</span>
          <span className={styles.email}>{customer.email}</span>
        </span>
      </li>
      {MENU_ITEMS.map(({ href, label, Icon }) => (
        <li key={href}>
          <Link className={`dropdown-item ${styles.item}`} href={href}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        </li>
      ))}
      <li className={styles.divider} role="separator" />
      <li>
        <button
          className={`dropdown-item ${styles.item} ${styles.signOut}`}
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          type="button"
        >
          <LogOut size={18} aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign Out"}
        </button>
      </li>
    </ul>
  );
}
