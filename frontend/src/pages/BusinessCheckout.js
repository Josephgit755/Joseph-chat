import React, {
  useState,
} from "react";

import "./business-checkout.css";

function BusinessCheckout({
  checkout,
  user,
  onBack,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [
    deliveryAddress,
    setDeliveryAddress,
  ] = useState("");

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState(
    user?.phone || ""
  );

  const [
    customerNote,
    setCustomerNote,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  if (!checkout) {
    return null;
  }

  const createOrder =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "zenvazapp_token"
          );

        const response =
          await fetch(
            `${API_URL}/api/orders`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                businessId:
                  checkout.business
                    ._id,

                items:
                  checkout.items.map(
                    (item) => ({
                      productId:
                        item.productId,

                      quantity:
                        item.quantity,
                    })
                  ),

                deliveryAddress,

                customerPhone,

                customerNote,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to create order."
          );
        }

        const paymentResponse =
          await fetch(
            `${API_URL}/api/payments/product`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                orderId:
                  data.order._id,
              }),
            }
          );

        const paymentData =
          await paymentResponse.json();

        if (
          !paymentResponse.ok
        ) {
          throw new Error(
            paymentData?.message ||
              "Unable to initialize payment."
          );
        }

        if (
          paymentData.paymentUrl
        ) {
          window.location.href =
            paymentData.paymentUrl;
        }
      } catch (err) {
        setError(
          err.message ||
            "Checkout failed."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="business-checkout-page">
      <header className="business-checkout-header">
        <button
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <h1>
            Checkout
          </h1>

          <p>
            {checkout.business
              .businessName}
          </p>
        </div>
      </header>

      <main className="business-checkout-content">
        <section className="checkout-card">
          <h2>
            Your order
          </h2>

          {checkout.items.map(
            (item) => (
              <div
                className="checkout-item"
                key={
                  item.productId
                }
              >
                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.quantity} ×{" "}
                    {Number(
                      item.price
                    ).toLocaleString()}{" "}
                    XAF
                  </span>
                </div>

                <strong>
                  {Number(
                    item.price *
                      item.quantity
                  ).toLocaleString()}{" "}
                  XAF
                </strong>
              </div>
            )
          )}

          <div className="checkout-total">
            <span>
              Total
            </span>

            <strong>
              {Number(
                checkout.total
              ).toLocaleString()}{" "}
              XAF
            </strong>
          </div>
        </section>

        <section className="checkout-card">
          <h2>
            Delivery information
          </h2>

          <label>
            Phone
            <input
              value={
                customerPhone
              }
              onChange={(e) =>
                setCustomerPhone(
                  e.target.value
                )
              }
            />
          </label>

          <label>
            Delivery address
            <textarea
              value={
                deliveryAddress
              }
              onChange={(e) =>
                setDeliveryAddress(
                  e.target.value
                )
              }
              placeholder="Where should the business deliver your order?"
            />
          </label>

          <label>
            Note
            <textarea
              value={
                customerNote
              }
              onChange={(e) =>
                setCustomerNote(
                  e.target.value
                )
              }
              placeholder="Optional note"
            />
          </label>
        </section>

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        <button
          className="checkout-pay-button"
          disabled={loading}
          onClick={
            createOrder
          }
        >
          {loading
            ? "Opening secure payment..."
            : "Pay securely with CinetPay"}
        </button>

        <small className="checkout-security-note">
          You will be redirected to
          CinetPay to complete your
          payment securely.
        </small>
      </main>
    </div>
  );
}

export default BusinessCheckout;