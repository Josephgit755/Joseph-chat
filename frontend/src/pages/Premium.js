import React, {
  useEffect,
  useState,
} from "react";

import "./premium.css";

function Premium({
  user,
  business,
  onBack,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [
    billingCycle,
    setBillingCycle,
  ] = useState("monthly");

  const [
    current,
    setCurrent,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const monthlyPrice =
    Number(
      process.env
        .REACT_APP_ZENVAPREMIUM_MONTHLY_PRICE
    ) || 2500;

  const yearlyPrice =
    Number(
      process.env
        .REACT_APP_ZENVAPREMIUM_YEARLY_PRICE
    ) || 25000;

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
              `${API_URL}/api/subscriptions/mine`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (response.ok) {
            setCurrent(
              data.subscription
            );
          }
        } catch (err) {
          console.error(
            "Premium status error:",
            err
          );
        }
      };

    load();
  }, [API_URL]);

  const subscribe =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "zenvazapp_token"
          );

        const response =
          await fetch(
            `${API_URL}/api/subscriptions/start`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                billingCycle,

                businessId:
                  business?._id ||
                  null,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to start Premium."
          );
        }

        if (
          data.paymentUrl
        ) {
          window.location.href =
            data.paymentUrl;
        }
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="zenvazapp-premium-page">
      <header className="premium-header">
        <button
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <h1>
            Zenva Premium
          </h1>

          <p>
            Unlock the complete
            ZenvaZapp experience.
          </p>
        </div>
      </header>

      <main className="premium-content">
        <section className="premium-hero">
          <span className="premium-badge">
            ZENVA PREMIUM
          </span>

          <h2>
            Everything you need.
          </h2>

          <p>
            Get access to advanced
            ZenvaZapp features,
            commerce tools and
            premium capabilities.
          </p>
        </section>

        <section className="premium-toggle">
          <button
            className={
              billingCycle ===
              "monthly"
                ? "active"
                : ""
            }
            onClick={() =>
              setBillingCycle(
                "monthly"
              )
            }
          >
            Monthly
          </button>

          <button
            className={
              billingCycle ===
              "yearly"
                ? "active"
                : ""
            }
            onClick={() =>
              setBillingCycle(
                "yearly"
              )
            }
          >
            Yearly
          </button>
        </section>

        <section className="premium-price-card">
          <span>
            Zenva Premium
          </span>

          <strong>
            {Number(
              billingCycle ===
                "monthly"
                ? monthlyPrice
                : yearlyPrice
            ).toLocaleString()}{" "}
            XAF
          </strong>

          <small>
            per{" "}
            {billingCycle ===
            "monthly"
              ? "month"
              : "year"}
          </small>

          <button
            onClick={
              subscribe
            }
            disabled={loading}
          >
            {loading
              ? "Opening payment..."
              : "Subscribe with CinetPay"}
          </button>
        </section>

        <section className="premium-features">
          <div>
            <strong>
              ✓ Advanced Business
              Tools
            </strong>
            <span>
              Manage products,
              customers and orders.
            </span>
          </div>

          <div>
            <strong>
              ✓ Product Commerce
            </strong>
            <span>
              Sell products through
              ZenvaZapp.
            </span>
          </div>

          <div>
            <strong>
              ✓ Advanced Analytics
            </strong>
            <span>
              Understand your
              business performance.
            </span>
          </div>

          <div>
            <strong>
              ✓ Automatic Replies
            </strong>
            <span>
              Respond to customers
              automatically.
            </span>
          </div>

          <div>
            <strong>
              ✓ Marketing Tools
            </strong>
            <span>
              Promote your products
              and offers.
            </span>
          </div>
        </section>

        {current && (
          <section className="premium-current">
            <strong>
              Current subscription
            </strong>

            <span>
              {current.billingCycle}
            </span>

            <span>
              Ends{" "}
              {current.endDate
                ? new Date(
                    current.endDate
                  ).toLocaleDateString()
                : "—"}
            </span>
          </section>
        )}

        {error && (
          <div className="premium-error">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

export default Premium;