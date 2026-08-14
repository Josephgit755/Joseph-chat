
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

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

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
        `${API_URL}/api/auth/login`,
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

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response.");
      }

      if (!response.ok || !data.success) {
        setLoginError(
          data.message || "Login failed."
        );

        setIsLoggingIn(false);
        return;
      }

      // ======================================
      // IMPORTANT SECURITY FLOW
      // ======================================
      // DO NOT save JWT here.
      //
      // At this stage:
      // 1. Email/phone is verified
      // 2. Password is verified
      // 3. OTP has been sent to Gmail
      // 4. User must still enter OTP
      //
      // JWT is created only after OTP verification.

      setLoggedInUser(data.user);

      setIsLoggingIn(false);

      setShowOTP(true);
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        error.message ||
          "Unable to connect to ZenvaZapp server."
      );

      setIsLoggingIn(false);
    }
  };

  // ==========================================
  // REGISTER
  // ==========================================

  if (showRegister) {
    return (
      <Register
        onBack={() => setShowRegister(false)}
      />
    );
  }

  // ==========================================
  // OTP VERIFICATION
  // ==========================================

  if (showOTP) {
    return (
      <OTPVerification
        method={method}
        destination={loggedInUser?.email || identifier}
        user={loggedInUser}
        onBack={() => {
          setShowOTP(false);
          setLoginError("");
        }}
        onVerified={(verifiedUser) => {
          if (onAuthenticated) {
            onAuthenticated(verifiedUser);
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

        {/* HEADER */}
        <div className="auth-header">
          <div className="auth-logo">
            Zz
          </div>

          <h1>
            Welcome back
          </h1>

          <p>
            Sign in to continue to ZenvaZapp
          </p>
        </div>

        {/* PHONE / EMAIL */}
        <div className="auth-methods">

          <button
            type="button"
            className={
              method === "phone"
                ? "active"
                : ""
            }
            onClick={() => {
              setMethod("phone");
              setIdentifier("");
              setLoginError("");
            }}
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
            onClick={() => {
              setMethod("email");
              setIdentifier("");
              setLoginError("");
            }}
          >
            Email
          </button>

        </div>

        {/* LOGIN FORM */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* IDENTIFIER */}
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
              onChange={(event) => {
                setIdentifier(
                  event.target.value
                );
                setLoginError("");
              }}
            />

          </div>

          {/* PASSWORD */}
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
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );
                  setLoginError("");
                }}
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

          {/* LOGIN ERROR */}
          {loginError && (
            <p
              className="otp-error"
              role="alert"
            >
              {loginError}
            </p>
          )}

          {/* TERMS */}
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

          {/* CONTINUE */}
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

        {/* FORGOT PASSWORD */}
        <button
          type="button"
          className="forgot-password"
        >
          Forgot password?
        </button>

        {/* SOCIAL DIVIDER */}
        <div className="social-divider">
          <span>
            or continue with
          </span>
        </div>

        {/* SOCIAL LOGIN */}
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

        {/* REGISTER */}
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
