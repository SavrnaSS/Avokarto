"use client";

import Image from "next/image";
import { UserRound, X } from "lucide-react";
import { useState } from "react";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { getProductRegistrationMessage } from "@/lib/productRegistrationCopy";
import type { Product } from "@/types/product";
import styles from "./GuestRegistrationBanner.module.css";

export default function GuestRegistrationBanner({ product }: { product: Product }) {
  const isGuest = useCustomerSession(
    (state) => state.hydrated && !state.loading && !state.customer,
  );
  const productKey = String(product.catalogId ?? product.slug ?? product.id);
  const [dismissedProduct, setDismissedProduct] = useState<string | null>(null);

  // The shared layout checks the session. Do not fetch again or briefly show
  // a registration prompt to an existing customer while that check is pending.
  if (!isGuest || dismissedProduct === productKey) return null;

  return (
    <aside
      className={`${styles.banner} rbt-bg-color-brand-300 rbt-rounded--8`}
      aria-label="Create an Avokarto account"
      data-testid="guest-registration-banner"
    >
      <div className={styles.content}>
        <Image
          className={styles.gift}
          alt=""
          src="/assets/images/icons/product-single/gift-box-register.webp"
          width={44}
          height={44}
          unoptimized
        />
        <p className={styles.message}>{getProductRegistrationMessage(product)}</p>
      </div>
      <ModalTriggerButton
        className={`${styles.register} rbt-btn rbt-btn-xs`}
        openModalName="signupModal"
      >
        <UserRound size={18} aria-hidden="true" />
        Register Now
      </ModalTriggerButton>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss registration invitation"
        onClick={() => setDismissedProduct(productKey)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
