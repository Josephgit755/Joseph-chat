import { useState } from "react";

function Register({ onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");

    if (name === "username") {
      if (!value.trim()) {
        setUsernameStatus("idle");
      } else {
        setUsernameStatus("checking");
      }
    }
  };

  // Password requirements
  const passwordRules = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  // Check whether passwords match
  const passwordsMatch =
    formData.password.length > 0 &&
    formData.password === formData.confirmPassword;

  // Password must satisfy every rule
  const passwordIsValid =
    passwordRules.minLength &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special &&
    passwordsMatch;

  // Check whether the complete form is valid
  const formIsValid =
    formData.fullName.trim() &&
    formData.username.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    passwordIsValid &&
    agreedToTerms &&
    usernameStatus !== "unavailable";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!formIsValid) {
      setErrorMessage(
        "Please complete all required fields correctly."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Registration failed."
        );
        return;
      }

      setSuccessMessage(
        "Account created successfully!"
      );

      console.log("Registered user:", data.user);

      setFormData({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setAgreedToTerms(false);
      setUsernameStatus("idle");
    } catch (error) {
      console.error("Registration error:", error);

      setErrorMessage(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card register-card">

        {/* Back button */}
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">Z</div>

          <h1>Create your account</h1>

          <p>
            Join ZenvaZapp and start connecting with people.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="auth-error">
            {errorMessage}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="auth-success">
            {successMessage}
          </div>
        )}

        {/* Registration form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">
              Full name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="@username"
              autoComplete="username"
            />

            {formData.username && (
              <p
                className={`username-status ${usernameStatus}`}
              >
                {usernameStatus === "checking" &&
                  "Checking username..."}

                {usernameStatus === "available" &&
                  "✓ Username available"}

                {usernameStatus === "unavailable" &&
                  "✕ Username already taken"}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="registerEmail">
              Email address
            </label>

            <input
              id="registerEmail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="registerPhone">
              Phone number
            </label>

            <input
              id="registerPhone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              autoComplete="tel"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="registerPassword">
              Password
            </label>

            <div className="password-field">
              <input
                id="registerPassword"
                name="password"
                type={
                  showPassword ? "text" : "password"
                }
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Password rules */}
            <div className="password-rules">

              <PasswordRule
                valid={passwordRules.minLength}
                text="At least 8 characters"
              />

              <PasswordRule
                valid={passwordRules.uppercase}
                text="One uppercase letter"
              />

              <PasswordRule
                valid={passwordRules.lowercase}
                text="One lowercase letter"
              />

              <PasswordRule
                valid={passwordRules.number}
                text="One number"
              />

              <PasswordRule
                valid={passwordRules.special}
                text="One special character"
              />

            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="password-field">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {formData.confirmPassword && (
              <p
                className={`password-match ${
                  passwordsMatch
                    ? "valid"
                    : "invalid"
                }`}
              >
                {passwordsMatch
                  ? "✓ Passwords match"
                  : "✕ Passwords do not match"}
              </p>
            )}
          </div>

          {/* Terms and Privacy */}
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(event) =>
                setAgreedToTerms(
                  event.target.checked
                )
              }
            />

            <span>
              I agree to the{" "}

              <button
                type="button"
                className="inline-link"
              >
                ZenvaZapp Terms of Service
              </button>{" "}

              and{" "}

              <button
                type="button"
                className="inline-link"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          {/* Create Account */}
          <button
            type="submit"
            className="primary-button"
            disabled={!formIsValid || isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create account"}
          </button>

        </form>

        {/* Login prompt */}
        <div className="register-prompt">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            className="inline-link"
            onClick={onBack}
          >
            Sign in
          </button>
        </div>

      </section>
    </main>
  );
}

function PasswordRule({ valid, text }) {
  return (
    <div
      className={`password-rule ${
        valid ? "valid" : ""
      }`}
    >
      <span>
        {valid ? "✓" : "○"}
      </span>

      <span>
        {text}
      </span>
    </div>
  );
}

export default Register;