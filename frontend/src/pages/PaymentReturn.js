import React, {
  useEffect,
  useState,
} from "react";

function PaymentReturn({
  onBack,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [status, setStatus] =
    useState("checking");

  const [message, setMessage] =
    useState(
      "Verifying your payment..."
    );

  useEffect(() => {
    const verify = async () => {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const transactionId =
          params.get(
            "transaction_id"
          );

        if (!transactionId) {
          setStatus("error");

          setMessage(
            "No transaction was provided."
          );

          return;
        }

        const token =
          localStorage.getItem(
            "zenvazapp_token"
          );

        const response =
          await fetch(
            `${API_URL}/api/payments/verify/${encodeURIComponent(
              transactionId
            )}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to verify payment."
          );
        }

        const transaction =
          data.transaction;

        if (
          transaction.status ===
          "successful"
        ) {
          setStatus(
            "success"
          );

          setMessage(
            "Payment completed successfully."
          );
        } else if (
          transaction.status ===
          "failed"
        ) {
          setStatus(
            "failed"
          );

          setMessage(
            "Payment failed."
          );
        } else {
          setStatus(
            "waiting"
          );

          setMessage(
            "Your payment is still being confirmed. Please check again shortly."
          );
        }
      } catch (error) {
        console.error(error);

        setStatus("error");

        setMessage(
          error.message ||
            "Unable to verify payment."
        );
      }
    };

    verify();
  }, [API_URL]);

  return (
    <div
      style={{
        minHeight:
          "100vh",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "24px",
        textAlign:
          "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize:
              "55px",
            marginBottom:
              "20px",
          }}
        >
          {status ===
          "success"
            ? "✓"
            : status ===
              "failed"
            ? "✕"
            : status ===
              "waiting"
            ? "⏳"
            : "🔐"}
        </div>

        <h1>
          {status ===
          "success"
            ? "Payment Successful"
            : status ===
              "failed"
            ? "Payment Failed"
            : "Payment Verification"}
        </h1>

        <p>
          {message}
        </p>

        <button
          type="button"
          onClick={onBack}
        >
          Return to ZenvaZapp
        </button>
      </div>
    </div>
  );
}

export default PaymentReturn;