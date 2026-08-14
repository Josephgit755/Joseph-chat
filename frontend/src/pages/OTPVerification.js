import {
  useEffect,
  useRef,
  useState,
} from "react";

function OTPVerification({
  destination,
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

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const inputRefs =
    useRef([]);

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
          previous - 1
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [secondsLeft]);

  // ==========================================
  // INPUT CHANGE
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
  // KEYBOARD
  // ==========================================

  const handleKeyDown = (
    index,
    event
  ) => {
    if (
      event.key ===
        "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowRight" &&
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

    const nextIndex =
      Math.min(
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

  const handleVerify =
    async (event) => {
      event.preventDefault();

      const code =
        otp.join("");

      if (
        code.length !== 6
      ) {
        setError(
          "Please enter all 6 digits."
        );

        return;
      }

      if (!user?.id) {
        setError(
          "Your login session is invalid. Please login again."
        );

        return;
      }

      setError("");
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

          setOtp([
            "",
            "",
            "",
            "",
            "",
            "",
          ]);

          inputRefs.current[0]?.focus();

          setIsVerifying(false);

          return;
        }

        // ======================================
        // OTP VERIFIED
        // ======================================

        if (!data.token) {
          setError(
            "OTP was verified, but the login token was not received."
          );

          setIsVerifying(false);

          return;
        }

        // ======================================
        // SAVE JWT
        // ======================================

        localStorage.setItem(
          "zenvazapp_token",
          data.token
        );

        // ======================================
        // SAVE USER
        // ======================================

        if (data.user) {
          localStorage.setItem(
            "zenvazappUser",
            JSON.stringify(
              data.user
            )
          );
        }

        setIsVerifying(false);

        // ======================================
        // CONTINUE APP FLOW
        // ======================================

        if (onVerified) {
          onVerified(
            data.user
          );
        }
      } catch (requestError) {
        console.error(
          "OTP verification error:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to connect to ZenvaZapp server."
        );

        setIsVerifying(false);
      }
    };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResend =
    async () => {
      if (
        secondsLeft > 0 ||
        isResending
      ) {
        return;
      }

      if (!user?.id) {
        setError(
          "Your login session is invalid. Please login again."
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

          if (
            data.retryAfter
          ) {
            setSecondsLeft(
              data.retryAfter
            );
          }

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

        inputRefs.current[0]?.focus();

        setIsResending(false);
      } catch (requestError) {
        console.error(
          "Resend OTP error:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to connect to ZenvaZapp server."
        );

        setIsResending(false);
      }
    };

  // ==========================================
  // TIMER
  // ==========================================

  const formattedTime =
    `00:${String(
      secondsLeft
    ).padStart(2, "0")}`;

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
            We've sent a 6-digit
            verification code to
          </p>

          <strong className="otp-destination">
            {destination ||
              user?.email ||
              "your email"}
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

          <button
            type="submit"
            className="primary-button"
            disabled={
              isVerifying
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