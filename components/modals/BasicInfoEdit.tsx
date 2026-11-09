"use client";
import { CloseIcon } from "../svg-icons";
import { FormEvent, useState } from "react";
import SearchableDropdown from "@/components/common/select/SearchableDropdown";
import RbtDatePickerField from "@/components/common/select/RbtDatePickerField";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import type { CustomerProfile } from "@/hooks/use-customer-profile";

function splitName(name: string) {
  const trimmed = name.trim();
  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: "" };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1),
  };
}

export default function BasicInfoEdit({
  profile,
  onSaved,
}: {
  profile: CustomerProfile | null;
  onSaved: () => void;
}) {
  const languageOptions = ["English", "Japanese", "Portuguese", "Bengali"];
  const { firstName: initialFirst, lastName: initialLast } = splitName(
    profile?.name ?? "",
  );
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [selectedLanguage, setSelectedLanguage] = useState(
    profile?.locale || "English",
  );
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(
    profile?.dateOfBirth ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { close } = useManagedModalPanel("basicInfoEditModal");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/account/profile", {
        body: JSON.stringify({
          dateOfBirth,
          locale: selectedLanguage,
          name: `${firstName} ${lastName}`.trim(),
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Unable to save basic info.");
      }

      onSaved();
      close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save basic info.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="basicInfoEditModal"
      tabIndex={-1}
      aria-labelledby="basicInfoEditModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered rbt-cart-edit-area">
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
            {/* Start Component Area */}
            <div className="rbt-single-product-area rbt-bg-color-white rbt-content-trs-portion">
              <h5 className="rbt-title rbt-modal-title mb--24">
                Change basic information
              </h5>
              <form onSubmit={handleSubmit}>
                <div className="row row--12 mt_dec--24">
                  <div className="col-md-6 mt--24">
                    <label htmlFor="first_name" className="form-label">
                      First name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="last_name" className="form-label">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="language" className="form-label">
                      Language
                    </label>
                    <div className="rbt-input-field-grp mb--0">
                      <div className="rbt-dropdown-select filter-select rbt-modern-select rbt-bordered-style search-by-category w-100">
                        <SearchableDropdown
                          options={languageOptions}
                          selected={selectedLanguage}
                          onChange={setSelectedLanguage}
                          placeholder="Select Language"
                          searchPlaceholder="Search Language"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mt--24">
                    <label htmlFor="birth_date" className="form-label">
                      Birth Date
                    </label>
                    <RbtDatePickerField
                      id="birth_date"
                      defaultValue={
                        dateOfBirth
                          ? new Date(dateOfBirth).toLocaleDateString("en-US")
                          : undefined
                      }
                      onDateChange={setDateOfBirth}
                    />
                  </div>
                  {error ? (
                    <div className="col-12">
                      <p className="rbt-form-error mb--0">{error}</p>
                    </div>
                  ) : null}
                  <div className="col-12">
                    <div className="d-flex rbt-gap--16">
                      <button
                        type="button"
                        className="rbt-btn rbt-btn-secondary rbt-btn-md rbt-square-btn mt--24"
                        aria-label="Close"
                        onClick={close}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rbt-btn rbt-btn-md rbt-square-btn mt--24"
                        disabled={submitting}
                      >
                        {submitting ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* End Component Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
