import React from "react";
import "./account.css";

function Account({
  user,
  onBack,
  onNavigate,
}) {

  // =====================================================
  // USER INFORMATION
  // =====================================================

  const getUserName = () => {
    return (
      user?.displayName ||
      user?.fullName ||
      user?.username ||
      user?.name ||
      "ZenvaZapp User"
    );
  };

  const getUserInitial = () => {
    return getUserName()
      .charAt(0)
      .toUpperCase();
  };

  const getUsername = () => {
    if (!user?.username) return "Not set";

    return `@${String(user.username).replace(/^@/, "")}`;
  };

  const getEmail = () => {
    return user?.email || "Not set";
  };

  const getPhone = () => {
    return user?.phone || user?.phoneNumber || "Not set";
  };

  // =====================================================
  // ACCOUNT ACTIONS
  // =====================================================

  const handleNavigation = (page) => {
    if (typeof onNavigate === "function") {
      onNavigate(page);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="zenvazapp-account-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="zenvazapp-account-header">

        <div className="zenvazapp-account-header-left">

          <button
            type="button"
            className="zenvazapp-account-back"
            onClick={onBack}
            aria-label="Back to Settings"
            title="Back to Settings"
          >
            ←
          </button>

          <div className="zenvazapp-account-header-text">
            <h1>Account</h1>

            <p>
              Manage your ZenvaZapp account
            </p>
          </div>

        </div>

      </header>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="zenvazapp-account-content">

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <section className="zenvazapp-account-profile-card">

          <div className="zenvazapp-account-avatar">

            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={getUserName()}
              />
            ) : (
              getUserInitial()
            )}

          </div>

          <div className="zenvazapp-account-profile-info">

            <h2>
              {getUserName()}
            </h2>

            <p>
              {getUsername()}
            </p>

            <span>
              {getEmail()}
            </span>

          </div>

          <button
            type="button"
            className="zenvazapp-account-edit-button"
            onClick={() =>
              handleNavigation("profile")
            }
          >
            Edit Profile
          </button>

        </section>


        {/* =================================================
            ACCOUNT INFORMATION
        ================================================= */}

        <section className="zenvazapp-account-section">

          <div className="zenvazapp-account-section-heading">

            <h2>
              Account Information
            </h2>

            <p>
              Your basic ZenvaZapp account details.
            </p>

          </div>


          <div className="zenvazapp-account-details">

            {/* USERNAME */}

            <div className="zenvazapp-account-detail">

              <div className="zenvazapp-account-detail-icon">
                @
              </div>

              <div className="zenvazapp-account-detail-content">

                <span>
                  Username
                </span>

                <strong>
                  {getUsername()}
                </strong>

              </div>

            </div>


            {/* EMAIL */}

            <div className="zenvazapp-account-detail">

              <div className="zenvazapp-account-detail-icon">
                ✉
              </div>

              <div className="zenvazapp-account-detail-content">

                <span>
                  Email Address
                </span>

                <strong>
                  {getEmail()}
                </strong>

              </div>

            </div>


            {/* PHONE */}

            <div className="zenvazapp-account-detail">

              <div className="zenvazapp-account-detail-icon">
                ☎
              </div>

              <div className="zenvazapp-account-detail-content">

                <span>
                  Phone Number
                </span>

                <strong>
                  {getPhone()}
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            ACCOUNT SECURITY
        ================================================= */}

        <section className="zenvazapp-account-section">

          <div className="zenvazapp-account-section-heading">

            <h2>
              Account Security
            </h2>

            <p>
              Protect your ZenvaZapp account.
            </p>

          </div>


          <div className="zenvazapp-account-actions">

            <button
              type="button"
              className="zenvazapp-account-action"
              onClick={() =>
                handleNavigation(
                  "settings-privacy-security"
                )
              }
            >

              <span className="zenvazapp-account-action-icon">
                🔐
              </span>

              <span className="zenvazapp-account-action-content">

                <strong>
                  Password & Security
                </strong>

                <small>
                  Manage your password and account security.
                </small>

              </span>

              <span className="zenvazapp-account-arrow">
                →
              </span>

            </button>


            <button
              type="button"
              className="zenvazapp-account-action"
              onClick={() =>
                handleNavigation(
                  "settings-linked-devices"
                )
              }
            >

              <span className="zenvazapp-account-action-icon">
                💻
              </span>

              <span className="zenvazapp-account-action-content">

                <strong>
                  Linked Devices
                </strong>

                <small>
                  View and manage devices connected to your account.
                </small>

              </span>

              <span className="zenvazapp-account-arrow">
                →
              </span>

            </button>

          </div>

        </section>


        {/* =================================================
            ACCOUNT MANAGEMENT
        ================================================= */}

        <section className="zenvazapp-account-section">

          <div className="zenvazapp-account-section-heading">

            <h2>
              Account Management
            </h2>

            <p>
              Manage your ZenvaZapp account.
            </p>

          </div>


          <div className="zenvazapp-account-actions">

            <button
              type="button"
              className="zenvazapp-account-action"
              onClick={() =>
                handleNavigation("profile")
              }
            >

              <span className="zenvazapp-account-action-icon">
                👤
              </span>

              <span className="zenvazapp-account-action-content">

                <strong>
                  Profile
                </strong>

                <small>
                  Update your profile information and photo.
                </small>

              </span>

              <span className="zenvazapp-account-arrow">
                →
              </span>

            </button>


            <button
              type="button"
              className="zenvazapp-account-action danger"
              onClick={() =>
                handleNavigation("delete-account")
              }
            >

              <span className="zenvazapp-account-action-icon">
                🗑
              </span>

              <span className="zenvazapp-account-action-content">

                <strong>
                  Delete Account
                </strong>

                <small>
                  Permanently delete your ZenvaZapp account.
                </small>

              </span>

              <span className="zenvazapp-account-arrow">
                →
              </span>

            </button>

          </div>

        </section>

      </main>


      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <nav
        className="zenvazapp-account-bottom-nav"
        aria-label="Main navigation"
      >

        <button
          type="button"
          onClick={() =>
            handleNavigation("chats")
          }
        >
          <span>💬</span>
          <small>Chats</small>
        </button>


        <button
          type="button"
          onClick={() =>
            handleNavigation("calls")
          }
        >
          <span>📞</span>
          <small>Calls</small>
        </button>


        <button
          type="button"
          onClick={() =>
            handleNavigation("tools")
          }
        >
          <span>🛠</span>
          <small>Tools</small>
        </button>


        <button
          type="button"
          className="active"
          onClick={() =>
            handleNavigation("settings")
          }
          aria-current="page"
        >
          <span>⚙️</span>
          <small>Settings</small>
        </button>

      </nav>

    </div>
  );
}

export default Account;