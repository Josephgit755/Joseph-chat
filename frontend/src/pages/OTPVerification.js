import { useEffect, useRef, useState } from "react";

function OTPVerification({ method = "phone",
  destination = "+237 ••••••1234",
  onBack,
  user,
  onVerified, }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleChange = (index, value) => {
    setError("");

    const digit = value.replace(/\D/g, "").slice(-1);

    const updatedOtp = [...otp];
    updatedOtp[index] = digit;

    setOtp(updatedOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedValue) {
      return;
    }

    const updatedOtp = ["", "", "", "", "", ""];

    pastedValue.split("").forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);

    const nextIndex = Math.min(pastedValue.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    const code = otp.join("");

    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setError("");
    setIsVerifying(true);

    /*
      Backend OTP verification will be connected later.

      Example future request:

      POST /api/auth/verify-otp
    */

    setTimeout(() => {
      setIsVerifying(false);
      if (onVerified) {
        onVerified(user);
      }
    }, 1000);
  };

  const handleResend = () => {
    if (secondsLeft > 0) {
      return;
    }

    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSecondsLeft(60);

    inputRefs.current[0]?.focus();

    /*
      Real SMS/email OTP resend will be connected
      to the backend later.
    */
  };

  const formattedTime = `00:${String(secondsLeft).padStart(2, "0")}`;

  const deliveryText =
    method === "phone"
      ? "We've sent a 6-digit verification code to"
      : "We've sent a 6-digit verification code to your email";

  return (
    <main className="auth-page">
      <section className="auth-card otp-card">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="auth-header">
          <div className="auth-logo">Z</div>

          <h1>Verify your account</h1>

          <p>{deliveryText}</p>

          <strong className="otp-destination">
            {destination}
          </strong>
        </div>

        <form onSubmit={handleVerify} className="otp-form">
          <div
            className="otp-inputs"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) =>
                  handleChange(index, event.target.value)
                }
                onKeyDown={(event) =>
                  handleKeyDown(index, event)
                }
                aria-label={`OTP digit ${index + 1}`}
                autoComplete={index === 0 ? "one-time-code" : "off"}
              />
            ))}
          </div>

          {error && (
            <p className="otp-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="otp-resend">
          {secondsLeft > 0 ? (
            <p>
              Didn't receive the code?
              <span> Resend in {formattedTime}</span>
            </p>
          ) : (
            <p>
              Didn't receive the code?
              <button
                type="button"
                className="inline-link"
                onClick={handleResend}
              >
                Resend OTP
              </button>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default OTPVerification;