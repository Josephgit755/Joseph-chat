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

  const [error, setError] = useState("");

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const inputRefs = useRef([]);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // FOCUS FIRST OTP INPUT
  // ==========================================

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ==========================================
  // OTP COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) =>
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

    const digit = value
      .replace(/\D/g, "")
      .slice(-1);

    const updatedOtp = [...otp];

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
    setError("");

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

    const code =
      otp.join("");

    if (code.length !== 6) {
      setError(
        "Please enter all 6 digits."
      );
      return;
    }

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
              userId: user.id,
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
            "Incorrect or expired OTP."
        );

        setIsVerifying(false);
        return;
      }

      // ======================================
      // OTP VERIFIED
      // ======================================

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setIsVerifying(false);

      if (onVerified) {
        onVerified(
          data.user
        );
      }
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setError(
        error.message ||
          "Unable to verify the OTP. Please try again."
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
        "Your login session is missing. Please go back and log in again."
      );
      return;
    }

    setError("");
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
              userId: user.id,
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

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setSecondsLeft(60);

      setIsResending(false);

      setTimeout(() => {
        inputRefs.current[
          0
        ]?.focus();
      }, 50);
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      setError(
        error.message ||
          "Unable to resend the verification code."
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
      ? "We've sent a 6-digit verification code to your phone"
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
            Zz
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
          onSubmit={handleVerify}
          className="otp-form"
        >

          <div
            className="otp-inputs"
            onPaste={handlePaste}
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
                    isVerifying ||
                    isResending
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
              Didn't receive the code?
              <span>
                {" "}
                Resend in{" "}
                {formattedTime}
              </span>
            </p>
          ) : (
            <p>
              Didn't receive the code?{" "}

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
                  ? "Sending..."
                  : "Resend OTP"}
              </button>
            </p>
          )}

        </div>

      </section>
    </main>
  );
}

export default OTPVerification;