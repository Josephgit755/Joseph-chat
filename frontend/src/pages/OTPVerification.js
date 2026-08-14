import { useEffect, useRef, useState } from "react";

function OTPVerification({
  method = "email",
  destination = "",
  onBack,
  user,
  onVerified,
}) {
  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [secondsLeft, setSecondsLeft] =
    useState(60);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const inputRefs = useRef([]);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // FOCUS FIRST INPUT
  // ==========================================

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ==========================================
  // COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(
        (previous) =>
          previous > 0
            ? previous - 1
            : 0
      );
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [secondsLeft]);

  // ==========================================
  // HANDLE OTP INPUT
  // ==========================================

  const handleChange = (
    index,
    value
  ) => {
    setError("");
    setSuccessMessage("");

    const digit = value
      .replace(/\D/g, "")
      .slice(-1);

    const updatedOtp = [
      ...otp,
    ];

    updatedOtp[index] = digit;

    setOtp(updatedOtp);

    if (
      digit &&
      index < 5
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // ==========================================
  // KEYBOARD NAVIGATION
  // ==========================================

  const handleKeyDown = (
    index,
    event
  ) => {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < 5
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // ==========================================
  // PASTE OTP
  // ==========================================

  const handlePaste = (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const pastedValue =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pastedValue) {
      return;
    }

    const updatedOtp = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    pastedValue
      .split("")
      .forEach(
        (digit, index) => {
          updatedOtp[index] =
            digit;
        }
      );

    setOtp(updatedOtp);

    const nextIndex = Math.min(
      pastedValue.length,
      5
    );

    inputRefs.current[
      nextIndex
    ]?.focus();
  };

  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleVerify = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const code =
      otp.join("");

    // Check six digits
    if (
      code.length !== 6
    ) {
      setError(
        "Please enter all 6 digits."
      );
      return;
    }

    // Make sure user exists
    if (!user?.id) {
      setError(
        "Your login session is missing. Please go back and log in again."
      );
      return;
    }

    setIsVerifying(true);

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/verify-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                user.id,

              otp: code,
            }),
          }
        );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid server response."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "OTP verification failed."
        );

        setIsVerifying(false);
        return;
      }

      // ======================================
      // OTP IS REALLY VERIFIED
      // ======================================

      if (data.token) {
        localStorage.setItem(
          "zenvazappToken",
          data.token
        );
      }

      if (data.user) {
        localStorage.setItem(
          "zenvazappUser",
          JSON.stringify(
            data.user
          )
        );
      }

      setSuccessMessage(
        "OTP verified successfully."
      );

      setIsVerifying(false);

      // Give the user a moment to see success
      setTimeout(() => {
        if (onVerified) {
          onVerified(
            data.user || user
          );
        }
      }, 500);
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setError(
        "Unable to connect to ZenvaZapp server."
      );

      setIsVerifying(false);
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResend = async () => {
    if (
      secondsLeft > 0 ||
      isResending
    ) {
      return;
    }

    if (!user?.id) {
      setError(
        "Your login session is missing. Please log in again."
      );
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsResending(true);

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/resend-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                user.id,
            }),
          }
        );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid server response."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Unable to resend OTP."
        );

        setIsResending(false);
        return;
      }

      // Clear old OTP
      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      // Restart countdown
      setSecondsLeft(60);

      setSuccessMessage(
        "A new OTP has been sent to your email."
      );

      setIsResending(false);

      inputRefs.current[
        0
      ]?.focus();
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      setError(
        "Unable to connect to ZenvaZapp server."
      );

      setIsResending(false);
    }
  };

  // ==========================================
  // FORMAT TIMER
  // ==========================================

  const formattedTime =
    `00:${String(
      secondsLeft
    ).padStart(2, "0")}`;

  // ==========================================
  // DELIVERY TEXT
  // ==========================================

  const deliveryText =
    method === "phone"
      ? "We've sent a 6-digit verification code to"
      : "We've sent a 6-digit verification code to your email";

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="auth-page">
      <section className="auth-card otp-card">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
          disabled={
            isVerifying ||
            isResending
          }
        >
          ← Back
        </button>

        <div className="auth-header">

          <div className="auth-logo">
            Z
          </div>

          <h1>
            Verify your account
          </h1>

          <p>
            {deliveryText}
          </p>

          <strong className="otp-destination">
            {destination}
          </strong>

        </div>

        <form
          onSubmit={
            handleVerify
          }
          className="otp-form"
        >

          <div
            className="otp-inputs"
            onPaste={
              handlePaste
            }
          >
            {otp.map(
              (
                digit,
                index
              ) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[
                      index
                    ] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      index,
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) =>
                    handleKeyDown(
                      index,
                      event
                    )
                  }
                  aria-label={`OTP digit ${
                    index + 1
                  }`}
                  autoComplete={
                    index === 0
                      ? "one-time-code"
                      : "off"
                  }
                  disabled={
                    isVerifying
                  }
                />
              )
            )}
          </div>

          {error && (
            <p
              className="otp-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {successMessage && (
            <p
              className="otp-success"
              role="status"
            >
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={
              isVerifying ||
              isResending
            }
          >
            {isVerifying
              ? "Verifying..."
              : "Verify OTP"}
          </button>

        </form>

        <div className="otp-resend">

          {secondsLeft > 0 ? (
            <p>
              Didn't receive
              the code?
              <span>
                {" "}
                Resend in{" "}
                {formattedTime}
              </span>
            </p>
          ) : (
            <p>
              Didn't receive
              the code?

              <button
                type="button"
                className="inline-link"
                onClick={
                  handleResend
                }
                disabled={
                  isResending
                }
              >
                {isResending
                  ss? " Sending..."
                  : " Resend OTP"}
              </button>
            </p>
          )}

        </div>

      </section>
    </main>
  );
}

export default OTPVerification;