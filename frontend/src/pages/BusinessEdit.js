import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessEdit({
  businessId,
  onBack,
  onNavigate,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [form, setForm] =
    useState({
      businessName: "",
      description: "",
      category: "General",
      phone: "",
      email: "",
      address: "",
      website: "",
      logo: "",
      coverImage: "",
      isPublic: true,
      isActive: true,
      automaticRepliesEnabled: false,
      automaticReplyMessage: "",
      marketingEnabled: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const token =
    localStorage.getItem(
      "zenvazapp_token"
    );

  const headers = {
    "Content-Type":
      "application/json",
    Authorization:
      `Bearer ${token}`,
  };

  useEffect(() => {
    const loadBusiness =
      async () => {
        if (!businessId) {
          setError(
            "Business was not selected."
          );

          setLoading(false);

          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/businesses/${businessId}/manage`,
              {
                headers,
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Failed to load business."
            );
          }

          const business =
            data.business;

          setForm({
            businessName:
              business.businessName ||
              "",
            description:
              business.description ||
              "",
            category:
              business.category ||
              "General",
            phone:
              business.phone || "",
            email:
              business.email || "",
            address:
              business.address || "",
            website:
              business.website || "",
            logo:
              business.logo || "",
            coverImage:
              business.coverImage ||
              "",
            isPublic:
              business.isPublic !== false,
            isActive:
              business.isActive !== false,
            automaticRepliesEnabled:
              Boolean(
                business.automaticRepliesEnabled
              ),
            automaticReplyMessage:
              business.automaticReplyMessage ||
              "",
            marketingEnabled:
              Boolean(
                business.marketingEnabled
              ),
          });
        } catch (err) {
          setError(
            err.message ||
              "Failed to load business."
          );
        } finally {
          setLoading(false);
        }
      };

    loadBusiness();
  }, [businessId]);

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const saveBusiness =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/businesses/${businessId}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify(
                form
              ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to update business."
          );
        }

        onNavigate?.(
          "business-management"
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to update business."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <Shell onBack={onBack}>
        <div className="business-suite-loading">
          Loading business...
        </div>
      </Shell>
    );
  }

  return (
    <Shell onBack={onBack}>
      <div className="business-suite-page-heading">
        <div>
          <span>
            BUSINESS SETTINGS
          </span>

          <h2>
            Edit Business
          </h2>
        </div>
      </div>

      {error && (
        <div className="business-suite-alert error">
          {error}
        </div>
      )}

      <form
        className="business-suite-form-card"
        onSubmit={saveBusiness}
      >
        <div className="business-suite-form-grid">
          <Field
            label="Business Name"
            name="businessName"
            value={
              form.businessName
            }
            onChange={
              handleChange
            }
            required
          />

          <Field
            label="Category"
            name="category"
            value={
              form.category
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Phone"
            name="phone"
            value={
              form.phone
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Email"
            name="email"
            value={
              form.email
            }
            onChange={
              handleChange
            }
            type="email"
          />

          <Field
            label="Address"
            name="address"
            value={
              form.address
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Website"
            name="website"
            value={
              form.website
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Logo URL"
            name="logo"
            value={
              form.logo
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Cover Image URL"
            name="coverImage"
            value={
              form.coverImage
            }
            onChange={
              handleChange
            }
          />
        </div>

        <label className="business-suite-field full">
          <span>
            Description
          </span>

          <textarea
            name="description"
            value={
              form.description
            }
            onChange={
              handleChange
            }
            rows="5"
          />
        </label>

        <div className="business-suite-settings-grid">

          <Toggle
            name="isPublic"
            checked={
              form.isPublic
            }
            onChange={
              handleChange
            }
            title="Public Business"
            description="Allow ZenvaZapp users to discover this business."
          />

          <Toggle
            name="isActive"
            checked={
              form.isActive
            }
            onChange={
              handleChange
            }
            title="Business Active"
            description="Keep this business active on ZenvaZapp."
          />

          <Toggle
            name="automaticRepliesEnabled"
            checked={
              form.automaticRepliesEnabled
            }
            onChange={
              handleChange
            }
            title="Automatic Replies"
            description="Enable automatic replies for business communication."
          />

          <Toggle
            name="marketingEnabled"
            checked={
              form.marketingEnabled
            }
            onChange={
              handleChange
            }
            title="Marketing"
            description="Enable business marketing features."
          />

        </div>

        <label className="business-suite-field full">
          <span>
            Automatic Reply Message
          </span>

          <textarea
            name="automaticReplyMessage"
            value={
              form.automaticReplyMessage
            }
            onChange={
              handleChange
            }
            rows="4"
            placeholder="Thank you for contacting us. We will respond shortly."
          />
        </label>

        <button
          type="submit"
          className="business-suite-primary-button large"
          disabled={saving}
        >
          <FiSave />

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </form>
    </Shell>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="business-suite-toggle">
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
    </label>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="business-suite-field">
      <span>{label}</span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </label>
  );
}

function Shell({
  children,
  onBack,
}) {
  return (
    <div className="business-suite-page">
      <header className="business-suite-header">
        <div className="business-suite-header-left">
          <button
            type="button"
            className="business-suite-back"
            onClick={onBack}
          >
            <FiArrowLeft />
          </button>

          <div>
            <span className="business-suite-eyebrow">
              PRIVATE
            </span>

            <h1>
              Business
            </h1>

            <p>
              Business profile settings
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">
        {children}
      </main>
    </div>
  );
}

export default BusinessEdit;