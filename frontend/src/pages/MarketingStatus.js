import {
  useState,
} from "react";

import "./marketing-status.css";

function MarketingStatus({
  user,
  onBack,
  onNavigate,
}) {
  const [productName, setProductName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [contact, setContact] =
    useState(
      user?.phone || ""
    );

  const [category, setCategory] =
    useState("Product");

  const [showPreview, setShowPreview] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const createStatusText = () => {
    const parts = [];

    if (productName.trim()) {
      parts.push(
        `🔥 ${productName.trim()}`
      );
    }

    if (description.trim()) {
      parts.push(
        description.trim()
      );
    }

    if (price.trim()) {
      parts.push(
        `💰 ${price.trim()}`
      );
    }

    if (contact.trim()) {
      parts.push(
        `📞 ${contact.trim()}`
      );
    }

    return parts.join("\n");
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleCopy = async () => {
    const text =
      createStatusText();

    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Unable to copy marketing status:",
        error
      );
    }
  };

  const handleShare = async () => {
    const text =
      createStatusText();

    if (!text) {
      return;
    }

    if (
      navigator.share
    ) {
      try {
        await navigator.share({
          title:
            "ZenvaZapp Marketing Status",
          text,
        });
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Unable to share status:",
            error
          );
        }
      }

      return;
    }

    handleCopy();
  };

  return (
    <div className="marketing-status-page">
      {/* HEADER */}

      <header className="marketing-header">
        <button
          type="button"
          className="marketing-back-button"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <div>
          <h1>
            Marketing Status
          </h1>

          <p>
            Promote products, services and businesses
          </p>
        </div>
      </header>

      {/* CONTENT */}

      <main className="marketing-content">
        <section className="marketing-intro">
          <div className="marketing-main-icon">
            📣
          </div>

          <div>
            <h2>
              Create a promotion
            </h2>

            <p>
              Build a clean promotional message
              that you can share as a status.
            </p>
          </div>
        </section>

        <section className="marketing-form-card">
          <div className="marketing-field">
            <label htmlFor="marketing-category">
              Category
            </label>

            <select
              id="marketing-category"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >
              <option value="Product">
                Product
              </option>

              <option value="Service">
                Service
              </option>

              <option value="Business">
                Business
              </option>

              <option value="Event">
                Event
              </option>

              <option value="Offer">
                Special Offer
              </option>
            </select>
          </div>

          <div className="marketing-field">
            <label htmlFor="marketing-name">
              Name
            </label>

            <input
              id="marketing-name"
              type="text"
              placeholder={
                category === "Service"
                  ? "Service name"
                  : "Product or business name"
              }
              value={productName}
              onChange={(event) =>
                setProductName(
                  event.target.value
                )
              }
            />
          </div>

          <div className="marketing-field">
            <label htmlFor="marketing-description">
              Description
            </label>

            <textarea
              id="marketing-description"
              rows="4"
              placeholder="Tell people what you are offering..."
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
            />
          </div>

          <div className="marketing-two-columns">
            <div className="marketing-field">
              <label htmlFor="marketing-price">
                Price / Offer
              </label>

              <input
                id="marketing-price"
                type="text"
                placeholder="e.g. 15,000 FCFA"
                value={price}
                onChange={(event) =>
                  setPrice(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="marketing-field">
              <label htmlFor="marketing-contact">
                Contact
              </label>

              <input
                id="marketing-contact"
                type="text"
                placeholder="Phone or contact"
                value={contact}
                onChange={(event) =>
                  setContact(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="marketing-preview-button"
            onClick={handlePreview}
            disabled={
              !productName.trim() &&
              !description.trim()
            }
          >
            Preview Status
          </button>
        </section>

        {/* PREVIEW */}

        {showPreview && (
          <section className="marketing-preview-section">
            <div className="marketing-preview-heading">
              <div>
                <span>
                  Preview
                </span>

                <h2>
                  Your status
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPreview(false)
                }
              >
                Edit
              </button>
            </div>

            <div className="marketing-status-preview">
              <div className="marketing-preview-top">
                <div className="marketing-preview-avatar">
                  {user?.profilePhoto ? (
                    <img
                      src={
                        user.profilePhoto
                      }
                      alt="Profile"
                    />
                  ) : (
                    user?.fullName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    user?.username
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    "Z"
                  )}
                </div>

                <div>
                  <strong>
                    {user?.fullName ||
                      user?.username ||
                      "ZenvaZapp User"}
                  </strong>

                  <span>
                    Just now
                  </span>
                </div>
              </div>

              <div className="marketing-preview-category">
                {category}
              </div>

              <p className="marketing-preview-text">
                {createStatusText() ||
                  "Your promotional status will appear here."}
              </p>
            </div>

            <div className="marketing-preview-actions">
              <button
                type="button"
                onClick={handleCopy}
              >
                {copied
                  ? "Copied"
                  : "Copy"}
              </button>

              <button
                type="button"
                className="marketing-share-button"
                onClick={handleShare}
              >
                Share
              </button>
            </div>
          </section>
        )}

        {/* FUTURE STATUS INTEGRATION */}

        <section className="marketing-info-card">
          <span>
            💡
          </span>

          <div>
            <h3>
              Built for ZenvaZapp Status
            </h3>

            <p>
              This tool prepares promotional content
              for sharing. Direct status publishing
              can be connected to the ZenvaZapp status
              system when that backend feature is ready.
            </p>
          </div>
        </section>
      </main>

      {/* BOTTOM NAVIGATION */}

      <nav
        className="marketing-bottom-navigation"
        aria-label="Main navigation"
      >
        <button
          type="button"
          onClick={() =>
            onNavigate?.("chatlist")
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
          className="active"
          onClick={() =>
            onNavigate?.("tools")
          }
        >
          <span>🛠️</span>
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
    </div>
  );
}

export default MarketingStatus;