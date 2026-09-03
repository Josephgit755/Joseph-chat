import React from "react";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCompass,
  FiPlus,
  FiSettings,
  FiBarChart2,
  FiPackage,
  FiFileText,
  FiMessageCircle,
  FiZap,
  FiVolume2,
} from "react-icons/fi";

import "./businessSuite.css";

function Business({
  user,
  onBack,
  onNavigate,
}) {
  const navigate = (screen, extra = {}) => {
    onNavigate?.(screen, extra);
  };

  return (
    <div className="business-suite-page">
      <header className="business-suite-header">
        <div className="business-suite-header-left">
          <button
            type="button"
            className="business-suite-back"
            onClick={onBack}
            aria-label="Back"
          >
            <FiArrowLeft />
          </button>

          <div>
            <span className="business-suite-eyebrow">
              ZENVAZAPP
            </span>

            <h1>Business</h1>

            <p>
              Build, manage and grow your business.
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">

        {/* HERO */}

        <section className="business-suite-hero">
          <div className="business-suite-hero-icon">
            <FiBriefcase />
          </div>

          <div>
            <span className="business-suite-label">
              BUSINESS CENTER
            </span>

            <h2>
              Everything your business needs
            </h2>

            <p>
              Manage multiple businesses, products,
              articles, customers and business growth
              from one private workspace.
            </p>
          </div>
        </section>

        {/* MAIN ACTIONS */}

        <section className="business-suite-action-grid">

          <button
            type="button"
            onClick={() =>
              navigate("business-management")
            }
            className="business-suite-action-card primary"
          >
            <span>
              <FiSettings />
            </span>

            <div>
              <strong>
                Business Management
              </strong>

              <small>
                Manage your business accounts,
                settings and public visibility.
              </small>
            </div>

            <b>→</b>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("business-create")
            }
            className="business-suite-action-card"
          >
            <span>
              <FiPlus />
            </span>

            <div>
              <strong>
                Create Another Business
              </strong>

              <small>
                One ZenvaZapp account can own
                multiple businesses.
              </small>
            </div>

            <b>→</b>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("business-discover")
            }
            className="business-suite-action-card"
          >
            <span>
              <FiCompass />
            </span>

            <div>
              <strong>
                Discover Businesses
              </strong>

              <small>
                Browse and search public businesses
                on ZenvaZapp.
              </small>
            </div>

            <b>→</b>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("business-articles")
            }
            className="business-suite-action-card"
          >
            <span>
              <FiFileText />
            </span>

            <div>
              <strong>
                Business Articles
              </strong>

              <small>
                Discover articles, announcements,
                offers and business posts.
              </small>
            </div>

            <b>→</b>
          </button>

        </section>

        {/* FEATURES */}

        <section className="business-suite-section">

          <div className="business-suite-section-heading">
            <div>
              <span>
                BUSINESS TOOLS
              </span>

              <h2>
                Built for business growth
              </h2>
            </div>
          </div>

          <div className="business-suite-feature-grid">

            <BusinessFeature
              icon={<FiBriefcase />}
              title="Public Business Page"
              text="Let ZenvaZapp users discover your business."
            />

            <BusinessFeature
              icon={<FiPackage />}
              title="Product Catalog"
              text="Showcase products and services."
            />

            <BusinessFeature
              icon={<FiMessageCircle />}
              title="Customer Messages"
              text="Connect customers to your existing private chat system."
            />

            <BusinessFeature
              icon={<FiZap />}
              title="Automatic Replies"
              text="Configure automatic business responses."
            />

            <BusinessFeature
              icon={<FiVolume2 />}
              title="Marketing"
              text="Promote your products and business posts."
            />

            <BusinessFeature
              icon={<FiBarChart2 />}
              title="Analytics"
              text="Track views, products and business performance."
            />

          </div>
        </section>

        {/* PRIVACY */}

        <section className="business-suite-privacy">
          <strong>
            🔒 Private management
          </strong>

          <p>
            Your business management area is
            protected by your ZenvaZapp account.
            Other users can only see information
            that you intentionally make public.
          </p>
        </section>

      </main>
    </div>
  );
}

function BusinessFeature({
  icon,
  title,
  text,
}) {
  return (
    <div className="business-suite-feature">
      <span className="business-suite-feature-icon">
        {icon}
      </span>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default Business;