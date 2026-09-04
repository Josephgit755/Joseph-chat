import React, {
  useEffect,
  useState,
} from "react";

import "./business-store.css";

function BusinessStore({
  businessId,
  user,
  onBack,
  onCheckout,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [business, setBusiness] =
    useState(null);

  const [products, setProducts] =
    useState([]);

  const [cart, setCart] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadStore =
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              `${API_URL}/api/businesses/public/${businessId}`
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load business."
            );
          }

          setBusiness(
            data.business
          );

          setProducts(
            data.products || []
          );
        } catch (err) {
          setError(
            err.message ||
              "Unable to load store."
          );
        } finally {
          setLoading(false);
        }
      };

    if (businessId) {
      loadStore();
    }
  }, [
    API_URL,
    businessId,
  ]);

  const addToCart = (
    product
  ) => {
    setCart(
      (previous) => {
        const existing =
          previous.find(
            (item) =>
              item.productId ===
              product._id
          );

        if (existing) {
          return previous.map(
            (item) =>
              item.productId ===
              product._id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          );
        }

        return [
          ...previous,
          {
            productId:
              product._id,
            name:
              product.name,
            price:
              product.discountPrice ??
              product.price,
            quantity: 1,
            image:
              product.images?.[0] ||
              "",
          },
        ];
      }
    );
  };

  const updateQuantity = (
    productId,
    quantity
  ) => {
    if (quantity <= 0) {
      setCart(
        (previous) =>
          previous.filter(
            (item) =>
              item.productId !==
              productId
          )
      );

      return;
    }

    setCart(
      (previous) =>
        previous.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  quantity,
                }
              : item
        )
    );
  };

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const handleCheckout =
    () => {
      if (!user) {
        alert(
          "Please log in before placing an order."
        );
        return;
      }

      if (!cart.length) {
        alert(
          "Your cart is empty."
        );
        return;
      }

      onCheckout({
        business,
        items: cart,
        total,
      });
    };

  if (loading) {
    return (
      <div className="business-store-page">
        <div className="business-store-loading">
          Loading business...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-store-page">
        <div className="business-store-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="business-store-page">
      <header className="business-store-header">
        <button
          onClick={onBack}
          className="business-store-back"
        >
          ←
        </button>

        <div>
          <h1>
            {business?.businessName}
          </h1>

          <p>
            {business?.category ||
              "Business"}
          </p>
        </div>

        <div className="business-store-cart">
          🛒{" "}
          {cart.reduce(
            (sum, item) =>
              sum + item.quantity,
            0
          )}
        </div>
      </header>

      <main className="business-store-content">
        <section className="business-store-profile">
          <div className="business-store-logo">
            {business?.logo ? (
              <img
                src={business.logo}
                alt=""
              />
            ) : (
              "🏪"
            )}
          </div>

          <div>
            <h2>
              {business?.businessName}
            </h2>

            <p>
              {business?.description ||
                "Welcome to our ZenvaZapp store."}
            </p>

            {business?.city && (
              <span>
                📍 {business.city}
              </span>
            )}
          </div>
        </section>

        <section>
          <div className="business-store-section-title">
            <h2>Products</h2>
            <span>
              {products.length} products
            </span>
          </div>

          <div className="business-product-grid">
            {products.map(
              (product) => {
                const price =
                  product.discountPrice ??
                  product.price;

                return (
                  <article
                    className="business-product-card"
                    key={product._id}
                  >
                    <div className="business-product-image">
                      {product.images?.[0] ? (
                        <img
                          src={
                            product.images[0]
                          }
                          alt={
                            product.name
                          }
                        />
                      ) : (
                        "📦"
                      )}
                    </div>

                    <div className="business-product-info">
                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.description ||
                          "No description."}
                      </p>

                      <strong>
                        {Number(
                          price
                        ).toLocaleString()}{" "}
                        XAF
                      </strong>

                      <button
                        onClick={() =>
                          addToCart(
                            product
                          )
                        }
                      >
                        Add to cart
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>

        {cart.length > 0 && (
          <section className="business-store-cart-panel">
            <div>
              <h2>
                Your Cart
              </h2>

              {cart.map(
                (item) => (
                  <div
                    className="business-cart-item"
                    key={
                      item.productId
                    }
                  >
                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {Number(
                          item.price
                        ).toLocaleString()}{" "}
                        XAF
                      </span>
                    </div>

                    <div>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity -
                              1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity +
                              1
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              )}

              <div className="business-cart-total">
                <span>
                  Total
                </span>

                <strong>
                  {Number(
                    total
                  ).toLocaleString()}{" "}
                  XAF
                </strong>
              </div>

              <button
                className="business-checkout-button"
                onClick={
                  handleCheckout
                }
              >
                Continue to checkout
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default BusinessStore;