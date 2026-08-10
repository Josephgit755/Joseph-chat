import { useState } from "react";
import OTPVerification from "./OTPVerification";
import Register from "./Register";

function Login({ onAuthenticated }) {
  const [method, setMethod] = useState("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(null);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoginError("");

    if (!agreedToTerms) {
      setLoginError(
        "Please agree to the Terms of Service and Privacy Policy."
      );
      return;
    }

    if (!identifier.trim()) {
      setLoginError(
        method === "phone"
          ? "Please enter your phone number."
          : "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoginError(
          data.message || "Login failed."
        );
        setIsLoggingIn(false);
        return;
      }

      // Save JWT
      localStorage.setItem(
        "zenvazappToken",
        data.token
      );

      // Save user information
      localStorage.setItem(
        "zenvazappUser",
        JSON.stringify(data.user)
      );

      setLoggedInUser(data.user);

      setIsLoggingIn(false);

      // Move to OTP screen
      setShowOTP(true);
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        "Unable to connect to ZenvaZapp server."
      );

      setIsLoggingIn(false);
    }
  };

  // ==========================================
  // REGISTER SCREEN
  // ==========================================

  if (showRegister) {
    return (
      <Register
        onBack={() => setShowRegister(false)}
      />
    );
  }

  // ==========================================
  // OTP SCREEN
  // ==========================================

  if (showOTP) {
    return (
      <OTPVerification
        method={method}
        destination={
          method === "phone"
            ? identifier
            : identifier
        }
        user={loggedInUser}
        onBack={() => setShowOTP(false)}
        onVerified={() => {
          if (onAuthenticated) {
            onAuthenticated(loggedInUser);
          }
        }}
      />
    );
  }

  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  return (
    <main className="auth-page">
      <section className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">Zz</div>

          <h1>Welcome back</h1>

          <p>
            Sign in to continue to ZenvaZapp
          </p>
        </div>

        {/* Phone / Email selector */}
        <div className="auth-methods">

          <button
            type="button"
            className={
              method === "phone"
                ? "active"
                : ""
            }
            onClick={() => setMethod("phone")}
          >
            Phone
          </button>

          <button
            type="button"
            className={
              method === "email"
                ? "active"
                : ""
            }
            onClick={() => setMethod("email")}
          >
            Email
          </button>

        </div>

        {/* Login form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* Identifier */}
          <div className="form-group">

            <label htmlFor="identifier">
              {method === "phone"
                ? "Phone number"
                : "Email address"}
            </label>

            <input
              id="identifier"
              type={
                method === "phone"
                  ? "tel"
                  : "email"
              }
              placeholder={
                method === "phone"
                  ? "Enter your phone number"
                  : "Enter your email address"
              }
              autoComplete={
                method === "phone"
                  ? "tel"
                  : "email"
              }
              value={identifier}
              onChange={(event) =>
                setIdentifier(
                  event.target.value
                )
              }
            />

          </div>

          {/* Password */}
          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-field">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>
          </div>

          {/* Error */}
          {loginError && (
            <p
              className="otp-error"
              role="alert"
            >
              {loginError}
            </p>
          )}

          {/* Terms */}
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

          {/* Continue */}
          <button
            type="submit"
            className="primary-button"
            disabled={
              !agreedToTerms ||
              isLoggingIn
            }
          >
            {isLoggingIn
              ? "Signing in..."
              : "Continue"}
          </button>

        </form>

        {/* Forgot password */}
        <button
          type="button"
          className="forgot-password"
        >
          Forgot password?
        </button>

        {/* Divider */}
        <div className="social-divider">
          <span>
            or continue with
          </span>
        </div>

        {/* Social authentication */}
        <div className="social-buttons">

          <button
            type="button"
            className="social-button"
          >
            <span className="social-icon google-icon">
              G
            </span>

            Continue with Google
          </button>

          <button
            type="button"
            className="social-button"
          >
            <span className="social-icon apple-icon">
              ●
            </span>

            Continue with Apple
          </button>

        </div>

        {/* Register */}
        <div className="register-prompt">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            className="inline-link"
            onClick={() =>
              setShowRegister(true)
            }
          >
            Create account
          </button>

        </div>

      </section>
    </main>
  );
}

export default Login;