import { useEffect, useRef, useState } from "react";

function ProfileSetup({ onProfileCompleted }) {
  const [profilePhoto, setProfilePhoto] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStage, setSaveStage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // LOAD EXISTING PROFILE
  // ==========================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("zenvazapp_user");

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      setProfilePhoto(user.profilePhoto || "");
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setGender(user.gender || "");
    } catch (loadError) {
      console.error(
        "Unable to load profile:",
        loadError
      );
    }
  }, []);

  // ==========================================
  // GET INITIALS
  // ==========================================

  const getInitials = () => {
    const name = displayName.trim();

    if (!name) {
      return "Zz";
    }

    const parts = name.split(/\s+/);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[1][0]
      ).toUpperCase();
    }

    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  };

  // ==========================================
  // PHOTO SELECTED
  // ==========================================

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Please choose an image smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfilePhoto(
        reader.result
      );
    };

    reader.onerror = () => {
      setError(
        "Unable to read this image."
      );
    };

    reader.readAsDataURL(file);
  };

  // ==========================================
  // REMOVE PHOTO
  // ==========================================

  const handleRemovePhoto = () => {
    setProfilePhoto("");
    setError("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving || isCompleted) {
      return;
    }

    setError("");

    const token =
      localStorage.getItem(
        "zenvazapp_token"
      );

    if (!token) {
      setError(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    const cleanedDisplayName =
      displayName.trim();

    const cleanedBio =
      bio.trim();

    if (!cleanedDisplayName) {
      setError(
        "Please enter a display name."
      );
      return;
    }

    if (cleanedDisplayName.length > 100) {
      setError(
        "Display name cannot exceed 100 characters."
      );
      return;
    }

    if (cleanedBio.length > 160) {
      setError(
        "Bio cannot exceed 160 characters."
      );
      return;
    }

    setIsSaving(true);
    setSaveStage("Saving your profile...");

    try {
      const response = await fetch(
        `${API_URL}/api/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            profilePhoto,
            displayName:
              cleanedDisplayName,
            bio: cleanedBio,
            gender,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Unable to save your profile."
        );

        setIsSaving(false);
        setSaveStage("");

        return;
      }

      // ======================================
      // SAVE UPDATED USER LOCALLY
      // ======================================

      const updatedUser =
        data.user || {
          profilePhoto,
          displayName:
            cleanedDisplayName,
          bio: cleanedBio,
          gender,
          profileCompleted: true,
        };

      localStorage.setItem(
        "zenvazapp_user",
        JSON.stringify(
          updatedUser
        )
      );

      // ======================================
      // COMPLETION ANIMATION
      // ======================================

      setSaveStage(
        "Profile saved successfully"
      );

      setIsCompleted(true);

      // Give the user a short visual
      // confirmation before entering
      // the application.
      setTimeout(() => {
        if (onProfileCompleted) {
          onProfileCompleted(
            updatedUser
          );
        }
      }, 650);
    } catch (saveError) {
      console.error(
        "Profile save error:",
        saveError
      );

      setError(
        "Unable to connect to ZenvaZapp. Please try again."
      );

      setIsSaving(false);
      setSaveStage("");
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .profile-setup-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;

          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(193, 91, 150, 0.22),
              transparent 32%
            ),
            radial-gradient(
              circle at 85% 85%,
              rgba(123, 77, 161, 0.18),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #241724 0%,
              #321d2d 48%,
              #1c1420 100%
            );

          color: #ffffff;

          display: flex;
          justify-content: center;
          align-items: center;

          padding: 32px 16px;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
        }

        .profile-setup-card {
          width: 100%;
          max-width: 620px;

          padding: 34px 34px 38px;

          background:
            rgba(255, 255, 255, 0.055);

          border:
            1px solid
            rgba(255, 255, 255, 0.10);

          border-radius: 28px;

          box-shadow:
            0 30px 80px
            rgba(0, 0, 0, 0.42);

          backdrop-filter: blur(20px);

          animation:
            profileCardEnter
            0.55s ease both;
        }

        @keyframes profileCardEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =====================================
           HEADER
        ===================================== */

        .profile-setup-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .profile-setup-logo {
          width: 68px;
          height: 68px;

          margin: 0 auto 20px;

          border-radius: 21px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              145deg,
              #d96da5,
              #7d4aa2
            );

          color: #ffffff;

          font-size: 28px;
          font-weight: 900;

          letter-spacing: -4px;

          box-shadow:
            0 12px 35px
            rgba(193, 91, 150, 0.28);

          animation:
            logoFloat
            3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .profile-setup-header h1 {
          margin: 0;

          font-size: clamp(
            28px,
            5vw,
            38px
          );

          line-height: 1.15;

          font-weight: 800;

          letter-spacing: -0.8px;
        }

        .profile-setup-header p {
          margin: 12px 0 0;

          color: #c9afc1;

          font-size: 15px;

          line-height: 1.6;
        }

        /* =====================================
           PHOTO
        ===================================== */

        .profile-photo-section {
          text-align: center;

          padding: 8px 0 30px;

          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.08);

          margin-bottom: 28px;
        }

        .profile-photo-preview {
          width: 132px;
          height: 132px;

          margin: 0 auto 17px;

          border-radius: 50%;

          padding: 4px;

          background:
            linear-gradient(
              145deg,
              #e16da9,
              #7d4aa2
            );

          box-shadow:
            0 15px 40px
            rgba(0, 0, 0, 0.38);

          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .profile-photo-preview:hover {
          transform: scale(1.035);

          box-shadow:
            0 18px 45px
            rgba(193, 91, 150, 0.25);
        }

        .profile-photo-preview span,
        .profile-photo-preview img {
          width: 100%;
          height: 100%;

          border-radius: 50%;

          display: flex;

          align-items: center;
          justify-content: center;

          object-fit: cover;

          background:
            linear-gradient(
              145deg,
              #d96da5,
              #8952a7
            );

          color: #ffffff;

          font-size: 38px;
          font-weight: 800;
        }

        .profile-photo-section h2 {
          margin: 0;

          font-size: 19px;

          font-weight: 750;
        }

        .profile-photo-section > p {
          margin: 7px 0 20px;

          color: #ad99a7;

          font-size: 14px;
        }

        .profile-photo-actions {
          display: flex;

          justify-content: center;

          gap: 10px;

          flex-wrap: wrap;
        }

        .profile-photo-actions button {
          border:
            1px solid
            rgba(255, 255, 255, 0.12);

          background:
            rgba(255, 255, 255, 0.055);

          color: #ffffff;

          padding: 11px 15px;

          border-radius: 12px;

          font-size: 13px;

          font-weight: 650;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .profile-photo-actions button:hover {
          transform: translateY(-2px);

          background:
            rgba(193, 91, 150, 0.14);

          border-color:
            rgba(217, 109, 165, 0.45);
        }

        /* =====================================
           FORM
        ===================================== */

        .profile-setup-form {
          width: 100%;
        }

        .profile-form-group {
          margin-bottom: 20px;
        }

        .profile-form-group label {
          display: block;

          margin-bottom: 8px;

          color: #eee7ec;

          font-size: 14px;

          font-weight: 650;
        }

        .profile-input,
        .profile-textarea,
        .profile-select {
          width: 100%;

          border:
            1px solid
            rgba(255, 255, 255, 0.12);

          outline: none;

          background:
            rgba(255, 255, 255, 0.075);

          color: #ffffff;

          border-radius: 13px;

          padding: 14px 15px;

          font-size: 15px;

          font-family: inherit;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .profile-input::placeholder,
        .profile-textarea::placeholder {
          color: #927f8d;
        }

        .profile-input:focus,
        .profile-textarea:focus,
        .profile-select:focus {
          border-color: #d66ba5;

          background:
            rgba(255, 255, 255, 0.095);

          box-shadow:
            0 0 0 3px
            rgba(214, 107, 165, 0.13);
        }

        .profile-textarea {
          resize: vertical;

          min-height: 105px;

          line-height: 1.5;
        }

        .profile-select {
          appearance: none;

          cursor: pointer;

          background-image:
            linear-gradient(
              45deg,
              transparent 50%,
              #cdb7c7 50%
            ),
            linear-gradient(
              135deg,
              #cdb7c7 50%,
              transparent 50%
            );

          background-position:
            calc(100% - 18px) 50%,
            calc(100% - 13px) 50%;

          background-size:
            5px 5px,
            5px 5px;

          background-repeat: no-repeat;
        }

        .profile-select option {
          background: #2b1a27;

          color: #ffffff;
        }

        .profile-character-count {
          display: block;

          margin-top: 6px;

          text-align: right;

          color: #806e7b;

          font-size: 11px;
        }

        /* =====================================
           ERROR
        ===================================== */

        .profile-form-error {
          margin: 4px 0 18px;

          padding: 12px 14px;

          border-radius: 12px;

          background:
            rgba(214, 70, 93, 0.12);

          border:
            1px solid
            rgba(236, 91, 116, 0.25);

          color: #ffaaa9;

          font-size: 13px;

          line-height: 1.45;

          animation:
            errorShake
            0.35s ease;
        }

        @keyframes errorShake {
          0%,
          100% {
            transform: translateX(0);
          }

          25% {
            transform: translateX(-4px);
          }

          75% {
            transform: translateX(4px);
          }
        }

        /* =====================================
           SAVE BUTTON
        ===================================== */

        .profile-save-button {
          width: 100%;

          border: none;

          padding: 15px 18px;

          border-radius: 14px;

          background:
            linear-gradient(
              135deg,
              #d96da5,
              #8951a5
            );

          color: #ffffff;

          font-size: 15px;

          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 10px 28px
            rgba(193, 91, 150, 0.22);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .profile-save-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 14px 34px
            rgba(193, 91, 150, 0.32);
        }

        .profile-save-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .profile-save-button:disabled {
          cursor: not-allowed;

          opacity: 0.72;
        }

        .profile-save-content {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 10px;
        }

        .profile-spinner {
          width: 17px;
          height: 17px;

          border:
            2px solid
            rgba(255, 255, 255, 0.35);

          border-top-color:
            #ffffff;

          border-radius: 50%;

          animation:
            profileSpin
            0.75s linear infinite;
        }

        @keyframes profileSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .profile-success-icon {
          width: 18px;
          height: 18px;

          border-radius: 50%;

          display: inline-flex;

          align-items: center;
          justify-content: center;

          background: #ffffff;

          color: #8951a5;

          font-size: 12px;

          font-weight: 900;

          animation:
            successPop
            0.35s ease;
        }

        @keyframes successPop {
          from {
            opacity: 0;
            transform: scale(0.5);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* =====================================
           MOBILE
        ===================================== */

        @media (max-width: 600px) {
          .profile-setup-page {
            padding: 18px 12px;

            align-items: flex-start;
          }

          .profile-setup-card {
            margin-top: 8px;

            padding: 27px 18px 25px;

            border-radius: 22px;
          }

          .profile-setup-header {
            margin-bottom: 27px;
          }

          .profile-setup-logo {
            width: 58px;
            height: 58px;

            border-radius: 18px;

            font-size: 24px;
          }

          .profile-setup-header h1 {
            font-size: 27px;
          }

          .profile-setup-header p {
            font-size: 13px;

            padding: 0 10px;
          }

          .profile-photo-preview {
            width: 116px;
            height: 116px;
          }

          .profile-photo-preview span,
          .profile-photo-preview img {
            font-size: 32px;
          }

          .profile-photo-actions {
            display: grid;

            grid-template-columns:
              repeat(2, 1fr);

            gap: 8px;
          }

          .profile-photo-actions button {
            width: 100%;

            padding: 11px 7px;

            font-size: 12px;
          }

          .profile-photo-actions button:last-child {
            grid-column:
              1 / -1;
          }

          .profile-form-group {
            margin-bottom: 17px;
          }

          .profile-input,
          .profile-textarea,
          .profile-select {
            font-size: 16px;

            padding: 13px 14px;
          }

          .profile-save-button {
            padding: 15px;

            font-size: 15px;
          }
        }

        @media (max-width: 360px) {
          .profile-setup-card {
            padding-left: 14px;
            padding-right: 14px;
          }

          .profile-photo-actions {
            grid-template-columns: 1fr;
          }

          .profile-photo-actions button:last-child {
            grid-column: auto;
          }
        }

      `}</style>

      <main className="profile-setup-page">
        <section className="profile-setup-card">

          {/* HEADER */}

          <header className="profile-setup-header">
            <div className="profile-setup-logo">
              Zz
            </div>

            <h1>
              Set up your profile
            </h1>

            <p>
              Personalize your profile
              before entering ZenvaZapp.
            </p>
          </header>

          {/* PHOTO */}

          <section className="profile-photo-section">

            <div className="profile-photo-preview">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Your profile"
                />
              ) : (
                <span>
                  {getInitials()}
                </span>
              )}
            </div>

            <h2>
              Profile photo
            </h2>

            <p>
              Help your contacts recognize you.
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{
                display: "none",
              }}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoChange}
              style={{
                display: "none",
              }}
            />

            <div className="profile-photo-actions">

              <button
                type="button"
                onClick={() =>
                  cameraInputRef.current?.click()
                }
              >
                📷 Take photo
              </button>

              <button
                type="button"
                onClick={() =>
                  photoInputRef.current?.click()
                }
              >
                🖼️ Choose photo
              </button>

              <button
                type="button"
                onClick={handleRemovePhoto}
              >
                👤 Default
              </button>

            </div>
          </section>

          {/* FORM */}

          <form
            className="profile-setup-form"
            onSubmit={handleSubmit}
          >

            <div className="profile-form-group">

              <label htmlFor="displayName">
                Display name
              </label>

              <input
                id="displayName"
                className="profile-input"
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                maxLength={100}
                autoComplete="name"
                onChange={(event) => {
                  setDisplayName(
                    event.target.value
                  );

                  setError("");
                }}
              />

              <span className="profile-character-count">
                {displayName.length}/100
              </span>

            </div>

            <div className="profile-form-group">

              <label htmlFor="bio">
                Bio
              </label>

              <textarea
                id="bio"
                className="profile-textarea"
                placeholder="Tell people a little about yourself..."
                value={bio}
                maxLength={160}
                rows={4}
                onChange={(event) => {
                  setBio(
                    event.target.value
                  );

                  setError("");
                }}
              />

              <span className="profile-character-count">
                {bio.length}/160
              </span>

            </div>

            <div className="profile-form-group">

              <label htmlFor="gender">
                Gender
              </label>

              <select
                id="gender"
                className="profile-select"
                value={gender}
                onChange={(event) => {
                  setGender(
                    event.target.value
                  );

                  setError("");
                }}
              >
                <option value="">
                  Select gender
                </option>

                <option value="male">
                  Male
                </option>

                <option value="female">
                  Female
                </option>

                <option value="other">
                  Other
                </option>

                <option value="prefer-not-to-say">
                  Prefer not to say
                </option>
              </select>

            </div>

            {error && (
              <div
                className="profile-form-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="profile-save-button"
              disabled={
                isSaving ||
                isCompleted
              }
            >
              <span className="profile-save-content">

                {isSaving &&
                  !isCompleted && (
                    <span className="profile-spinner" />
                  )}

                {isCompleted && (
                  <span className="profile-success-icon">
                    ✓
                  </span>
                )}

                <span>
                  {isCompleted
                    ? saveStage
                    : isSaving
                    ? saveStage
                    : "Continue to ZenvaZapp →"}
                </span>

              </span>
            </button>

          </form>

        </section>
      </main>
    </>
  );
}

export default ProfileSetup;