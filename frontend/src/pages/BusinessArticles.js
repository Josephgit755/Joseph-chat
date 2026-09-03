import React, {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiSearch,
  FiFileText,
} from "react-icons/fi";

import "./businessSuite.css";

function BusinessArticles({
  onBack,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const [posts, setPosts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const url =
          new URL(
            `${API_URL}/api/business-posts/public`
          );

        if (search.trim()) {
          url.searchParams.set(
            "search",
            search.trim()
          );
        }

        const response =
          await fetch(
            url.toString()
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

    const timer =
      setTimeout(
        load,
        250
      );

    return () =>
      clearTimeout(timer);
  }, [search]);

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
              PUBLIC
            </span>

            <h1>
              Business Articles
            </h1>

            <p>
              Discover business content
            </p>
          </div>
        </div>

        <div className="business-suite-logo">
          Zz
        </div>
      </header>

      <main className="business-suite-content">

        <div className="business-suite-search">
          <FiSearch />

          <input
            type="search"
            placeholder="Search articles..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        {error && (
          <div className="business-suite-alert error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="business-suite-loading">
            Loading articles...
          </div>
        ) : !posts.length ? (
          <div className="business-suite-empty">
            <FiFileText />

            <h3>
              No articles found
            </h3>

            <p>
              Try another search.
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
                    {post.category}
                  </span>

                  <h3>
                    {post.title}
                  </h3>

                  <p>
                    {post.excerpt ||
                      post.content.slice(
                        0,
                        240
                      )}
                  </p>

                  <small>
                    {post.businessId
                      ?.businessName ||
                      "ZenvaZapp Business"}
                  </small>
                </article>
              )
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default BusinessArticles;