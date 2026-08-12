import { useEffect, useState } from "react";
import "./chatlist.css";

function ChatList({ user, onOpenChat, onNavigate }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const [showPlusMenu, setShowPlusMenu] =
    useState(false);

  const [showSearch, setShowSearch] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  // ==========================================
  // REAL CHAT DATA
  // ==========================================

  const [chats, setChats] = useState([]);

  const [isLoadingChats, setIsLoadingChats] =
    useState(true);

  const [chatLoadError, setChatLoadError] =
    useState("");

  // ==========================================
  // API URL
  // ==========================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // CURRENT USER ID
  // ==========================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.username;

  // ==========================================
  // LOAD REAL REGISTERED USERS
  // ==========================================

  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUserId) {
        console.log(
          "Cannot load chat users: current user ID missing."
        );

        setIsLoadingChats(false);

        return;
      }

      try {
        setIsLoadingChats(true);
        setChatLoadError("");

        console.log(
          "=========================================="
        );

        console.log(
          "Loading registered ZenvaZapp users..."
        );

        console.log(
          "Current user ID:",
          currentUserId
        );

        console.log(
          "Users API:",
          `${API_URL}/api/users`
        );

        const response = await fetch(
          `${API_URL}/api/users`
        );

        console.log(
          "Users API status:",
          response.status
        );

        const data =
          await response.json();

        console.log(
          "Users API response:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load registered users."
          );
        }

        // ======================================
        // CONVERT DATABASE USERS INTO CHAT ITEMS
        // ======================================

        const registeredUsers =
          (data.users || [])
            .filter((account) => {
              // Never show the logged-in user
              // as their own chat.

              return (
                String(account.id) !==
                String(currentUserId)
              );
            })
            .map((account) => {
              const displayName =
                account.displayName ||
                account.fullName ||
                account.username ||
                "User";

              return {
                // IMPORTANT:
                // This is the REAL MongoDB user ID.
                id: account.id,

                name: displayName,

                username:
                  account.username || "",

                message:
                  "Start a conversation",

                time: "",

                unread: 0,

                favorite: false,

                group: false,

                avatar:
                  account.profilePhoto ||
                  displayName
                    .charAt(0)
                    .toUpperCase(),

                profilePhoto:
                  account.profilePhoto || "",

                profileCompleted:
                  account.profileCompleted,

                fullName:
                  account.fullName || "",
              };
            });

        console.log(
          "Registered users for chat list:",
          registeredUsers
        );

        setChats(
          registeredUsers
        );
      } catch (error) {
        console.error(
          "Load registered users error:",
          error
        );

        setChatLoadError(
          error.message ||
            "Unable to load registered users."
        );

        setChats([]);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadUsers();
  }, [
    API_URL,
    currentUserId,
  ]);

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredChats =
    chats.filter((chat) => {
      const query =
        searchQuery
          .toLowerCase()
          .trim();

      const matchesSearch =
        chat.name
          .toLowerCase()
          .includes(query) ||
        chat.message
          .toLowerCase()
          .includes(query) ||
        chat.username
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (
        activeFilter === "unread"
      ) {
        return chat.unread > 0;
      }

      if (
        activeFilter === "favorites"
      ) {
        return chat.favorite;
      }

      if (
        activeFilter === "groups"
      ) {
        return chat.group;
      }

      return true;
    });

  // ==========================================
  // USER NAME
  // ==========================================

  const getUserName = () => {
    if (!user) {
      return "User";
    }

    return (
      user.displayName ||
      user.fullName ||
      user.username ||
      user.name ||
      "User"
    );
  };

  // ==========================================
  // OPEN CHAT
  // ==========================================

  const handleOpenChat = (chat) => {
    console.log(
      "=========================================="
    );

    console.log(
      "Opening real registered user chat:"
    );

    console.log(
      "Current user ID:",
      currentUserId
    );

    console.log(
      "Selected chat:",
      chat
    );

    console.log(
      "Selected user REAL ID:",
      chat.id
    );

    console.log(
      "Selected username:",
      chat.username
    );

    console.log(
      "=========================================="
    );

    if (onOpenChat) {
      onOpenChat(chat);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="chatlist-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="chatlist-header">

        <div className="brand-area">

          <div className="brand-logo">
            Z
          </div>

          <div>
            <h1>
              ZenvaZapp
            </h1>

            <span>
              Welcome, {getUserName()}
            </span>
          </div>

        </div>

        <div className="header-actions">

          <button
            className="header-icon-button"
            aria-label="Search"
            onClick={() => {
              setShowSearch(
                !showSearch
              );

              if (showSearch) {
                setSearchQuery("");
              }
            }}
          >
            🔍
          </button>

          <button
            className="header-icon-button"
            aria-label="Profile"
            onClick={() =>
              onNavigate?.(
                "profile"
              )
            }
          >
            👤
          </button>

        </div>

      </header>

      {/* =====================================
          SEARCH BAR
      ===================================== */}

      {showSearch && (
        <div className="chat-search-container">

          <div className="chat-search">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search chats, contacts and messages..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              autoFocus
            />

            {searchQuery && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearchQuery("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

        </div>
      )}

      {/* =====================================
          STATUS
      ===================================== */}

      <section className="status-section">

        <div className="section-heading">

          <h2>
            Status
          </h2>

          <button
            className="view-status-button"
            onClick={() =>
              onNavigate?.(
                "status"
              )
            }
          >
            View all
          </button>

        </div>

        <div className="status-list">

          <button
            className="status-item add-status"
            type="button"
          >

            <div className="status-avatar">
              +
            </div>

            <span>
              Your status
            </span>

          </button>

          <button
            className="status-item"
            type="button"
          >

            <div className="status-avatar status-active">
              J
            </div>

            <span>
              John
            </span>

          </button>

          <button
            className="status-item"
            type="button"
          >

            <div className="status-avatar status-active">
              M
            </div>

            <span>
              Mary
            </span>

          </button>

          <button
            className="status-item"
            type="button"
          >

            <div className="status-avatar status-active">
              C
            </div>

            <span>
              Chris
            </span>

          </button>

          <button
            className="status-item"
            type="button"
          >

            <div className="status-avatar status-active">
              A
            </div>

            <span>
              Alex
            </span>

          </button>

        </div>

      </section>

      {/* =====================================
          CHAT FILTERS
      ===================================== */}

      <section className="chat-filters">

        <button
          className={
            activeFilter ===
            "unread"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter(
              "unread"
            )
          }
        >
          Unread
        </button>

        <button
          className={
            activeFilter ===
            "favorites"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter(
              "favorites"
            )
          }
        >
          Favorites
        </button>

        <button
          className={
            activeFilter ===
            "groups"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter(
              "groups"
            )
          }
        >
          Groups
        </button>

        <button
          className={
            activeFilter ===
            "all"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter(
              "all"
            )
          }
        >
          All
        </button>

      </section>

      {/* =====================================
          CHAT HEADING
      ===================================== */}

      <section className="chats-heading">

        <div>

          <h2>
            Chats
          </h2>

          <span>
            {isLoadingChats
              ? "Loading..."
              : `${filteredChats.length} conversations`}
          </span>

        </div>

        <div className="plus-container">

          <button
            className="plus-button"
            onClick={() =>
              setShowPlusMenu(
                !showPlusMenu
              )
            }
            aria-label="New"
          >
            +
          </button>

          {showPlusMenu && (

            <div className="plus-menu">

              <button
                onClick={() => {
                  setShowPlusMenu(
                    false
                  );

                  onNavigate?.(
                    "new-chat"
                  );
                }}
              >
                <span>
                  💬
                </span>

                New Chat
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(
                    false
                  );

                  onNavigate?.(
                    "new-group"
                  );
                }}
              >
                <span>
                  👥
                </span>

                New Group
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(
                    false
                  );

                  onNavigate?.(
                    "new-contact"
                  );
                }}
              >
                <span>
                  👤
                </span>

                New Contact
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(
                    false
                  );

                  onNavigate?.(
                    "community"
                  );
                }}
              >
                <span>
                  🏘️
                </span>

                New Community
              </button>

            </div>

          )}

        </div>

      </section>

      {/* =====================================
          ERROR
      ===================================== */}

      {chatLoadError && (
        <div className="private-chat-error">
          {chatLoadError}
        </div>
      )}

      {/* =====================================
          CHAT LIST
      ===================================== */}

      <main className="chat-list">

        {isLoadingChats ? (

          <div className="empty-chats">

            <div className="empty-icon">
              💬
            </div>

            <h3>
              Loading contacts...
            </h3>

            <p>
              Getting registered ZenvaZapp users.
            </p>

          </div>

        ) : filteredChats.length === 0 ? (

          <div className="empty-chats">

            <div className="empty-icon">
              🔎
            </div>

            <h3>
              No users found
            </h3>

            <p>
              Try another search or filter.
            </p>

          </div>

        ) : (

          filteredChats.map(
            (chat) => (

              <button
                className="chat-item"
                key={chat.id}
                onClick={() =>
                  handleOpenChat(
                    chat
                  )
                }
              >

                <div className="chat-avatar">

                  {chat.profilePhoto ? (

                    <img
                      src={
                        chat.profilePhoto
                      }
                      alt={
                        chat.name
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "100%",
                        borderRadius:
                          "50%",
                        objectFit:
                          "cover",
                      }}
                    />

                  ) : (

                    chat.avatar

                  )}

                </div>

                <div className="chat-content">

                  <div className="chat-top">

                    <h3>
                      {chat.name}
                    </h3>

                    <span className="chat-time">
                      {chat.time}
                    </span>

                  </div>

                  <div className="chat-bottom">

                    <p>
                      {chat.message}
                    </p>

                    {chat.unread >
                      0 && (

                      <span className="unread-count">
                        {chat.unread}
                      </span>

                    )}

                  </div>

                </div>

              </button>

            )
          )

        )}

      </main>

      {/* =====================================
          BOTTOM NAVIGATION
      ===================================== */}

      <nav className="bottom-navigation">

        <button
          className="nav-button active"
          onClick={() =>
            onNavigate?.(
              "chats"
            )
          }
        >
          <span className="nav-icon">
            💬
          </span>

          <span>
            Chats
          </span>
        </button>

        <button
          className="nav-button"
          onClick={() =>
            onNavigate?.(
              "calls"
            )
          }
        >
          <span className="nav-icon">
            📞
          </span>

          <span>
            Calls
          </span>
        </button>

        <button
          className="nav-button"
          onClick={() =>
            onNavigate?.(
              "tools"
            )
          }
        >
          <span className="nav-icon">
            🛠
          </span>

          <span>
            Tools
          </span>
        </button>

        <button
          className="nav-button"
          onClick={() =>
            onNavigate?.(
              "settings"
            )
          }
        >
          <span className="nav-icon">
            ⚙️
          </span>

          <span>
            Settings
          </span>
        </button>

      </nav>

    </div>
  );
}

export default ChatList;