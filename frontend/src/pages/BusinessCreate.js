import React, {
  useState,
} from "react";

import {
  FiArrowLeft,
  FiBriefcase,
  FiSave,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessCreate({
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
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.businessName.trim()) {
      setError(
        "Business name is required."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "zenvazapp_token"
        );

      const response =
        await fetch(
          `${API_URL}/api/businesses`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(form),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create business."
        );
      }

      onNavigate?.(
        "business-management"
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to create business."
      );
    } finally {
      setLoading(false);
    }
  };

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
              Create Business
            </h1>

            <p>
              Add another business to your account
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">
        <section className="business-suite-form-card">

          <div className="business-suite-form-intro">
            <div>
              <FiBriefcase />
            </div>

            <div>
              <span>
                NEW BUSINESS
              </span>

              <h2>
                Create your business profile
              </h2>

              <p>
                This information can later
                be edited from Business Management.
              </p>
            </div>
          </div>

          {error && (
            <div className="business-suite-alert error">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
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
                label="Business Phone"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                type="tel"
              />

              <Field
                label="Business Email"
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
                type="url"
                placeholder="https://example.com"
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
                placeholder="Tell customers about your business..."
              />
            </label>

            <button
              type="submit"
              className="business-suite-primary-button large"
              disabled={loading}
            >
              <FiSave />

              {loading
                ? "Creating..."
                : "Create Business"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <label className="business-suite-field">
      <span>
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

export default BusinessCreate;