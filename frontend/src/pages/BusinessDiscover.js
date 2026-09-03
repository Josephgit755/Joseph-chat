import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiSearch,
  FiBriefcase,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessDiscover({
  onBack,
  onNavigate,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [businesses, setBusinesses] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadBusinesses =
    async () => {
      try {
        setLoading(true);

        const url =
          new URL(
            `${API_URL}/api/businesses/public`
          );

        if (search.trim()) {
          url.searchParams.set(
            "search",
            search.trim()
          );
        }

        const response =
          await fetch(
            url.toString()
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to discover businesses."
          );
        }

        setBusinesses(
          data.businesses || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load businesses."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const timer =
      setTimeout(
        loadBusinesses,
        250
      );

    return () =>
      clearTimeout(timer);
  }, [search]);

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
              PUBLIC
            </span>

            <h1>
              Discover Businesses
            </h1>

            <p>
              Explore businesses on ZenvaZapp
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">

        <div className="business-suite-search">
          <FiSearch />

          <input
            type="search"
            placeholder="Search businesses..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        {error && (
          <div className="business-suite-alert error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="business-suite-loading">
            Discovering businesses...
          </div>
        ) : !businesses.length ? (
          <div className="business-suite-empty">
            <FiBriefcase />

            <h3>
              No businesses found
            </h3>

            <p>
              Try another search.
            </p>
          </div>
        ) : (
          <div className="business-suite-business-grid public">

            {businesses.map(
              (business) => (
                <article
                  key={
                    business._id
                  }
                  className="business-suite-business-card"
                >
                  {business.coverImage && (
                    <img
                      className="business-suite-cover"
                      src={
                        business.coverImage
                      }
                      alt=""
                    />
                  )}

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
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                        "B"
                      )}
                    </div>

                    <div>
                      <span>
                        {
                          business.category
                        }
                      </span>

                      <h3>
                        {
                          business.businessName
                        }
                      </h3>
                    </div>
                  </div>

                  <p>
                    {business.description ||
                      "Welcome to this ZenvaZapp Business."}
                  </p>

                  <button
                    type="button"
                    className="business-suite-primary-button full-width"
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
                    View Business
                  </button>
                </article>
              )
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default BusinessDiscover;