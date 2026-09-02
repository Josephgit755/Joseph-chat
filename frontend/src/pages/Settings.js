import React from "react";
import "./settings.css";

function Settings({
  user,
  onBack,
  onNavigate,
  theme,
  setTheme,
  darkMode,
  setDarkMode,
}) {
  // =====================================================
  // USER INFORMATION
  // ================================================

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
    return getUserName().charAt(0).toUpperCase();
  };

  // =====================================================
  // FIVE ZENVazAPP THEMES
  // =====================================================

  const themeOptions = [
    {
      id: "red",
      name: "Red",
      icon: "🔴",
      description: "Bold and energetic",
    },

    {
      id: "green",
      name: "Green",
      icon: "🟢",
      description: "Fresh and natural",
    },

    {
      id: "blue",
      name: "Blue",
      icon: "🔵",
      description: "Calm and professional",
    },

    {
      id: "zenvazapp",
      name: "ZenvaZapp",
      icon: "Zz",
      description: "Original magenta & purple",
    },

    {
      id: "orange",
      name: "Orange",
      icon: "🟠",
      description: "Warm and energetic",
    },
  ];

  // =====================================================
  // SETTINGS SECTIONS
  // =====================================================

  const settingsSections = [
    {
      id: "account",
      icon: "👤",
      title: "Account",
      description:
        "Manage your account information and preferences.",
    },

    {
      id: "privacy-security",
      icon: "🔐",
      title: "Privacy & Security",
      description:
        "Control your privacy, security and account protection.",
    },

    {
      id: "notifications",
      icon: "🔔",
      title: "Notifications",
      description:
        "Manage messages, calls and notification preferences.",
    },

    {
      id: "linked-devices",
      icon: "💻",
      title: "Linked Devices",
      description:
        "Manage devices connected to your ZenvaZapp account.",
    },

    {
      id: "communities",
      icon: "👥",
      title: "Communities",
      description:
        "Manage your communities and community preferences.",
    },
    {
      id: "business",
      icon: "🏪",
      title: "Business",
      description:
       "Create and manage your business, products, customers and analytics.",
    },


    {
      id: "storage-data",
      icon: "💾",
      title: "Storage & Data",
      description:
        "Manage storage, media and data usage.",
    },

    {
      id: "help-about",
      icon: "❓",
      title: "Help & About",
      description:
        "Get help and learn more about ZenvaZapp.",
    },
  ];

  // =====================================================
  // THEME CHANGE
  // =====================================================

  const handleThemeChange = (themeId) => {
    if (typeof setTheme === "function") {
      setTheme(themeId);
    }
  };

  // =====================================================
  // DARK MODE CHANGE
  // =====================================================

  const handleDarkModeChange = () => {
    if (typeof setDarkMode === "function") {
      setDarkMode((previous) => !previous);
    }
  };

  // =====================================================
  // SETTINGS NAVIGATION
  // =====================================================

  const handleSectionClick = (sectionId) => {
    if (typeof onNavigate === "function") {
      onNavigate(`settings-${sectionId}`);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className={`zenvazapp-settings-page theme-${theme || "zenvazapp"}`}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="zenvazapp-settings-header">
        <div className="zenvazapp-settings-header-left">

          <button
            type="button"
            className="zenvazapp-settings-back"
            onClick={onBack}
            aria-label="Back"
            title="Back"
          >
            ←
          </button>

          <div className="zenvazapp-settings-header-title">
            <h1>Settings</h1>

            <p>
              Manage your ZenvaZapp experience
            </p>
          </div>

        </div>

        <div className="zenvazapp-settings-header-brand">
          <span>Zz</span>
        </div>
      </header>

      {/* =================================================
          PROFILE SUMMARY
      ================================================= */}

      <section className="zenvazapp-settings-profile">

        <div className="zenvazapp-settings-avatar">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={getUserName()}
            />
          ) : (
            <span>{getUserInitial()}</span>
          )}
        </div>

        <div className="zenvazapp-settings-profile-info">

          <h2>{getUserName()}</h2>

          {user?.username && (
            <p>
              @{String(user.username).replace(/^@/, "")}
            </p>
          )}

          {user?.email && (
            <span>{user.email}</span>
          )}

        </div>

        <button
          type="button"
          className="zenvazapp-settings-profile-button"
          onClick={() => onNavigate?.("profile")}
        >
          View Profile
        </button>

      </section>

      {/* =================================================
          APPEARANCE
      ================================================= */}

      <section className="zenvazapp-settings-theme-panel">

        <div className="zenvazapp-settings-panel-header">
          <div>
            <h2>Appearance</h2>

            <p>
              Personalize how ZenvaZapp looks.
            </p>
          </div>
        </div>

        {/* =================================================
            DARK MODE
        ================================================= */}

        <div className="zenvazapp-settings-control">

          <div className="zenvazapp-settings-control-icon">
            🌙
          </div>

          <div className="zenvazapp-settings-control-content">

            <strong>Dark Mode</strong>

            <small>
              {darkMode
                ? "Enabled across ZenvaZapp"
                : "Disabled"}
            </small>

          </div>

          <button
            type="button"
            className={`zenvazapp-toggle ${
              darkMode ? "enabled" : ""
            }`}
            onClick={handleDarkModeChange}
            aria-label="Toggle Dark Mode"
            aria-pressed={darkMode}
          >
            <span />
          </button>

        </div>

        {/* =================================================
            THEMES
        ================================================= */}

        <div className="zenvazapp-theme-selection">

          <div className="zenvazapp-theme-title">
            <strong>Themes</strong>

            <small>
              Choose one of five ZenvaZapp colors.
            </small>
          </div>

          <div className="zenvazapp-theme-options">

            {themeOptions.map((option) => (

              <button
                key={option.id}
                type="button"
                className={`zenvazapp-theme-option ${
                  theme === option.id ? "selected" : ""
                }`}
                onClick={() =>
                  handleThemeChange(option.id)
                }
                aria-pressed={theme === option.id}
              >

                <span
                  className={`zenvazapp-theme-preview theme-${option.id}`}
                >
                  {option.id === "zenvazapp" ? (
                    <strong>Zz</strong>
                  ) : (
                    <span />
                  )}
                </span>

                <span className="zenvazapp-theme-option-text">

                  <strong>
                    {option.icon !== "Zz" && (
                      <>
                        {option.icon}{" "}
                      </>
                    )}

                    {option.name}
                  </strong>

                  <small>
                    {option.description}
                  </small>

                </span>

                {theme === option.id && (
                  <b className="zenvazapp-theme-check">
                    ✓
                  </b>
                )}

              </button>

            ))}

          </div>

        </div>

      </section>

      {/* =================================================
          MAIN SETTINGS
      ================================================= */}

      <main className="zenvazapp-settings-content">

        <div className="zenvazapp-settings-list">

          {settingsSections.map((section) => (

            <button
              key={section.id}
              type="button"
              className="zenvazapp-settings-item"
              onClick={() =>
                handleSectionClick(section.id)
              }
            >

              <span className="zenvazapp-settings-icon">
                {section.icon}
              </span>

              <span className="zenvazapp-settings-item-content">

                <strong>
                  {section.title}
                </strong>

                <small>
                  {section.description}
                </small>

              </span>

              <span
                className="zenvazapp-settings-arrow"
                aria-hidden="true"
              >
                →
              </span>

            </button>

          ))}

        </div>

      </main>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <nav
        className="zenvazapp-settings-bottom-nav"
        aria-label="Main navigation"
      >

        <button
          type="button"
          onClick={() => onNavigate?.("chats")}
        >
          <span>💬</span>
          <small>Chats</small>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.("calls")}
        >
          <span>📞</span>
          <small>Calls</small>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.("tools")}
        >
          <span>🛠</span>
          <small>Tools</small>
        </button>

        <button
          type="button"
          className="active"
          aria-current="page"
        >
          <span>⚙️</span>
          <small>Settings</small>
        </button>

      </nav>

    </div>
  );
}

export default Settings;