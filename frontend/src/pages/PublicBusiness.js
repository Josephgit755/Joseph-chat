import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiGlobe,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiFileText,
} from "react-icons/fi";

import "./businessSuite.css";

function PublicBusiness({
  businessId,
  user,
  onBack,
  onNavigate,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [business, setBusiness] =
    useState(null);

  const [products, setProducts] =
    useState([]);

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [
          businessResponse,
          productsResponse,
          postsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/businesses/${businessId}`
          ),

          fetch(
            `${API_URL}/api/business-products/business/${businessId}`
          ),

          fetch(
            `${API_URL}/api/business-posts/business/${businessId}`
          ),
        ]);

        const businessData =
          await businessResponse.json();

        const productsData =
          await productsResponse.json();

        const postsData =
          await postsResponse.json();

        if (
          !businessResponse.ok
        ) {
          throw new Error(
            businessData?.message ||
              "Business not found."
          );
        }

        setBusiness(
          businessData.business
        );

        setProducts(
          productsData.products ||
            []
        );

        setPosts(
          postsData.posts || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load business."
        );
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      load();
    }
  }, [businessId]);

  const contactBusiness =
    () => {
      /*
       * Business owner remains a normal
       * ZenvaZapp user.
       *
       * This enters the existing private
       * messaging architecture rather than
       * creating a second chat system.
       */

      if (
        business?.ownerId
      ) {
        onNavigate?.(
          "new-chat",
          {
            userId:
              business.ownerId,
          }
        );
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

  if (error || !business) {
    return (
      <Shell onBack={onBack}>
        <div className="business-suite-empty">
          <h3>
            Business unavailable
          </h3>

          <p>
            {error ||
              "This business could not be found."}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onBack={onBack}>

      {business.coverImage && (
        <div className="business-suite-public-cover">
          <img
            src={
              business.coverImage
            }
            alt=""
          />
        </div>
      )}

      <section className="business-suite-public-profile">

        <div className="business-suite-public-avatar">
          {business.logo ? (
            <img
              src={business.logo}
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

        <span>
          ✓ VERIFIED BUSINESS
        </span>

        <h2>
          {business.businessName}
        </h2>

        <p className="business-suite-public-category">
          {business.category ||
            "General"}
        </p>

        <p className="business-suite-public-description">
          {business.description ||
            "Welcome to our ZenvaZapp Business Page."}
        </p>

        <div className="business-suite-public-actions">

          <button
            type="button"
            className="business-suite-primary-button"
            onClick={
              contactBusiness
            }
          >
            <FiMessageCircle />
            Message
          </button>

          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="business-suite-secondary-button"
            >
              <FiPhone />
              Call
            </a>
          )}

        </div>
      </section>

      <section className="business-suite-public-info">

        {business.address && (
          <Info
            icon={<FiMapPin />}
            label="Location"
            value={
              business.address
            }
          />
        )}

        {business.phone && (
          <Info
            icon={<FiPhone />}
            label="Phone"
            value={
              business.phone
            }
          />
        )}

        {business.email && (
          <Info
            icon={<FiMail />}
            label="Email"
            value={
              business.email
            }
          />
        )}

        {business.website && (
          <Info
            icon={<FiGlobe />}
            label="Website"
            value={
              business.website
            }
          />
        )}

      </section>

      <section className="business-suite-section">

        <div className="business-suite-section-heading">
          <div>
            <span>
              CATALOG
            </span>

            <h2>
              Products & Services
            </h2>
          </div>

          <FiPackage />
        </div>

        {!products.length ? (
          <div className="business-suite-empty small">
            <p>
              No public products yet.
            </p>
          </div>
        ) : (
          <div className="business-suite-product-grid">
            {products.map(
              (product) => (
                <article
                  key={
                    product._id
                  }
                  className="business-suite-product-card"
                >
                  {product.image && (
                    <img
                      src={
                        product.image
                      }
                      alt={
                        product.name
                      }
                    />
                  )}

                  <div>
                    <span>
                      {
                        product.category
                      }
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {
                        product.description
                      }
                    </p>

                    <strong>
                      {Number(
                        product.price ||
                          0
                      ).toLocaleString()}{" "}
                      {
                        product.currency
                      }
                    </strong>
                  </div>
                </article>
              )
            )}
          </div>
        )}

      </section>

      <section className="business-suite-section">

        <div className="business-suite-section-heading">
          <div>
            <span>
              ARTICLES
            </span>

            <h2>
              Business Updates
            </h2>
          </div>

          <FiFileText />
        </div>

        {!posts.length ? (
          <div className="business-suite-empty small">
            <p>
              No public articles yet.
            </p>
          </div>
        ) : (
          <div className="business-suite-article-grid">
            {posts.map(
              (post) => (
                <article
                  key={
                    post._id
                  }
                  className="business-suite-article-card"
                >
                  {post.coverImage && (
                    <img
                      src={
                        post.coverImage
                      }
                      alt=""
                    />
                  )}

                  <span>
                    {post.category}
                  </span>

                  <h3>
                    {post.title}
                  </h3>

                  <p>
                    {post.excerpt ||
                      post.content.slice(
                        0,
                        180
                      )}
                  </p>
                </article>
              )
            )}
          </div>
        )}

      </section>

      <div className="business-suite-public-privacy">
        🔒 Customer conversations and
        private business management
        information are not public.
      </div>

    </Shell>
  );
}

function Info({
  icon,
  label,
  value,
}) {
  return (
    <div className="business-suite-info-item">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <p>{value}</p>
      </div>
    </div>
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
              PUBLIC
            </span>

            <h1>
              Business
            </h1>

            <p>
              Public Business Profile
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

export default PublicBusiness;