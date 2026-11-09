"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";
import ModalTriggerButton from "../../action-buttons/ModalTriggerButton";
import BasicInfoEdit from "@/components/modals/BasicInfoEdit";
import ContactInfoEdit from "@/components/modals/ContactInfoEdit";
import PasswordEdit from "@/components/modals/PasswordEdit";
import DeliveryEdit from "@/components/modals/DeliveryEdit";
import AlternativeDelivery from "@/components/modals/AlternativeDelivery";
import SingleManagedModalLayer from "@/components/common/modals/SingleManagedModalLayer";
import { ModalName } from "@/types/modal";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useCustomerSession } from "@/hooks/use-customer-session";

function formatDate(iso: string | null) {
  if (!iso) {
    return "Not set";
  }

  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatAddress(address: {
  address1: string;
  city: string;
  country: string;
  postcode: string;
}) {
  const parts = [address.address1, address.city, address.postcode, address.country].filter(
    Boolean,
  );

  return parts.length ? parts.join(", ") : "Not set";
}

export default function AccountInfo() {
  const router = useRouter();
  const customer = useCustomerSession((state) => state.customer);
  const sessionLoading = useCustomerSession((state) => state.loading);
  const logout = useCustomerSession((state) => state.logout);
  const { error, loading, profile, refresh } = useCustomerProfile();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "Delete your account? You can reactivate it instantly just by signing back in.",
      )
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/account", {
        credentials: "same-origin",
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete account.");
      }

      await logout();
      router.push("/");
    } catch (requestError) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete account.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!sessionLoading && !customer) {
    return (
      <div className="rbt-profile-content-area">
        <div className="rbt-component-section-title rbt-gap--4 mb--0 p-0 border-0">
          <h2 className="rbt-title mb--0">
            <span className="rbt-text-bold">Personal Information</span>
          </h2>
        </div>
        <hr className="mt--20 mb--16" />
        <p>
          Sign in to view and manage your account info.{" "}
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
    <div className="rbt-profile-content-area">
      <div className="row row--12 mt_dec--24">
        <div className="col-12 mt--24">
          <div className="rbt-component-section-title rbt-gap--4 mb--0 p-0 border-0">
            <h2 className="rbt-title mb--0">
              <span className="rbt-text-bold">Personal Information</span>
            </h2>
          </div>
        </div>
      </div>
      <hr className="mt--20 mb--16" />
      {loading || sessionLoading ? (
        <LoadingSkeleton layout="table" count={5} label="Loading your account info" />
      ) : error || !profile ? (
        <p className="rbt-form-error mb--0">
          {error ?? "Unable to load account info."}
        </p>
      ) : (
        <div className="rbt-scrollable-content hide-scrollbar">
          <div className="rbt-single-info mb--24">
            <div className="rbt-single-info-header d-flex justify-content-between align-items-center mb--12 pt--4">
              <h6 className="mb--0">Basic Info</h6>
              <ModalTriggerButton
                className="rbt-btn rbt-btn-sm rbt-btn-secondary"
                openModalName={ModalName.basicInfoEditModal}
              >
                <i className="fa-light fa-pen-to-square mr--4" />
                Edit
              </ModalTriggerButton>
            </div>
            <p className="b1 rbt-text-medium mb--8">{profile.name}</p>
            <p className="b1 mb--8">{formatDate(profile.dateOfBirth)}</p>
            <p className="b1 mb--0">{profile.locale}</p>
          </div>
          <hr />
          <div className="rbt-single-info mb--24">
            <div className="rbt-single-info-header d-flex justify-content-between align-items-center mb--12 pt--4">
              <h6 className="mb--0">Contact Info</h6>
              <ModalTriggerButton
                className="rbt-btn rbt-btn-sm rbt-btn-secondary"
                openModalName={ModalName.contactInfoEditModal}
              >
                <i className="fa-light fa-pen-to-square mr--4" />
                Edit
              </ModalTriggerButton>
            </div>
            <p className="b1 mb--8">{profile.email}</p>
            <p className="b1 mb--0">{profile.phone || "Not set"}</p>
          </div>
          <hr />
          <div className="rbt-single-info mb--24">
            <div className="rbt-single-info-header d-flex justify-content-between align-items-center mb--12 pt--4">
              <h6 className="mb--0">Password</h6>
              <ModalTriggerButton
                className="rbt-btn rbt-btn-sm rbt-btn-secondary"
                openModalName={ModalName.passwordEditModal}
              >
                <i className="fa-light fa-pen-to-square mr--4" />
                Edit
              </ModalTriggerButton>
            </div>
            <p className="b1 mb--8">**********</p>
          </div>
          <hr />
          <div className="rbt-single-info mb--24">
            <div className="rbt-single-info-header d-flex justify-content-between align-items-center mb--12 pt--4">
              <h6 className="mb--0">Delivery Address</h6>
              <ModalTriggerButton
                className="rbt-btn rbt-btn-sm rbt-btn-secondary"
                openModalName={ModalName.deliveryAddressEditModal}
              >
                <i className="fa-light fa-pen-to-square mr--4" />
                Edit
              </ModalTriggerButton>
            </div>
            <p className="b1 mb--0">{formatAddress(profile.defaultAddress)}</p>
          </div>
          <hr />
          <div className="rbt-single-info mb--24">
            <div className="rbt-single-info-header d-flex justify-content-between align-items-center mb--12 pt--4">
              <h6 className="mb--0">Alternate Delivery Address</h6>
              <ModalTriggerButton
                className="rbt-btn rbt-btn-sm rbt-btn-secondary"
                openModalName={ModalName.alternateDeliveryAddressEditModal}
              >
                <i className="fa-light fa-pen-to-square mr--4" />
                Edit
              </ModalTriggerButton>
            </div>
            <p className="b1 mb--0">{formatAddress(profile.alternateAddress)}</p>
          </div>
          <hr />
          <div className="rbt-single-info mb--24">
            <div className="rbt-single-info-header d-flex justify-content-between align-items-center mb--12 pt--4">
              <h6 className="mb--0">Delete Account</h6>
            </div>
            <p className="b1 mb--8">
              Deleting your account deactivates it instantly. Sign back in
              with your email and password any time to reactivate it.
            </p>
            {deleteError ? (
              <p className="rbt-form-error mb--8">{deleteError}</p>
            ) : null}
            <button
              className="rbt-btn rbt-btn-sm rbt-bg-color-danger mt--16 shadow-none"
              disabled={deleting}
              onClick={() => void handleDeleteAccount()}
              type="button"
            >
              <i className="fa-regular fa-trash-can-slash mr--4" />
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      )}
      <SingleManagedModalLayer modalName={ModalName.basicInfoEditModal}>
        <BasicInfoEdit profile={profile} onSaved={refresh} />
      </SingleManagedModalLayer>
      <SingleManagedModalLayer modalName={ModalName.contactInfoEditModal}>
        <ContactInfoEdit profile={profile} onSaved={refresh} />
      </SingleManagedModalLayer>
      <SingleManagedModalLayer modalName={ModalName.passwordEditModal}>
        <PasswordEdit />
      </SingleManagedModalLayer>
      <SingleManagedModalLayer modalName={ModalName.deliveryAddressEditModal}>
        <DeliveryEdit profile={profile} onSaved={refresh} />
      </SingleManagedModalLayer>
      <SingleManagedModalLayer
        modalName={ModalName.alternateDeliveryAddressEditModal}
      >
        <AlternativeDelivery profile={profile} onSaved={refresh} />
      </SingleManagedModalLayer>
    </div>
  );
}
