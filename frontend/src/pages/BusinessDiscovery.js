import React, {
  useEffect,
  useState,
} from "react";

import "./business-discovery.css";

function BusinessDiscovery({
  user,
  onBack,
  onOpenBusiness,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [businesses, setBusinesses] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [city, setCity] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadBusinesses();
      }, 250);

    return () =>
      clearTimeout(timer);
  }, [
    search,
    category,
    city,
  ]);

  const loadBusinesses =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (category) {
          params.set(
            "category",
            category
          );
        }

        if (city.trim()) {
          params.set(
            "city",
            city.trim()
          );
        }

        const response =
          await fetch(
            `${API_URL}/api/businesses/public?${params.toString()}`
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
          Array.isArray(
            data.businesses
          )
            ? data.businesses
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Unable to load businesses."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="business-discovery-page">
      <header className="business-discovery-header">
        <button
          type="button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <h1>
            Discover
          </h1>

          <p>
            Businesses and products
            on ZenvaZapp
          </p>
        </div>
      </header>

      <main>
        <div className="business-search">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search businesses..."
          />

          <input
            value={city}
            onChange={(event) =>
              setCity(
                event.target.value
              )
            }
            placeholder="City"
          />

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value
              )
            }
          >
            <option value="">
              All categories
            </option>

            <option>
              Electronics
            </option>

            <option>
              Fashion
            </option>

            <option>
              Restaurants
            </option>

            <option>
              Education
            </option>

            <option>
              Beauty
            </option>

            <option>
              Transport
            </option>

            <option>
              Construction
            </option>

            <option>
              Professional Services
            </option>

            <option>
              General
            </option>
          </select>
        </div>

        {loading && (
          <div className="business-discovery-state">
            Loading businesses...
          </div>
        )}

        {error && (
          <div className="business-discovery-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          businesses.length === 0 && (
            <div className="business-discovery-state">
              No businesses found.
            </div>
          )}

        <section className="business-discovery-grid">
          {businesses.map(
            (business) => (
              <button
                type="button"
                key={
                  business._id
                }
                className="business-discovery-card"
                onClick={() =>
                  onOpenBusiness?.(
                    business
                  )
                }
              >
                <div className="business-discovery-cover">
                  {business.coverImage ? (
                    <img
                      src={
                        business.coverImage
                      }
                      alt=""
                    />
                  ) : null}
                </div>

                <div className="business-discovery-body">
                  <div className="business-discovery-logo">
                    {business.logo ? (
                      <img
                        src={
                          business.logo
                        }
                        alt=""
                      />
                    ) : (
                      "🏪"
                    )}
                  </div>

                  <h2>
                    {
                      business.businessName
                    }
                  </h2>

                  {business.isVerified && (
                    <span>
                      ✓ Verified
                    </span>
                  )}

                  <p>
                    {
                      business.description
                    }
                  </p>

                  <small>
                    {
                      business.category
                    }
                    {business.city
                      ? ` • ${business.city}`
                      : ""}
                  </small>
                </div>
              </button>
            )
          )}
        </section>
      </main>
    </div>
  );
}

export default BusinessDiscovery;