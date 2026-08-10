import { useRef, useState } from "react";
import "./profile.css";

function ProfileSetup({ onComplete, user }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [profilePhoto, setProfilePhoto] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const defaultAvatar =
    "https://ui-avatars.com/api/?name=ZenvaZapp&background=random&size=300";

  // ==========================================
  // CHOOSE PHOTO
  // ==========================================

  const handleChoosePhoto = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Please choose an image smaller than 5MB."
      );
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setProfilePhoto(imageUrl);
  };

  // ==========================================
  // TAKE PHOTO
  // ==========================================

  const handleTakePhoto = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please take a valid photo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Please choose a photo smaller than 5MB."
      );
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setProfilePhoto(imageUrl);
  };

  // ==========================================
  // DEFAULT AVATAR
  // ==========================================

  const handleDefaultAvatar = () => {
    setProfilePhoto(defaultAvatar);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanedDisplayName = displayName.trim();
    const cleanedBio = bio.trim();

    // ------------------------------------------
    // Display name validation
    // ------------------------------------------

    if (!cleanedDisplayName) {
      setErrorMessage(
        "Please enter a display name."
      );
      return;
    }

    if (cleanedDisplayName.length < 2) {
      setErrorMessage(
        "Display name must contain at least 2 characters."
      );
      return;
    }

    // ------------------------------------------
    // Gender validation
    // ------------------------------------------

    if (!gender) {
      setErrorMessage(
        "Please select your gender preference."
      );
      return;
    }

    // ------------------------------------------
    // Get login token
    // ------------------------------------------

    const token = localStorage.getItem(
      "zenvazappToken"
    );

    if (!token) {
      setErrorMessage(
        "Your login session was not found. Please log in again."
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/profile",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            displayName: cleanedDisplayName,
            bio: cleanedBio,
            gender,

            profilePhoto:
              profilePhoto === defaultAvatar
                ? defaultAvatar
                : "",
          }),
        }
      );

      const data = await response.json();

      // ------------------------------------------
      // Backend error
      // ------------------------------------------

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.message ||
            "Unable to save your profile."
        );
        return;
      }

      // ------------------------------------------
      // Save updated user locally
      // ------------------------------------------

      if (data.user) {
        localStorage.setItem(
          "zenvazappUser",
          JSON.stringify(data.user)
        );
      }

      // ------------------------------------------
      // Success
      // ------------------------------------------

      setSuccessMessage(
        "Profile completed successfully!"
      );

      console.log(
        "Profile completed successfully:",
        data.user
      );

      // Give the success message a moment
      // before moving to the next screen.
      setTimeout(() => {
        if (onComplete) {
          onComplete(data.user);
        }
      }, 700);
    } catch (error) {
      console.error(
        "Profile setup error:",
        error
      );

      setErrorMessage(
        "Unable to connect to ZenvaZapp server. Make sure the backend is running."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="profile-page">
      <section className="profile-card">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="profile-header">

          <div className="profile-logo">
            <span className="logo-z-upper">
              Z
            </span>

            <span className="logo-z-lower">
              z
            </span>
          </div>

          <h1>Set up your profile</h1>

          <p>
            Complete your profile before entering
            ZenvaZapp.
          </p>

        </div>

        {/* ======================================
            ERROR
        ====================================== */}

        {errorMessage && (
          <div
            className="profile-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* ======================================
            SUCCESS
        ====================================== */}

        {successMessage && (
          <div
            className="profile-success"
            role="status"
          >
            {successMessage}
          </div>
        )}

        {/* ======================================
            PROFILE PHOTO
        ====================================== */}

        <div className="profile-photo-section">

          <div className="profile-photo-wrapper">
            <img
              src={
                profilePhoto ||
                defaultAvatar
              }
              alt="Profile preview"
              className="profile-photo"
            />
          </div>

          <div className="photo-text">
            <h3>Profile photo</h3>

            <p>
              Add a photo so people can recognize
              you.
            </p>
          </div>

          <div className="photo-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                cameraInputRef.current?.click()
              }
              disabled={isSaving}
            >
              📷 Take photo
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={isSaving}
            >
              🖼️ Choose photo
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleDefaultAvatar}
              disabled={isSaving}
            >
              👤 Default
            </button>

          </div>

          {/* Device image */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChoosePhoto}
            hidden
          />

          {/* Camera */}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleTakePhoto}
            hidden
          />

        </div>

        {/* ======================================
            PROFILE FORM
        ====================================== */}

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

          {/* Display Name */}

          <div className="profile-field">

            <label htmlFor="displayName">
              Display name
            </label>

            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(
                  event.target.value
                )
              }
              placeholder="How should people see you?"
              maxLength={100}
              disabled={isSaving}
            />

            <small>
              This is the name other users will see.
            </small>

          </div>

          {/* Bio */}

          <div className="profile-field">

            <div className="field-heading">

              <label htmlFor="bio">
                Bio
              </label>

              <span>
                {bio.length}/160
              </span>

            </div>

            <textarea
              id="bio"
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              placeholder="Tell people a little about yourself..."
              maxLength={160}
              rows={4}
              disabled={isSaving}
            />

          </div>

          {/* Gender */}

          <div className="profile-field">

            <label htmlFor="gender">
              Gender
            </label>

            <select
              id="gender"
              value={gender}
              onChange={(event) =>
                setGender(event.target.value)
              }
              disabled={isSaving}
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

          {/* Complete Profile */}

          <button
            type="submit"
            className="complete-profile-button"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving profile..."
              : "Complete profile"}
          </button>

        </form>

      </section>
    </main>
  );
}

export default ProfileSetup;