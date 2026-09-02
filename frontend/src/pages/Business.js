import React, { useEffect, useState } from "react";
import "./business.css";

function Business({ user, onBack, onNavigate }) {
  // =========================================================
  // API
  // =========================================================

  const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";
  // =========================================================
  // BUSINESS STATE
  // =========================================================

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFeature, setSelectedFeature] = useState(null);

  // =========================================================
  // CREATE BUSINESS FORM
  // =========================================================

  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    category: "General",
    phone: "",
    email: "",
    address: "",
    website: "",
  });

  // =========================================================
  // USER INFORMATION
  // =========================================================

  const getUserName = () => {
    return (
      user?.displayName ||
      user?.fullName ||
      user?.username ||
      user?.name ||
      "ZenvaZapp User"
    );
  };

  const getOwnerId = () => {
    return user?._id || user?.id || user?.userId;
  };

  // =========================================================
  // BUSINESS FEATURES
  // =========================================================

  const businessFeatures = [
    {
      id: "business-page",
      icon: "🏪",
      title: "Business Page",
      description:
        "Create a public page that every ZenvaZapp user can discover.",
    },
    {
      id: "product-catalog",
      icon: "📦",
      title: "Product Catalog",
      description:
        "Showcase your products and services to potential customers.",
    },
    {
      id: "customer-messages",
      icon: "💬",
      title: "Customer Messages",
      description:
        "Communicate privately with each customer through ZenvaZapp.",
    },
    {
      id: "automatic-replies",
      icon: "🤖",
      title: "Automatic Replies",
      description:
        "Automatically respond to customers when you are unavailable.",
    },
    {
      id: "marketing-status",
      icon: "📢",
      title: "Marketing Status",
      description:
        "Promote your products, services and special offers.",
    },
    {
      id: "business-analytics",
      icon: "📊",
      title: "Business Analytics",
      description:
        "Understand your customers, products and business performance.",
    },
  ];

  // =========================================================
  // LOAD MY BUSINESS FROM MONGODB
  // =========================================================

  useEffect(() => {
    const loadBusiness = async () => {
      const ownerId = getOwnerId();

      if (!ownerId) {
        setLoading(false);
        setError(
          "Unable to identify your ZenvaZapp account."
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("zenvazapp_token");

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `${API_URL}/api/businesses/owner/${encodeURIComponent(
            ownerId
          )}`,
          {
            method: "GET",
            headers,
          }
        );

        const data = await response.json();

        // ---------------------------------------------------
        // Business does not exist yet
        // ---------------------------------------------------

        if (response.status === 404) {
          setBusiness(null);
          setLoading(false);
          return;
        }

        // ---------------------------------------------------
        // Server error
        // ---------------------------------------------------

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load Business Account."
          );
        }

        // ---------------------------------------------------
        // Business exists
        // ---------------------------------------------------

        if (data?.business) {
          setBusiness(data.business);

          setFormData({
            businessName:
              data.business.businessName || "",

            description:
              data.business.description || "",

            category:
              data.business.category || "General",

            phone:
              data.business.phone || "",

            email:
              data.business.email || "",

            address:
              data.business.address || "",

            website:
              data.business.website || "",
          });
        }
      } catch (loadError) {
        console.error(
          "Load Business Account error:",
          loadError
        );

        setError(
          loadError.message ||
            "Unable to load your Business Account."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [API_URL, user]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE BUSINESS ACCOUNT
  // =========================================================

  const handleCreateBusiness = async (event) => {
    event.preventDefault();

    const ownerId = getOwnerId();

    if (!ownerId) {
      setError(
        "Unable to identify your ZenvaZapp account."
      );
      return;
    }

    if (!formData.businessName.trim()) {
      setError(
        "Please enter your business name."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("zenvazapp_token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/businesses`,
        {
          method: "POST",
          headers,

          body: JSON.stringify({
            ownerId,

            businessName:
              formData.businessName.trim(),

            description:
              formData.description.trim(),

            category:
              formData.category.trim() ||
              "General",

            phone:
              formData.phone.trim(),

            email:
              formData.email.trim(),

            address:
              formData.address.trim(),

            website:
              formData.website.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create Business Account."
        );
      }

      if (!data?.business) {
        throw new Error(
          "Business Account was created but no business data was returned."
        );
      }

      setBusiness(data.business);

      setSuccess(
        "Your ZenvaZapp Business Account has been created successfully."
      );
    } catch (createError) {
      console.error(
        "Create Business Account error:",
        createError
      );

      setError(
        createError.message ||
          "Unable to create Business Account."
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // BUSINESS FEATURE CLICK
  // =========================================================

  const handleFeatureClick = (featureId) => {
    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // MARKETING STATUS
    // -------------------------------------------------------

    if (featureId === "marketing-status") {
      if (typeof onNavigate === "function") {
        onNavigate("marketing");
      }

      return;
    }

    // -------------------------------------------------------
    // OTHER FEATURES
    // -------------------------------------------------------

    const selected = businessFeatures.find(
      (feature) => feature.id === featureId
    );

    if (selected) {
      setSelectedFeature(selected);
    }
  };

  // =========================================================
  // CLOSE FEATURE INFORMATION
  // =========================================================

  const closeFeatureInformation = () => {
    setSelectedFeature(null);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="zenvazapp-business-page">

        <header className="zenvazapp-business-header">
          <div className="zenvazapp-business-header-left">

            <button
              type="button"
              className="zenvazapp-business-back"
              onClick={onBack}
              aria-label="Back"
              title="Back"
            >
              ←
            </button>

            <div>
              <h1>Business</h1>

              <p>
                Grow your business with ZenvaZapp
              </p>
            </div>

          </div>

          <div className="zenvazapp-business-brand">
            <span>Zz</span>
          </div>
        </header>

        <main className="zenvazapp-business-content">

          <section className="zenvazapp-business-create-card">

            <div className="zenvazapp-business-create-icon">
              🏪
            </div>

            <h2>
              Loading your Business Account...
            </h2>

            <p>
              ZenvaZapp is checking your business
              account.
            </p>

          </section>

        </main>

        <BusinessNavigation
          onNavigate={onNavigate}
        />

      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="zenvazapp-business-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="zenvazapp-business-header">

        <div className="zenvazapp-business-header-left">

          <button
            type="button"
            className="zenvazapp-business-back"
            onClick={onBack}
            aria-label="Back"
            title="Back"
          >
            ←
          </button>

          <div>
            <h1>Business</h1>

            <p>
              Grow your business with ZenvaZapp
            </p>
          </div>

        </div>

        <div className="zenvazapp-business-brand">
          <span>Zz</span>
        </div>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="zenvazapp-business-content">

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="zenvazapp-business-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (
          <div
            className="zenvazapp-business-message success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* ===================================================
            FEATURE INFORMATION
        =================================================== */}

        {selectedFeature && (
          <section className="zenvazapp-business-feature-info">

            <div className="zenvazapp-business-feature-info-icon">
              {selectedFeature.icon}
            </div>

            <div className="zenvazapp-business-feature-info-content">

              <span className="zenvazapp-business-label">
                BUSINESS TOOL
              </span>

              <h2>
                {selectedFeature.title}
              </h2>

              <p>
                {selectedFeature.description}
              </p>

              <p>
                This Business feature is now part of
                the ZenvaZapp Business dashboard and
                will be connected to its full backend
                functionality as we build the Business
                system.
              </p>

              <button
                type="button"
                className="zenvazapp-business-create-button"
                onClick={closeFeatureInformation}
              >
                Back to Business Tools
              </button>

            </div>

          </section>
        )}

        {/* ===================================================
            CREATE BUSINESS ACCOUNT
        =================================================== */}

        {!business ? (

          <section className="zenvazapp-business-create-card">

            <div className="zenvazapp-business-create-icon">
              🏪
            </div>

            <h2>
              Create your Business Account
            </h2>

            <p>
              Turn your ZenvaZapp account into a
              place where customers can discover
              your business, view your products and
              contact you privately.
            </p>

            {/* =============================================
                BENEFITS
            ============================================= */}

            <div className="zenvazapp-business-benefits">

              <div>
                <span>🌍</span>

                <strong>
                  Reach more people
                </strong>

                <small>
                  Your public business page can be
                  discovered by ZenvaZapp users.
                </small>
              </div>

              <div>
                <span>💬</span>

                <strong>
                  Private customer chats
                </strong>

                <small>
                  Each customer's conversation
                  remains private.
                </small>
              </div>

              <div>
                <span>📈</span>

                <strong>
                  Grow your business
                </strong>

                <small>
                  Promote products and understand
                  your audience.
                </small>
              </div>

            </div>

            {/* =============================================
                CREATE FORM
            ============================================= */}

            <form
              className="zenvazapp-business-form"
              onSubmit={handleCreateBusiness}
            >

              <div className="zenvazapp-business-form-field">

                <label htmlFor="businessName">
                  Business Name *
                </label>

                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleFormChange}
                  placeholder="Enter your business name"
                  required
                  disabled={creating}
                />

              </div>

              <div className="zenvazapp-business-form-field">

                <label htmlFor="category">
                  Business Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  disabled={creating}
                >

                  <option value="General">
                    General
                  </option>

                  <option value="Retail">
                    Retail
                  </option>

                  <option value="Food & Restaurant">
                    Food & Restaurant
                  </option>

                  <option value="Fashion">
                    Fashion
                  </option>

                  <option value="Technology">
                    Technology
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Health">
                    Health
                  </option>

                  <option value="Beauty">
                    Beauty
                  </option>

                  <option value="Transportation">
                    Transportation
                  </option>

                  <option value="Professional Services">
                    Professional Services
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

              <div className="zenvazapp-business-form-field">

                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Tell customers about your business"
                  rows="4"
                  disabled={creating}
                />

              </div>

              <div className="zenvazapp-business-form-row">

                <div className="zenvazapp-business-form-field">

                  <label htmlFor="phone">
                    Business Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Business phone"
                    disabled={creating}
                  />

                </div>

                <div className="zenvazapp-business-form-field">

                  <label htmlFor="email">
                    Business Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Business email"
                    disabled={creating}
                  />

                </div>

              </div>

              <div className="zenvazapp-business-form-field">

                <label htmlFor="address">
                  Business Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Business location"
                  disabled={creating}
                />

              </div>

              <div className="zenvazapp-business-form-field">

                <label htmlFor="website">
                  Website
                </label>

                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleFormChange}
                  placeholder="https://example.com"
                  disabled={creating}
                />

              </div>

              <button
                type="submit"
                className="zenvazapp-business-create-button"
                disabled={creating}
              >
                {creating
                  ? "Creating Business Account..."
                  : "Create Business Account"}
              </button>

            </form>

            <small className="zenvazapp-business-account-note">
              Currently signed in as {getUserName()}
            </small>

          </section>

        ) : (

          <>
            {/* =============================================
                BUSINESS ACCOUNT HEADER
            ============================================= */}

            <section className="zenvazapp-business-account-card">

              <div className="zenvazapp-business-account-icon">
                🏪
              </div>

              <div className="zenvazapp-business-account-info">

                <span className="zenvazapp-business-label">
                  BUSINESS ACCOUNT
                </span>

                <h2>
                  {business.businessName ||
                    "My Business"}
                </h2>

                <p>
                  {business.description ||
                    "Your business tools are ready to be configured."}
                </p>

              </div>

              <span className="zenvazapp-business-status">
                {business.isActive
                  ? "Active"
                  : "Inactive"}
              </span>

            </section>

            {/* =============================================
                BUSINESS DETAILS
            ============================================= */}

            <section className="zenvazapp-business-details-card">

              <div>
                <strong>
                  Category
                </strong>

                <span>
                  {business.category ||
                    "General"}
                </span>
              </div>

              {business.phone && (
                <div>
                  <strong>
                    Phone
                  </strong>

                  <span>
                    {business.phone}
                  </span>
                </div>
              )}

              {business.email && (
                <div>
                  <strong>
                    Email
                  </strong>

                  <span>
                    {business.email}
                  </span>
                </div>
              )}

              {business.address && (
                <div>
                  <strong>
                    Address
                  </strong>

                  <span>
                    {business.address}
                  </span>
                </div>
              )}

              {business.website && (
                <div>
                  <strong>
                    Website
                  </strong>

                  <span>
                    {business.website}
                  </span>
                </div>
              )}

            </section>

            {/* =============================================
                BUSINESS TOOLS
            ============================================= */}

            {!selectedFeature && (
              <section className="zenvazapp-business-tools">

                <div className="zenvazapp-business-section-heading">

                  <h2>
                    Business Tools
                  </h2>

                  <p>
                    Manage your business and connect
                    with customers.
                  </p>

                </div>

                <div className="zenvazapp-business-feature-grid">

                  {businessFeatures.map(
                    (feature) => (
                      <button
                        key={feature.id}
                        type="button"
                        className="zenvazapp-business-feature"
                        onClick={() =>
                          handleFeatureClick(
                            feature.id
                          )
                        }
                      >

                        <span className="zenvazapp-business-feature-icon">
                          {feature.icon}
                        </span>

                        <span className="zenvazapp-business-feature-content">

                          <strong>
                            {feature.title}
                          </strong>

                          <small>
                            {feature.description}
                          </small>

                        </span>

                        <span
                          className="zenvazapp-business-feature-arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>

                      </button>
                    )
                  )}

                </div>

              </section>
            )}

            {/* =============================================
                MONETIZATION
            ============================================= */}

            {!selectedFeature && (
              <section className="zenvazapp-business-growth-card">

                <div className="zenvazapp-business-growth-icon">
                  💰
                </div>

                <div>

                  <h2>
                    Grow and earn
                  </h2>

                  <p>
                    ZenvaZapp will provide tools
                    for businesses and creators to
                    reach customers, sell products
                    and grow their income.
                  </p>

                </div>

              </section>
            )}

          </>
        )}

      </main>

      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <BusinessNavigation
        onNavigate={onNavigate}
      />

    </div>
  );
}

// =========================================================
// BUSINESS NAVIGATION
// =========================================================

function BusinessNavigation({ onNavigate }) {
  return (
    <nav className="zenvazapp-business-bottom-nav">

      <button
        type="button"
        onClick={() =>
          onNavigate?.("chats")
        }
      >
        <span>💬</span>
        <small>Chats</small>
      </button>

      <button
        type="button"
        onClick={() =>
          onNavigate?.("contacts")
        }
      >
        <span>👥</span>
        <small>Contacts</small>
      </button>

      <button
        type="button"
        onClick={() =>
          onNavigate?.("tools")
        }
      >
        <span>🛠</span>
        <small>Tools</small>
      </button>

      <button
        type="button"
        onClick={() =>
          onNavigate?.("settings")
        }
      >
        <span>⚙️</span>
        <small>Settings</small>
      </button>

    </nav>
  );
}

export default Business;