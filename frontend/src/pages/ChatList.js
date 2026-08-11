import { useState } from "react";
import "./chatlist.css";

function ChatList({ user, onOpenChat, onNavigate }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [chats] = useState([
    {
      id: 1,
      name: "John",
      message: "Hey, are you coming?",
      time: "10:42",
      unread: 2,
      favorite: true,
      group: false,
      avatar: "J",
    },
    {
      id: 2,
      name: "Mary",
      message: "See you tomorrow.",
      time: "09:15",
      unread: 0,
      favorite: false,
      group: false,
      avatar: "M",
    },
    {
      id: 3,
      name: "Computer Engineering 2026",
      message: "Assignment has been uploaded.",
      time: "Yesterday",
      unread: 5,
      favorite: true,
      group: true,
      avatar: "CE",
    },
    {
      id: 4,
      name: "Chris",
      message: "The meeting starts at 3 PM.",
      time: "Yesterday",
      unread: 0,
      favorite: false,
      group: false,
      avatar: "C",
    },
  ]);

  /* =========================================
     SEARCH + FILTER
  ========================================= */

  const filteredChats = chats.filter((chat) => {
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      chat.name.toLowerCase().includes(query) ||
      chat.message.toLowerCase().includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (activeFilter === "unread") {
      return chat.unread > 0;
    }

    if (activeFilter === "favorites") {
      return chat.favorite;
    }

    if (activeFilter === "groups") {
      return chat.group;
    }

    return true;
  });

  /* =========================================
     USER NAME
  ========================================= */

  const getUserName = () => {
    if (!user) {
      return "User";
    }

    return (
      user.name ||
      user.fullName ||
      user.username ||
      "User"
    );
  };

  /* =========================================
     OPEN CHAT
  ========================================= */

  const handleOpenChat = (chat) => {
    if (onOpenChat) {
      onOpenChat(chat);
    }
  };

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
            <h1>ZenvaZapp</h1>

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
              setShowSearch(!showSearch);

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
            onClick={() => onNavigate?.("profile")}
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
                setSearchQuery(e.target.value)
              }
              autoFocus
            />

            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
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

          <h2>Status</h2>

          <button
            className="view-status-button"
            onClick={() => onNavigate?.("status")}
          >
            View all
          </button>

        </div>

        <div className="status-list">

          <button className="status-item add-status">

            <div className="status-avatar">
              +
            </div>

            <span>
              Your status
            </span>

          </button>

          <button className="status-item">

            <div className="status-avatar status-active">
              J
            </div>

            <span>
              John
            </span>

          </button>

          <button className="status-item">

            <div className="status-avatar status-active">
              M
            </div>

            <span>
              Mary
            </span>

          </button>

          <button className="status-item">

            <div className="status-avatar status-active">
              C
            </div>

            <span>
              Chris
            </span>

          </button>

          <button className="status-item">

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
            activeFilter === "unread"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setActiveFilter("unread")}
        >
          Unread
        </button>

        <button
          className={
            activeFilter === "favorites"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setActiveFilter("favorites")}
        >
          Favorites
        </button>

        <button
          className={
            activeFilter === "groups"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setActiveFilter("groups")}
        >
          Groups
        </button>

        <button
          className={
            activeFilter === "all"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setActiveFilter("all")}
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
            {filteredChats.length} conversations
          </span>

        </div>

        <div className="plus-container">

          <button
            className="plus-button"
            onClick={() =>
              setShowPlusMenu(!showPlusMenu)
            }
            aria-label="New"
          >
            +
          </button>

          {showPlusMenu && (

            <div className="plus-menu">

              <button
                onClick={() => {
                  setShowPlusMenu(false);
                  onNavigate?.("new-chat");
                }}
              >
                <span>💬</span>
                New Chat
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(false);
                  onNavigate?.("new-group");
                }}
              >
                <span>👥</span>
                New Group
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(false);
                  onNavigate?.("new-contact");
                }}
              >
                <span>👤</span>
                New Contact
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(false);
                  onNavigate?.("community");
                }}
              >
                <span>🏘️</span>
                New Community
              </button>

            </div>

          )}

        </div>

      </section>


      {/* =====================================
          CHAT LIST
      ===================================== */}

      <main className="chat-list">

        {filteredChats.length === 0 ? (

          <div className="empty-chats">

            <div className="empty-icon">
              🔎
            </div>

            <h3>
              No results found
            </h3>

            <p>
              Try another search or filter.
            </p>

          </div>

        ) : (

          filteredChats.map((chat) => (

            <button
              className="chat-item"
              key={chat.id}
              onClick={() => handleOpenChat(chat)}
            >

              <div className="chat-avatar">
                {chat.avatar}
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

                  {chat.unread > 0 && (

                    <span className="unread-count">
                      {chat.unread}
                    </span>

                  )}

                </div>

              </div>

            </button>

          ))

        )}

      </main>


      {/* =====================================
          BOTTOM NAVIGATION
      ===================================== */}

      <nav className="bottom-navigation">

        <button
          className="nav-button active"
          onClick={() => onNavigate?.("chats")}
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
          onClick={() => onNavigate?.("calls")}
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
          onClick={() => onNavigate?.("tools")}
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
          onClick={() => onNavigate?.("settings")}
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