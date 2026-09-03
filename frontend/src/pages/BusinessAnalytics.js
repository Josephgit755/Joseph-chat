import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiEye,
  FiUsers,
  FiPackage,
  FiBarChart2,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessAnalytics({
  businessId,
  onBack,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const load =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "zenvazapp_token"
            );

          const response =
            await fetch(
              `${API_URL}/api/businesses/${businessId}/analytics`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Failed to load analytics."
            );
          }

          setAnalytics(
            data.analytics
          );
        } catch (err) {
          setError(
            err.message ||
              "Failed to load analytics."
          );
        } finally {
          setLoading(false);
        }
      };

    if (businessId) {
      load();
    }
  }, [businessId]);

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
              Business Analytics
            </h1>

            <p>
              Understand your business performance
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">

        {loading ? (
          <div className="business-suite-loading">
            Loading analytics...
          </div>
        ) : error ? (
          <div className="business-suite-alert error">
            {error}
          </div>
        ) : (
          <>
            <div className="business-suite-page-heading">
              <div>
                <span>
                  PERFORMANCE
                </span>

                <h2>
                  Business Overview
                </h2>
              </div>
            </div>

            <div className="business-suite-analytics-grid">

              <Metric
                icon={<FiEye />}
                label="Profile Views"
                value={
                  analytics?.profileViews ||
                  0
                }
              />

              <Metric
                icon={<FiUsers />}
                label="Customers"
                value={
                  analytics?.customerCount ||
                  0
                }
              />

              <Metric
                icon={<FiPackage />}
                label="Products"
                value={
                  analytics?.productCount ||
                  0
                }
              />

              <Metric
                icon={<FiBarChart2 />}
                label="Plan"
                value={
                  analytics?.plan ===
                  "zenva-business"
                    ? "Zenva Business"
                    : "Free"
                }
              />

            </div>

            <section className="business-suite-analytics-summary">

              <div>
                <span>
                  PUBLIC STATUS
                </span>

                <strong>
                  {analytics?.isPublic
                    ? "Public"
                    : "Private"}
                </strong>
              </div>

              <div>
                <span>
                  BUSINESS STATUS
                </span>

                <strong>
                  {analytics?.isActive
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>

              <div>
                <span>
                  AUTOMATIC REPLIES
                </span>

                <strong>
                  {analytics?.automaticRepliesEnabled
                    ? "Enabled"
                    : "Disabled"}
                </strong>
              </div>

              <div>
                <span>
                  MARKETING
                </span>

                <strong>
                  {analytics?.marketingEnabled
                    ? "Enabled"
                    : "Disabled"}
                </strong>
              </div>

            </section>
          </>
        )}

      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}) {
  return (
    <div className="business-suite-metric">
      <span>
        {icon}
      </span>

      <small>
        {label}
      </small>

      <strong>
        {value}
      </strong>
    </div>
  );
}

export default BusinessAnalytics;