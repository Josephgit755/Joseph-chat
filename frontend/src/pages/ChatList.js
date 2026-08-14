import { useEffect, useMemo, useState } from "react";
import "./chatlist.css";

function ChatList({ user, onOpenChat, onNavigate }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  // CURRENT USER NAME
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
  // CREATE CONSISTENT CONVERSATION ID
  // ==========================================

  const createConversationId = (
    participantOne,
    participantTwo
  ) => {
    if (
      !participantOne ||
      !participantTwo
    ) {
      return "";
    }

    return [
      String(participantOne),
      String(participantTwo),
    ]
      .sort()
      .join("_");
  };

  // ==========================================
 
  // ==========================================
  
  // 
// LOAD REGISTERED USERS + REAL MESSAGES
// ==========================================

useEffect(() => {
  let isMounted = true;

  // ========================================
  // FORMAT MESSAGE TIME
  // ========================================

  const formatMessageTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const isToday =
      date.toDateString() ===
      now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const yesterday = new Date(now);

    yesterday.setDate(
      now.getDate() - 1
    );

    if (
      date.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    const difference =
      now.getTime() -
      date.getTime();

    const sevenDays =
      7 * 24 * 60 * 60 * 1000;

    if (
      difference >= 0 &&
      difference < sevenDays
    ) {
      return date.toLocaleDateString([], {
        weekday: "short",
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  // ========================================
  // GET MESSAGE PREVIEW
  // ========================================

  const getMessagePreview = (message) => {
    if (!message) {
      return "Start a conversation";
    }

    if (
      message.deletedForEveryone ||
      message.text ===
        "This message was deleted."
    ) {
      return "This message was deleted.";
    }

    const messageType =
      message.messageType || "text";

    if (messageType === "image") {
      return "📷 Photo";
    }

    if (messageType === "video") {
      return "🎥 Video";
    }

    if (
      messageType === "audio" ||
      messageType === "voice"
    ) {
      return "🎤 Voice message";
    }

    if (
      messageType === "file" ||
      messageType === "document"
    ) {
      return "📎 Document";
    }

    if (messageType === "location") {
      return "📍 Location";
    }

    if (messageType === "contact") {
      return "👤 Contact";
    }

    if (
      message.text &&
      message.text.trim()
    ) {
      return message.text.trim();
    }

    return "Message";
  };

  // ========================================
  // LOAD ONE CONVERSATION
  // ========================================

  const loadConversationData = async (
    conversation
  ) => {
    try {
      if (
        !conversation?.conversationId
      ) {
        return {
          ...conversation,
          message:
            "Start a conversation",
          time: "",
          unread: 0,
        };
      }

      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(
          conversation.conversationId
        )}`
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid message response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Failed to load conversation."
        );
      }

      const messages =
        Array.isArray(data.messages)
          ? data.messages
          : [];

      // ====================================
      // FIND LATEST MESSAGE
      // ====================================

      const latestMessage =
        messages.length > 0
          ? messages[
              messages.length - 1
            ]
          : null;

      // ====================================
      // COUNT UNREAD MESSAGES
      // ====================================

      const unreadCount =
        messages.filter((message) => {
          const receiverId =
            message?.receiverId;

          return (
            receiverId &&
            String(receiverId) ===
              String(currentUserId) &&
            message?.status !== "read" &&
            !message?.deletedForReceiver &&
            !message?.deletedForEveryone
          );
        }).length;

      return {
        ...conversation,

        message:
          getMessagePreview(
            latestMessage
          ),

        time:
          formatMessageTime(
            latestMessage?.createdAt ||
              latestMessage?.updatedAt
          ),

        unread: unreadCount,

        latestMessage,
      };
    } catch (error) {
      console.error(
        `Failed to load conversation ${conversation?.conversationId}:`,
        error
      );

      return {
        ...conversation,

        message:
          "Start a conversation",

        time: "",

        unread: 0,
      };
    }
  };

  // ========================================
  // LOAD REGISTERED USERS
  // ========================================

  const loadUsers = async () => {
    if (!currentUserId) {
      console.log(
        "Cannot load chat users: current user ID missing."
      );

      if (isMounted) {
        setIsLoadingChats(false);
      }

      return;
    }

    try {
      if (isMounted) {
        setIsLoadingChats(true);
        setChatLoadError("");
      }

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

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      console.log(
        "Users API response:",
        data
      );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Failed to load registered users."
        );
      }

      // ====================================
      // CREATE BASE CHAT ITEMS
      // ====================================

      const registeredUsers =
        (data.users || [])
          .filter((account) => {
            const accountId =
              account?._id ||
              account?.id ||
              account?.userId;

            return (
              accountId &&
              String(accountId) !==
                String(currentUserId)
            );
          })
          .map((account) => {
            const accountId =
              account?._id ||
              account?.id ||
              account?.userId;

            const displayName =
              account?.displayName ||
              account?.fullName ||
              account?.username ||
              "User";

            const profilePhoto =
              account?.profilePhoto ||
              account?.avatar ||
              "";

            const conversationId =
              createConversationId(
                currentUserId,
                accountId
              );

            return {
              id: accountId,

              conversationId,

              name: displayName,

              username:
                account?.username || "",

              fullName:
                account?.fullName || "",

              profilePhoto,

              profileCompleted:
                account?.profileCompleted,

              message:
                "Start a conversation",

              time: "",

              unread: 0,

              favorite:
                Boolean(
                  account?.favorite
                ),

              group: false,

              avatar:
                profilePhoto ||
                displayName
                  .charAt(0)
                  .toUpperCase(),
            };
          });

      console.log(
        "Registered users:",
        registeredUsers
      );

      // ====================================
      // LOAD REAL CONVERSATION DATA
      // ====================================

      const enrichedChats =
        await Promise.all(
          registeredUsers.map(
            (chat) =>
              loadConversationData(
                chat
              )
          )
        );

      // ====================================
      // SORT BY MOST RECENT MESSAGE
      // ====================================

      enrichedChats.sort(
        (a, b) => {
          const dateA =
            a?.latestMessage
              ?.createdAt
              ? new Date(
                  a.latestMessage.createdAt
                ).getTime()
              : 0;

          const dateB =
            b?.latestMessage
              ?.createdAt
              ? new Date(
                  b.latestMessage.createdAt
                ).getTime()
              : 0;

          return dateB - dateA;
        }
      );

      console.log(
        "Final ZenvaZapp chats:",
        enrichedChats
      );

      if (isMounted) {
        setChats(enrichedChats);
      }
    } catch (error) {
      console.error(
        "Load registered users error:",
        error
      );

      if (isMounted) {
        setChatLoadError(
          error?.message ||
            "Unable to load registered users."
        );

        setChats([]);
      }
    } finally {
      if (isMounted) {
        setIsLoadingChats(false);
      }
    }
  };

  loadUsers();

  return () => {
    isMounted = false;
  };
}, [
  API_URL,
  currentUserId,
]);

  

   

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredChats = useMemo(() => {
    const query =
      searchQuery
        .toLowerCase()
        .trim();

    return chats.filter((chat) => {
      const name =
        chat?.name
          ?.toLowerCase() || "";

      const username =
        chat?.username
          ?.toLowerCase() || "";

      const message =
        chat?.message
          ?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        username.includes(query) ||
        message.includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (
        activeFilter === "unread"
      ) {
        return (
          Number(
            chat?.unread || 0
          ) > 0
        );
      }

      if (
        activeFilter === "favorites"
      ) {
        return Boolean(
          chat?.favorite
        );
      }

      if (
        activeFilter === "groups"
      ) {
        return Boolean(
          chat?.group
        );
      }

      return true;
    });
  }, [
    chats,
    searchQuery,
    activeFilter,
  ]);

  // ==========================================
  // OPEN CHAT
  // ==========================================

  const handleOpenChat = (
    chat
  ) => {
    console.log(
      "=========================================="
    );

    console.log(
      "Opening ZenvaZapp conversation:"
    );

    console.log(
      "Current user ID:",
      currentUserId
    );

    console.log(
      "Selected user:",
      chat
    );

    console.log(
      "Selected user REAL ID:",
      chat?.id
    );

    console.log(
      "Conversation ID:",
      chat?.conversationId
    );

    console.log(
      "Selected username:",
      chat?.username
    );

    console.log(
      "Latest message:",
      chat?.latestMessage
    );

    console.log(
      "=========================================="
    );

    if (onOpenChat) {
      onOpenChat(chat);
    }
  };

  // ==========================================
  // STATUS NAVIGATION
  // ==========================================

  const handleYourStatus = () => {
    if (onNavigate) {
      onNavigate("status");
    }
  };

  // ==========================================
  // PLUS MENU NAVIGATION
  // ==========================================

  const handlePlusNavigation = (
    destination
  ) => {
    setShowPlusMenu(false);

    if (onNavigate) {
      onNavigate(destination);
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
            type="button"
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
            type="button"
            className="header-icon-button"
            aria-label="Profile"
            onClick={() =>
              onNavigate?.("profile")
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
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              autoFocus
              aria-label="Search chats"
            />

            {searchQuery && (
              <button
                type="button"
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
            type="button"
            className="view-status-button"
            onClick={() =>
              onNavigate?.("status")
            }
          >
            View all
          </button>

        </div>

        <div className="status-list">

          {/* YOUR STATUS */}

          <button
            type="button"
            className="status-item add-status"
            onClick={handleYourStatus}
          >

            <div className="status-avatar">

              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Your profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                user?.displayName
                  ?.charAt(0)
                  ?.toUpperCase() ||
                user?.fullName
                  ?.charAt(0)
                  ?.toUpperCase() ||
                user?.username
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "+"
              )}

            </div>

            <span>
              Your status
            </span>

          </button>

          {/* REGISTERED USERS */}

          {chats
            .slice(0, 8)
            .map((chat) => (
              <button
                type="button"
                className="status-item"
                key={`status-${chat.id}`}
                onClick={() =>
                  handleOpenChat(chat)
                }
              >

                <div className="status-avatar status-active">

                  {chat.profilePhoto ? (
                    <img
                      src={
                        chat.profilePhoto
                      }
                      alt={chat.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    chat.avatar
                  )}

                </div>

                <span>
                  {chat.name}
                </span>

              </button>
            ))}

        </div>

      </section>

      {/* =====================================
          CHAT FILTERS
      ===================================== */}

      <section className="chat-filters">

        <button
          type="button"
          className={
            activeFilter === "unread"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter("unread")
          }
        >
          Unread
        </button>

        <button
          type="button"
          className={
            activeFilter === "favorites"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter("favorites")
          }
        >
          Favorites
        </button>

        <button
          type="button"
          className={
            activeFilter === "groups"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter("groups")
          }
        >
          Groups
        </button>

        <button
          type="button"
          className={
            activeFilter === "all"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setActiveFilter("all")
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
              : `${filteredChats.length} ${
                  filteredChats.length === 1
                    ? "conversation"
                    : "conversations"
                }`}
          </span>

        </div>

        <div className="plus-container">

          <button
            type="button"
            className="plus-button"
            onClick={() =>
              setShowPlusMenu(
                !showPlusMenu
              )
            }
            aria-label="New"
            aria-expanded={
              showPlusMenu
            }
          >
            +
          </button>

          {showPlusMenu && (

            <div className="plus-menu">

              <button
                type="button"
                onClick={() =>
                  handlePlusNavigation(
                    "new-chat"
                  )
                }
              >
                <span>
                  💬
                </span>

                New Chat
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePlusNavigation(
                    "new-group"
                  )
                }
              >
                <span>
                  👥
                </span>

                New Group
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePlusNavigation(
                    "new-contact"
                  )
                }
              >
                <span>
                  👤
                </span>

                New Contact
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePlusNavigation(
                    "community"
                  )
                }
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
        <div
          className="private-chat-error"
          role="alert"
        >
          <span>
            {chatLoadError}
          </span>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Retry
          </button>
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
              Loading conversations...
            </h3>

            <p>
              Getting registered users and messages.
            </p>

          </div>

        ) : filteredChats.length === 0 ? (

          <div className="empty-chats">

            <div className="empty-icon">
              {searchQuery
                ? "🔎"
                : activeFilter !== "all"
                ? "📭"
                : "💬"}
            </div>

            <h3>
              {searchQuery
                ? "No users found"
                : activeFilter ===
                  "unread"
                ? "No unread chats"
                : activeFilter ===
                  "favorites"
                ? "No favorite chats"
                : activeFilter ===
                  "groups"
                ? "No groups yet"
                : "No users found"}
            </h3>

            <p>
              {searchQuery
                ? "Try another search."
                : activeFilter !==
                  "all"
                ? "Try another chat filter."
                : "Registered ZenvaZapp users will appear here."}
            </p>

          </div>

        ) : (

          filteredChats.map(
            (chat) => (

              <button
                type="button"
                className="chat-item"
                key={chat.id}
                onClick={() =>
                  handleOpenChat(chat)
                }
              >

                {/* ==========================
                    AVATAR
                ========================== */}

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
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />

                  ) : (

                    chat.avatar

                  )}

                </div>

                {/* ==========================
                    CHAT CONTENT
                ========================== */}

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

      <nav
        className="bottom-navigation"
        aria-label="Main navigation"
      >

        <button
          type="button"
          className="nav-button active"
          onClick={() =>
            onNavigate?.("chats")
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
          type="button"
          className="nav-button"
          onClick={() =>
            onNavigate?.("calls")
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
          type="button"
          className="nav-button"
          onClick={() =>
            onNavigate?.("tools")
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
          type="button"
          className="nav-button"
          onClick={() =>
            onNavigate?.("settings")
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