import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiPlus,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiPower,
  FiPackage,
  FiFileText,
  FiBarChart2,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessManagement({
  user,
  onBack,
  onNavigate,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [businesses, setBusinesses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const getOwnerId = () =>
    user?._id ||
    user?.id ||
    user?.userId;

  const getHeaders = () => {
    const token =
      localStorage.getItem(
        "zenvazapp_token"
      );

    return {
      "Content-Type":
        "application/json",

      ...(token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {}),
    };
  };

  const loadBusinesses = async () => {
    const ownerId = getOwnerId();

    if (!ownerId) {
      setError(
        "Your account could not be identified."
      );

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/businesses/owner/${encodeURIComponent(
          ownerId
        )}`,
        {
          headers: getHeaders(),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load businesses."
        );
      }

      setBusinesses(
        Array.isArray(data.businesses)
          ? data.businesses
          : data.business
          ? [data.business]
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load businesses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStatus = async (
    business
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/businesses/${business._id}/status`,
          {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({
              isActive:
                !business.isActive,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update status."
        );
      }

      setBusinesses(
        (previous) =>
          previous.map((item) =>
            item._id === business._id
              ? data.business
              : item
          )
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update status."
      );
    }
  };

  const togglePublic = async (
    business
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/businesses/${business._id}/status`,
          {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({
              isPublic:
                !business.isPublic,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update visibility."
        );
      }

      setBusinesses(
        (previous) =>
          previous.map((item) =>
            item._id === business._id
              ? data.business
              : item
          )
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update visibility."
      );
    }
  };

  if (loading) {
    return (
      <BusinessManagementShell
        onBack={onBack}
      >
        <div className="business-suite-loading">
          Loading your businesses...
        </div>
      </BusinessManagementShell>
    );
  }

  return (
    <BusinessManagementShell
      onBack={onBack}
    >
      <div className="business-suite-page-heading">
        <div>
          <span>
            PRIVATE MANAGEMENT
          </span>

          <h2>
            My Businesses
          </h2>

          <p>
            Manage all businesses connected
            to your ZenvaZapp account.
          </p>
        </div>

        <button
          type="button"
          className="business-suite-primary-button"
          onClick={() =>
            onNavigate?.(
              "business-create"
            )
          }
        >
          <FiPlus />
          Create Business
        </button>
      </div>

      {error && (
        <div className="business-suite-alert error">
          {error}
        </div>
      )}

      {!businesses.length ? (
        <div className="business-suite-empty">
          <div>
            <FiPlus />
          </div>

          <h3>
            No businesses yet
          </h3>

          <p>
            Create your first ZenvaZapp
            Business Account.
          </p>

          <button
            type="button"
            className="business-suite-primary-button"
            onClick={() =>
              onNavigate?.(
                "business-create"
              )
            }
          >
            <FiPlus />
            Create Business
          </button>
        </div>
      ) : (
        <div className="business-suite-business-grid">
          {businesses.map(
            (business) => (
              <article
                key={business._id}
                className="business-suite-business-card"
              >
                <div className="business-suite-business-card-top">
                  <div className="business-suite-business-avatar">
                    {business.logo ? (
                      <img
                        src={
                          business.logo
                        }
                        alt={
                          business.businessName
                        }
                      />
                    ) : (
                      business.businessName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      "B"
                    )}
                  </div>

                  <div>
                    <span>
                      {business.category ||
                        "General"}
                    </span>

                    <h3>
                      {business.businessName}
                    </h3>
                  </div>
                </div>

                <p className="business-suite-business-description">
                  {business.description ||
                    "Your ZenvaZapp Business Account."}
                </p>

                <div className="business-suite-status-row">
                  <span
                    className={
                      business.isActive
                        ? "business-status active"
                        : "business-status inactive"
                    }
                  >
                    {business.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <span
                    className={
                      business.isPublic
                        ? "business-status public"
                        : "business-status private"
                    }
                  >
                    {business.isPublic
                      ? "Public"
                      : "Private"}
                  </span>
                </div>

                <div className="business-suite-card-actions">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "business-edit",
                        {
                          businessId:
                            business._id,
                        }
                      )
                    }
                  >
                    <FiEdit3 />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "public-business",
                        {
                          businessId:
                            business._id,
                        }
                      )
                    }
                  >
                    <FiEye />
                    View
                  </button>
                </div>

                <div className="business-suite-management-links">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "business-products",
                        {
                          businessId:
                            business._id,
                        }
                      )
                    }
                  >
                    <FiPackage />
                    Products
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "business-article-management",
                        {
                          businessId:
                            business._id,
                        }
                      )
                    }
                  >
                    <FiFileText />
                    Articles
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "business-analytics",
                        {
                          businessId:
                            business._id,
                        }
                      )
                    }
                  >
                    <FiBarChart2 />
                    Analytics
                  </button>
                </div>

                <div className="business-suite-card-actions secondary">
                  <button
                    type="button"
                    onClick={() =>
                      togglePublic(
                        business
                      )
                    }
                  >
                    {business.isPublic ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}

                    {business.isPublic
                      ? "Make Private"
                      : "Make Public"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleStatus(
                        business
                      )
                    }
                  >
                    <FiPower />

                    {business.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </BusinessManagementShell>
  );
}

function BusinessManagementShell({
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
              Business Management
            </h1>

            <p>
              Owner-only business controls
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

export default BusinessManagement;