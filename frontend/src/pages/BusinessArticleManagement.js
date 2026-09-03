import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessArticleManagement({
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

  const [posts, setPosts] =
    useState([]);

  const [editing, setEditing] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      title: "",
      content: "",
      excerpt: "",
      coverImage: "",
      category: "General",
      isPublic: true,
      isPublished: true,
    });

  const loadPosts =
    async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/business-posts/mine/${businessId}`,
            {
              headers,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load articles."
          );
        }

        setPosts(
          data.posts || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load articles."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (businessId) {
      loadPosts();
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

  const reset = () => {
    setEditing(null);

    setForm({
      title: "",
      content: "",
      excerpt: "",
      coverImage: "",
      category: "General",
      isPublic: true,
      isPublished: true,
    });
  };

  const save = async (
    event
  ) => {
    event.preventDefault();

    try {
      const url = editing
        ? `${API_URL}/api/business-posts/${editing._id}`
        : `${API_URL}/api/business-posts`;

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
            "Failed to save article."
        );
      }

      reset();

      await loadPosts();
    } catch (err) {
      setError(
        err.message ||
          "Failed to save article."
      );
    }
  };

  const edit = (post) => {
    setEditing(post);

    setForm({
      title:
        post.title || "",
      content:
        post.content || "",
      excerpt:
        post.excerpt || "",
      coverImage:
        post.coverImage || "",
      category:
        post.category ||
        "General",
      isPublic:
        post.isPublic !== false,
      isPublished:
        post.isPublished !== false,
    });
  };

  const remove = async (
    post
  ) => {
    if (
      !window.confirm(
        `Delete "${post.title}"?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/business-posts/${post._id}`,
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
            "Failed to delete article."
        );
      }

      await loadPosts();
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete article."
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
              Business Articles
            </h1>

            <p>
              Publish updates and business content
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
                  ? "EDIT ARTICLE"
                  : "NEW ARTICLE"}
              </span>

              <h2>
                {editing
                  ? "Edit Article"
                  : "Create Article"}
              </h2>
            </div>
          </div>

          <form onSubmit={save}>

            <div className="business-suite-form-grid">

              <Field
                label="Title"
                name="title"
                value={
                  form.title
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
                label="Cover Image URL"
                name="coverImage"
                value={
                  form.coverImage
                }
                onChange={
                  change
                }
              />

              <Field
                label="Excerpt"
                name="excerpt"
                value={
                  form.excerpt
                }
                onChange={
                  change
                }
              />

            </div>

            <label className="business-suite-field full">
              <span>
                Content
              </span>

              <textarea
                name="content"
                value={
                  form.content
                }
                onChange={
                  change
                }
                rows="10"
                required
                placeholder="Write your business article..."
              />
            </label>

            <div className="business-suite-form-grid">

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

              <Toggle
                name="isPublished"
                checked={
                  form.isPublished
                }
                onChange={
                  change
                }
                title="Published"
              />

            </div>

            <div className="business-suite-inline-actions">
              <button
                type="submit"
                className="business-suite-primary-button"
              >
                <FiPlus />

                {editing
                  ? "Save Article"
                  : "Publish Article"}
              </button>

              {editing && (
                <button
                  type="button"
                  className="business-suite-secondary-button"
                  onClick={reset}
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
                CONTENT
              </span>

              <h2>
                Your Articles
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="business-suite-loading">
              Loading articles...
            </div>
          ) : !posts.length ? (
            <div className="business-suite-empty">
              <FiFileText />

              <h3>
                No articles yet
              </h3>

              <p>
                Publish your first business
                article.
              </p>
            </div>
          ) : (
            <div className="business-suite-article-grid">
              {posts.map(
                (post) => (
                  <article
                    key={
                      post._id
                    }
                    className="business-suite-article-card"
                  >
                    {post.coverImage && (
                      <img
                        src={
                          post.coverImage
                        }
                        alt=""
                      />
                    )}

                    <span>
                      {
                        post.category
                      }
                    </span>

                    <h3>
                      {post.title}
                    </h3>

                    <p>
                      {post.excerpt ||
                        post.content.slice(
                          0,
                          180
                        )}
                    </p>

                    <div className="business-suite-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          edit(
                            post
                          )
                        }
                      >
                        <FiEdit3 />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          remove(
                            post
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
  required = false,
}) {
  return (
    <label className="business-suite-field">
      <span>{label}</span>

      <input
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

export default BusinessArticleManagement;