import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./chatlist.css";

// ==========================================
// CREATE CONSISTENT CONVERSATION ID
// ==========================================

const createConversationId = (
  participantOne,
  participantTwo
) => {
  if (!participantOne || !participantTwo) {
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
// FORMAT MESSAGE TIME
// ==========================================

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

// ==========================================
// GET MESSAGE PREVIEW
// ==========================================

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

// ==========================================
// CHECK WHETHER MESSAGE IS UNREAD
// ==========================================

const isMessageUnread = (
  message,
  currentUserId
) => {
  if (!message) {
    return false;
  }

  if (
    message.deletedForReceiver ||
    message.deletedForEveryone
  ) {
    return false;
  }

  const receiverId =
    message.receiverId;

  if (
    !receiverId ||
    !currentUserId
  ) {
    return false;
  }

  if (
    String(receiverId) !==
    String(currentUserId)
  ) {
    return false;
  }

  return message.status !== "read";
};

// ==========================================
// CALCULATE UNREAD COUNT
// ==========================================

const calculateUnreadCount = (
  messages,
  currentUserId
) => {
  if (!Array.isArray(messages)) {
    return 0;
  }

  return messages.filter(
    (message) =>
      isMessageUnread(
        message,
        currentUserId
      )
  ).length;
};

function ChatList({
  user,
  onOpenChat,
  onNavigate,
}) {
  const [activeFilter, setActiveFilter] =
    useState("all");

  const [showPlusMenu, setShowPlusMenu] =
    useState(false);

  const [showSearch, setShowSearch] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  // ==========================================
  // CHAT DATA
  // ==========================================

  const [chats, setChats] = useState([]);

  const [isLoadingChats, setIsLoadingChats] =
    useState(true);

  const [chatLoadError, setChatLoadError] =
    useState("");

  // ==========================================
  // BACKGROUND MESSAGE LOADING
  // ==========================================

  const [
    loadingConversationIds,
    setLoadingConversationIds,
  ] = useState(new Set());

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
  // LOAD ONE CONVERSATION IN BACKGROUND
  // ==========================================

  const loadConversationData =
    useCallback(
      async (conversation) => {
        if (
          !conversation?.conversationId
        ) {
          return;
        }

        const conversationId =
          conversation.conversationId;

        setLoadingConversationIds(
          (previous) => {
            const next = new Set(
              previous
            );

            next.add(
              conversationId
            );

            return next;
          }
        );

        try {
          const response =
            await fetch(
              `${API_URL}/api/messages/${encodeURIComponent(
                conversationId
              )}`
            );

          let data = {};

          try {
            data =
              await response.json();
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
            Array.isArray(
              data.messages
            )
              ? data.messages
              : [];

          // ========================================
          // LATEST MESSAGE
          // ========================================

          const latestMessage =
            messages.length > 0
              ? messages[
                  messages.length - 1
                ]
              : null;

          // ========================================
          // SYNCHRONIZED UNREAD COUNT
          // ========================================

          const unreadCount =
            calculateUnreadCount(
              messages,
              currentUserId
            );

          // ========================================
          // UPDATED CHAT
          // ========================================

          const updatedChat = {
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

            unread:
              unreadCount,

            latestMessage,
          };

          // ========================================
          // UPDATE ONLY THIS CHAT
          // ========================================

          setChats(
            (previousChats) => {
              const updatedChats =
                previousChats.map(
                  (chat) =>
                    chat.conversationId ===
                    conversationId
                      ? updatedChat
                      : chat
                );

              updatedChats.sort(
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

              return updatedChats;
            }
          );
        } catch (error) {
          console.error(
            `Failed to load conversation ${conversationId}:`,
            error
          );

          setChats(
            (previousChats) =>
              previousChats.map(
                (chat) =>
                  chat.conversationId ===
                  conversationId
                    ? {
                        ...chat,
                        message:
                          chat.message ||
                          "Start a conversation",
                        time:
                          chat.time ||
                          "",
                        unread:
                          Number(
                            chat.unread ||
                              0
                          ),
                      }
                    : chat
              )
          );
        } finally {
          setLoadingConversationIds(
            (previous) => {
              const next = new Set(
                previous
              );

              next.delete(
                conversationId
              );

              return next;
            }
          );
        }
      },
      [
        API_URL,
        currentUserId,
      ]
    );

  // ==========================================
  // REFRESH ALL UNREAD COUNTS
  // ==========================================

  const refreshUnreadCounts =
    useCallback(
      async () => {
        if (
          !currentUserId ||
          chats.length === 0
        ) {
          return;
        }

        const conversations =
          [...chats];

        await Promise.all(
          conversations.map(
            (chat) =>
              loadConversationData(
                chat
              )
          )
        );
      },
      [
        currentUserId,
        chats,
        loadConversationData,
      ]
    );

  // ==========================================
  // LOAD REGISTERED USERS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

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
        setIsLoadingChats(true);
        setChatLoadError("");

        const response =
          await fetch(
            `${API_URL}/api/users`
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Failed to load registered users."
          );
        }

        const registeredUsers =
          Array.isArray(
            data.users
          )
            ? data.users
            : [];

        const baseChats =
          registeredUsers
            .filter((account) => {
              const accountId =
                account?._id ||
                account?.id ||
                account?.userId;

              return (
                accountId &&
                String(accountId) !==
                  String(
                    currentUserId
                  )
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
                  account?.username ||
                  "",

                fullName:
                  account?.fullName ||
                  "",

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

        // ======================================
        // DISPLAY USERS IMMEDIATELY
        // ======================================

        if (isMounted) {
          setChats(baseChats);
          setIsLoadingChats(false);
        }

        // ======================================
        // BACKGROUND MESSAGE SYNCHRONIZATION
        // ======================================

        baseChats.forEach(
          (chat) => {
            loadConversationData(
              chat
            );
          }
        );
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
    loadConversationData,
  ]);

  // ==========================================
  // UNREAD SYNCHRONIZATION WHEN APP RETURNS
  // ==========================================

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          refreshUnreadCounts();
        }
      };

    const handleFocus = () => {
      refreshUnreadCounts();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    refreshUnreadCounts,
  ]);

  // ==========================================
  // PERIODIC UNREAD SYNCHRONIZATION
  // ==========================================

  useEffect(() => {
    if (
      !currentUserId ||
      chats.length === 0
    ) {
      return undefined;
    }

    const interval =
      setInterval(() => {
        refreshUnreadCounts();
      }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [
    currentUserId,
    chats.length,
    refreshUnreadCounts,
  ]);

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredChats =
    useMemo(() => {
      const query =
        searchQuery
          .toLowerCase()
          .trim();

      return chats.filter(
        (chat) => {
          const name =
            chat?.name?.toLowerCase() ||
            "";

          const username =
            chat?.username?.toLowerCase() ||
            "";

          const message =
            chat?.message?.toLowerCase() ||
            "";

          const matchesSearch =
            !query ||
            name.includes(query) ||
            username.includes(query) ||
            message.includes(query);

          if (!matchesSearch) {
            return false;
          }

          if (
            activeFilter ===
            "unread"
          ) {
            return (
              Number(
                chat?.unread || 0
              ) > 0
            );
          }

          if (
            activeFilter ===
            "favorites"
          ) {
            return Boolean(
              chat?.favorite
            );
          }

          if (
            activeFilter ===
            "groups"
          ) {
            return Boolean(
              chat?.group
            );
          }

          return true;
        }
      );
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
    if (onOpenChat) {
      onOpenChat(chat);
    }
  };

  // ==========================================
  // STATUS
  // ==========================================

  const handleYourStatus =
    () => {
      if (onNavigate) {
        onNavigate("status");
      }
    };

  // ==========================================
  // PLUS MENU
  // ==========================================

  const handlePlusNavigation =
    (destination) => {
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

      {/* HEADER */}

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
              onNavigate?.(
                "profile"
              )
            }
          >
            👤
          </button>

        </div>

      </header>

      {/* SEARCH */}

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

      {/* STATUS */}

      <section className="status-section">

        <div className="section-heading">

          <h2>
            Status
          </h2>

          <button
            type="button"
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
            type="button"
            className="status-item add-status"
            onClick={
              handleYourStatus
            }
          >

            <div className="status-avatar">

              {user?.profilePhoto ? (
                <img
                  src={
                    user.profilePhoto
                  }
                  alt="Your profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius:
                      "50%",
                    objectFit:
                      "cover",
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

          {chats
            .slice(0, 8)
            .map((chat) => (
              <button
                type="button"
                className="status-item"
                key={`status-${chat.id}`}
                onClick={() =>
                  handleOpenChat(
                    chat
                  )
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

                <span>
                  {chat.name}
                </span>

              </button>
            ))}

        </div>

      </section>

      {/* FILTERS */}

      <section className="chat-filters">

        <button
          type="button"
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
          type="button"
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
          type="button"
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

      {/* CHAT HEADING */}

      <section className="chats-heading">

        <div>

          <h2>
            Chats
          </h2>

          <span>
            {isLoadingChats
              ? "Loading contacts..."
              : `${filteredChats.length} ${
                  filteredChats.length ===
                  1
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

      {/* ERROR */}

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

      {/* CHAT LIST */}

      <main className="chat-list">

        {isLoadingChats ? (
          <div className="empty-chats">

            <div className="empty-icon">
              👥
            </div>

            <h3>
              Loading contacts...
            </h3>

            <p>
              Just a moment while we get your contacts.
            </p>

          </div>
        ) : filteredChats.length ===
          0 ? (
          <div className="empty-chats">

            <div className="empty-icon">
              {searchQuery
                ? "🔎"
                : activeFilter !==
                  "all"
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
            (chat) => {
              const isPreviewLoading =
                loadingConversationIds.has(
                  chat.conversationId
                );

              return (
                <button
                  type="button"
                  className="chat-item"
                  key={chat.id}
                  onClick={() =>
                    handleOpenChat(
                      chat
                    )
                  }
                >

                  {/* AVATAR */}

                  <div className="chat-avatar">

                    {chat.profilePhoto ? (
                      <img
                        src={
                          chat.profilePhoto
                        }
                        alt={chat.name}
                        style={{
                          width: "100%",
                          height: "100%",
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

                  {/* CHAT CONTENT */}

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
                        {isPreviewLoading &&
                        chat.message ===
                          "Start a conversation"
                          ? "Loading messages..."
                          : chat.message}
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
              );
            }
          )
        )}

      </main>

      {/* BOTTOM NAVIGATION */}

      <nav
        className="bottom-navigation"
        aria-label="Main navigation"
      >

        <button
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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