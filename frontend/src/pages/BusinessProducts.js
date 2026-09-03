import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiPackage,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessProducts({
  businessId,
  onBack,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const token =
    localStorage.getItem(
      "zenvazapp_token"
    );

  const headers = {
    "Content-Type":
      "application/json",
    Authorization:
      `Bearer ${token}`,
  };

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(null);

  const [form, setForm] =
    useState({
      name: "",
      description: "",
      price: "",
      currency: "XAF",
      image: "",
      category: "General",
      stock: "0",
      type: "product",
      isAvailable: true,
      isPublic: true,
    });

  const [error, setError] =
    useState("");

  const loadProducts =
    async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/business-products/mine/${businessId}`,
            {
              headers,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load products."
          );
        }

        setProducts(
          data.products || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (businessId) {
      loadProducts();
    }
  }, [businessId]);

  const change = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const resetForm = () => {
    setEditing(null);

    setForm({
      name: "",
      description: "",
      price: "",
      currency: "XAF",
      image: "",
      category: "General",
      stock: "0",
      type: "product",
      isAvailable: true,
      isPublic: true,
    });
  };

  const saveProduct =
    async (event) => {
      event.preventDefault();

      try {
        const url = editing
          ? `${API_URL}/api/business-products/${editing._id}`
          : `${API_URL}/api/business-products`;

        const response =
          await fetch(url, {
            method: editing
              ? "PATCH"
              : "POST",

            headers,

            body: JSON.stringify(
              editing
                ? form
                : {
                    ...form,
                    businessId,
                  }
            ),
          });

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to save product."
          );
        }

        resetForm();

        await loadProducts();
      } catch (err) {
        setError(
          err.message ||
            "Failed to save product."
        );
      }
    };

  const editProduct = (
    product
  ) => {
    setEditing(product);

    setForm({
      name:
        product.name || "",
      description:
        product.description || "",
      price:
        product.price || "",
      currency:
        product.currency ||
        "XAF",
      image:
        product.image || "",
      category:
        product.category ||
        "General",
      stock:
        product.stock || 0,
      type:
        product.type ||
        "product",
      isAvailable:
        product.isAvailable !== false,
      isPublic:
        product.isPublic !== false,
    });
  };

  const deleteProduct =
    async (product) => {
      if (
        !window.confirm(
          `Delete "${product.name}"?`
        )
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/business-products/${product._id}`,
            {
              method: "DELETE",
              headers,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to delete product."
          );
        }

        await loadProducts();
      } catch (err) {
        setError(
          err.message ||
            "Failed to delete product."
        );
      }
    };

  return (
    <div className="business-suite-page">
      <header className="business-suite-header">
        <div className="business-suite-header-left">
          <button
            type="button"
            className="business-suite-back"
            onClick={onBack}
          >
            <FiArrowLeft />
          </button>

          <div>
            <span className="business-suite-eyebrow">
              PRIVATE
            </span>

            <h1>
              Products & Services
            </h1>

            <p>
              Manage your business catalog
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">

        {error && (
          <div className="business-suite-alert error">
            {error}
          </div>
        )}

        <section className="business-suite-form-card">

          <div className="business-suite-section-heading">
            <div>
              <span>
                {editing
                  ? "EDIT ITEM"
                  : "NEW ITEM"}
              </span>

              <h2>
                {editing
                  ? "Edit Product"
                  : "Add Product or Service"}
              </h2>
            </div>
          </div>

          <form onSubmit={saveProduct}>
            <div className="business-suite-form-grid">

              <Field
                label="Name"
                name="name"
                value={
                  form.name
                }
                onChange={
                  change
                }
                required
              />

              <Field
                label="Category"
                name="category"
                value={
                  form.category
                }
                onChange={
                  change
                }
              />

              <Field
                label="Price"
                name="price"
                type="number"
                value={
                  form.price
                }
                onChange={
                  change
                }
              />

              <Field
                label="Currency"
                name="currency"
                value={
                  form.currency
                }
                onChange={
                  change
                }
              />

              <Field
                label="Stock"
                name="stock"
                type="number"
                value={
                  form.stock
                }
                onChange={
                  change
                }
              />

              <Field
                label="Image URL"
                name="image"
                value={
                  form.image
                }
                onChange={
                  change
                }
              />

            </div>

            <label className="business-suite-field full">
              <span>
                Description
              </span>

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  change
                }
                rows="4"
              />
            </label>

            <div className="business-suite-form-grid">

              <label className="business-suite-field">
                <span>Type</span>

                <select
                  name="type"
                  value={
                    form.type
                  }
                  onChange={
                    change
                  }
                >
                  <option value="product">
                    Product
                  </option>

                  <option value="service">
                    Service
                  </option>
                </select>
              </label>

              <Toggle
                name="isAvailable"
                checked={
                  form.isAvailable
                }
                onChange={
                  change
                }
                title="Available"
              />

              <Toggle
                name="isPublic"
                checked={
                  form.isPublic
                }
                onChange={
                  change
                }
                title="Public"
              />

            </div>

            <div className="business-suite-inline-actions">
              <button
                type="submit"
                className="business-suite-primary-button"
              >
                <FiPlus />

                {editing
                  ? "Save Changes"
                  : "Add Item"}
              </button>

              {editing && (
                <button
                  type="button"
                  className="business-suite-secondary-button"
                  onClick={
                    resetForm
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="business-suite-section">
          <div className="business-suite-section-heading">
            <div>
              <span>
                CATALOG
              </span>

              <h2>
                Your Products
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="business-suite-loading">
              Loading products...
            </div>
          ) : !products.length ? (
            <div className="business-suite-empty">
              <FiPackage />

              <h3>
                No products yet
              </h3>

              <p>
                Add products or services
                to your public catalog.
              </p>
            </div>
          ) : (
            <div className="business-suite-product-grid">
              {products.map(
                (product) => (
                  <article
                    key={
                      product._id
                    }
                    className="business-suite-product-card"
                  >
                    {product.image && (
                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                      />
                    )}

                    <div>
                      <span>
                        {
                          product.category
                        }
                      </span>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {
                          product.description
                        }
                      </p>

                      <strong>
                        {Number(
                          product.price || 0
                        ).toLocaleString()}{" "}
                        {
                          product.currency
                        }
                      </strong>
                    </div>

                    <div className="business-suite-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          editProduct(
                            product
                          )
                        }
                      >
                        <FiEdit3 />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteProduct(
                            product
                          )
                        }
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="business-suite-field">
      <span>{label}</span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </label>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  title,
}) {
  return (
    <label className="business-suite-toggle compact">
      <strong>{title}</strong>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
    </label>
  );
}

export default BusinessProducts;