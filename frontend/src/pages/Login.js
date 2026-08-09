import { useState } from "react";
import OTPVerification from "./OTPVerification";
import Register from "./Register";


function Login() {
  const [method, setMethod] = useState("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = (event) => {
  event.preventDefault();

  if (!agreedToTerms) {
    return;
  }

  setShowOTP(true);
};
if (showRegister) {
  return (
    <Register
      onBack={() => setShowRegister(false)}
    />
  );
}

if (showOTP) {
  return (
    <OTPVerification
      method={method}
      destination={
        method === "phone"
          ? "+237 ••••••1234"
          : "jo••••@example.com"
      }
      onBack={() => setShowOTP(false)}
    />
  );
}


  return (
    
    <main className="auth-page">
      <section className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">Zz</div>

          <h1>Welcome back</h1>

          <p>Sign in to continue to ZenvaZapp</p>
        </div>

        {/* Phone / Email selector */}
        <div className="auth-methods">
          <button
            type="button"
            className={method === "phone" ? "active" : ""}
            onClick={() => setMethod("phone")}
          >
            Phone
          </button>

          <button
            type="button"
            className={method === "email" ? "active" : ""}
            onClick={() => setMethod("email")}
          >
            Email
          </button>
        </div>

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {method === "phone" ? (
            <div className="form-group">
              <label htmlFor="phone">Phone number</label>

              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(event) =>
                setAgreedToTerms(event.target.checked)
              }
            />

            <span>
              I agree to the{" "}
              <button type="button" className="inline-link">
                ZenvaZapp Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="inline-link">
                Privacy Policy
              </button>
              .
            </span>
          </label>

          {/* Continue */}
          <button
            type="submit"
            className="primary-button"
            disabled={!agreedToTerms}
          >
            Continue
          </button>
        </form>

        {/* Forgot password */}
        <button type="button" className="forgot-password">
          Forgot password?
        </button>

        {/* Divider */}
        <div className="social-divider">
          <span>or continue with</span>
        </div>

        {/* Social authentication */}
        <div className="social-buttons">
          <button type="button" className="social-button">
            <span className="social-icon google-icon">G</span>
            Continue with Google
          </button>

          <button type="button" className="social-button">
            <span className="social-icon apple-icon">●</span>
            Continue with Apple
          </button>
        </div>

        {/* Register */}
        <div className="register-prompt">
          <span>Don't have an account?</span>

          <button
              type="button"
              className="inline-link"
               onClick={() => setShowRegister(true)}
            >
             Create account
            </button>
        </div>
      </section>
    </main>
  );
}

export default Login;