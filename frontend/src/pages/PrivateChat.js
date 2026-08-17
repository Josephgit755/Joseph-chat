import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import "./private-chat.css";

function PrivateChat({
  chat,
  user,
  onBack,
  onCall,
  onVideoCall,
  onOpenDisappearingSettings,
}) {
  // ==========================================
  // API
  // ==========================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const SOCKET_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // USER IDS
  // ==========================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.username;

  const otherUserId =
    chat?._id ||
    chat?.id ||
    chat?.userId ||
    chat?.username;

  // ==========================================
  // CONVERSATION ID
  // ==========================================

  const conversationId =
    chat?.conversationId ||
    [currentUserId, otherUserId]
      .filter(Boolean)
      .sort()
      .join("_");

  // ==========================================
  // CHAT INFORMATION
  // ==========================================

  const chatName =
    chat?.name ||
    chat?.fullName ||
    chat?.username ||
    "John Doe";

  const chatAvatar =
    chat?.avatar ||
    chatName.charAt(0).toUpperCase();

  // ==========================================
  // MESSAGE STATE
  // ==========================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [isLoadingMessages, setIsLoadingMessages] =
    useState(true);

  const [hasCachedMessages, setHasCachedMessages] =
    useState(false);

  const [isRefreshingMessages, setIsRefreshingMessages] =
    useState(false);

  const [sendError, setSendError] = useState("");

  // ==========================================
  // MESSAGE MENU
  // ==========================================

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [showMessageMenu, setShowMessageMenu] =
    useState(false);

  const [showChatMenu, setShowChatMenu] =
    useState(false);

  const [showDeleteMenu, setShowDeleteMenu] =
    useState(false);

  // ==========================================
  // EMOJI
  // ==========================================

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  // ==========================================
  // UNDO
  // ==========================================

  const [undoMessageId, setUndoMessageId] =
    useState(null);

  const [undoSeconds, setUndoSeconds] =
    useState(0);

  // ==========================================
  // EDIT
  // ==========================================

  const [editingMessage, setEditingMessage] =
    useState(null);

  const [editText, setEditText] =
    useState("");

  // ==========================================
  // SEARCH
  // ==========================================

  const [showSearch, setShowSearch] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const searchInputRef = useRef(null);

  // ==========================================
  // DISAPPEARING MESSAGES
  // ==========================================

  const [
    disappearingDuration,
    setDisappearingDuration,
  ] = useState("off");

  // ==========================================
  // REFS
  // ==========================================

  const messageEndRef = useRef(null);
  const socketRef = useRef(null);

  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);

  // ==========================================
  // STORAGE KEYS
  // ==========================================

  const disappearingStorageKey =
    conversationId
      ? `zenvazapp-disappearing-${conversationId}`
      : null;

  const messageCacheKey =
    conversationId && currentUserId
      ? `zenvazapp-messages-${currentUserId}-${conversationId}`
      : null;

  // ==========================================
  // DISAPPEARING OPTIONS
  // ==========================================

  const disappearingOptions = [
    {
      value: "off",
      label: "Off",
      description:
        "Messages never disappear.",
    },
    {
      value: "24h",
      label: "24 hours",
      description:
        "New messages disappear 24 hours after they are sent.",
    },
    {
      value: "7d",
      label: "7 days",
      description:
        "New messages disappear 7 days after they are sent.",
    },
    {
      value: "90d",
      label: "90 days",
      description:
        "New messages disappear 90 days after they are sent.",
    },
  ];

  void disappearingOptions;

  // ==========================================
  // GET DISAPPEARING MILLISECONDS
  // ==========================================

  const getDisappearingMilliseconds =
    useCallback((duration) => {
      switch (duration) {
        case "24h":
          return 24 * 60 * 60 * 1000;

        case "7d":
          return 7 * 24 * 60 * 60 * 1000;

        case "90d":
          return 90 * 24 * 60 * 60 * 1000;

        default:
          return null;
      }
    }, []);

  // ==========================================
  // FORMAT MESSAGE
  // ==========================================

  const formatMessage = useCallback(
    (item) => {
      if (!item) {
        return null;
      }

      const id =
        item._id ||
        item.id ||
        item.messageId;

      if (!id) {
        return null;
      }

      const senderId =
        item.senderId ||
        item.sender?._id ||
        item.sender?.id;

      const senderIsCurrentUser =
        String(senderId) ===
        String(currentUserId);

      let displayText =
        item.text ||
        item.message ||
        "";

      const deletedForEveryone =
        Boolean(item.deletedForEveryone);

      const deletedForSender =
        Boolean(item.deletedForSender);

      const deletedForReceiver =
        Boolean(item.deletedForReceiver);

      const deleted =
        Boolean(item.deleted);

      if (
        deletedForEveryone ||
        deleted ||
        (deletedForSender &&
          senderIsCurrentUser) ||
        (deletedForReceiver &&
          !senderIsCurrentUser)
      ) {
        displayText =
          "This message was deleted.";
      }

      const createdAt =
        item.createdAt ||
        item.timestamp ||
        item.sentAt;

      const parsedDate = createdAt
        ? new Date(createdAt)
        : new Date();

      const validDate =
        !Number.isNaN(
          parsedDate.getTime()
        );

      const messageTime = validDate
        ? parsedDate.toLocaleTimeString(
            [],
            {
              hour: "numeric",
              minute: "2-digit",
            }
          )
        : "";

      return {
        ...item,

        id,

        _id: item._id || id,

        senderId,

        receiverId:
          item.receiverId ||
          item.recipientId,

        sender: senderIsCurrentUser
          ? "me"
          : "them",

        text: displayText,

        time: messageTime,

        status:
          item.status ||
          (item.readAt
            ? "read"
            : item.deliveredAt
            ? "delivered"
            : "sent"),

        edited:
          Boolean(item.edited) ||
          Boolean(item.isEdited),

        deletedForEveryone,

        deletedForSender,

        deletedForReceiver,

        deleted,

        disappearingDuration:
          item.disappearingDuration ||
          "off",

        expiresAt:
          item.expiresAt ||
          null,

        createdAt:
          item.createdAt ||
          item.timestamp ||
          item.sentAt ||
          new Date().toISOString(),
      };
    },
    [currentUserId]
  );

  // ==========================================
  // SORT + DEDUPLICATE MESSAGES
  // ==========================================

  const mergeMessages = useCallback(
    (existingMessages, incomingMessages) => {
      const combined = [
        ...existingMessages,
        ...incomingMessages,
      ];

      const unique = new Map();

      combined.forEach((item) => {
        if (!item?.id) {
          return;
        }

        const key = String(item.id);

        if (!unique.has(key)) {
          unique.set(key, item);
          return;
        }

        unique.set(key, {
          ...unique.get(key),
          ...item,
        });
      });

      return Array.from(unique.values()).sort(
        (a, b) => {
          const aTime = new Date(
            a.createdAt ||
              a.timestamp ||
              a.sentAt ||
              0
          ).getTime();

          const bTime = new Date(
            b.createdAt ||
              b.timestamp ||
              b.sentAt ||
              0
          ).getTime();

          return aTime - bTime;
        }
      );
    },
    []
  );

  // ==========================================
  // SAVE MESSAGE CACHE
  // ==========================================

  const saveMessageCache = useCallback(
    (items) => {
      if (!messageCacheKey) {
        return;
      }

      try {
        localStorage.setItem(
          messageCacheKey,
          JSON.stringify(items)
        );
      } catch (error) {
        console.warn(
          "Unable to cache ZenvaZapp messages:",
          error
        );
      }
    },
    [messageCacheKey]
  );

  // ==========================================
  // LOAD MESSAGE CACHE FIRST
  // ==========================================

  useEffect(() => {
    if (!messageCacheKey) {
      setMessages([]);
      setHasCachedMessages(false);
      setIsLoadingMessages(true);
      return;
    }

    try {
      const cached =
        localStorage.getItem(
          messageCacheKey
        );

      if (!cached) {
        setMessages([]);
        setHasCachedMessages(false);
        setIsLoadingMessages(true);
        return;
      }

      const parsed =
        JSON.parse(cached);

      if (
        !Array.isArray(parsed)
      ) {
        setMessages([]);
        setHasCachedMessages(false);
        setIsLoadingMessages(true);
        return;
      }

      const formatted =
        parsed
          .map((item) =>
            formatMessage(item)
          )
          .filter(Boolean);

      setMessages(formatted);

      setHasCachedMessages(
        formatted.length > 0
      );

      /*
       * IMPORTANT:
       * Cached messages are displayed immediately.
       * MongoDB is refreshed in the background.
       */
      setIsLoadingMessages(false);
    } catch (error) {
      console.warn(
        "Unable to load cached ZenvaZapp messages:",
        error
      );

      setMessages([]);
      setHasCachedMessages(false);
      setIsLoadingMessages(true);
    }
  }, [
    messageCacheKey,
    formatMessage,
  ]);

  // ==========================================
  // CACHE CURRENT MESSAGES
  // ==========================================

  useEffect(() => {
    if (!messageCacheKey) {
      return;
    }

    if (!messages.length) {
      return;
    }

    saveMessageCache(messages);
  }, [
    messages,
    messageCacheKey,
    saveMessageCache,
  ]);

  // ==========================================
  // LOAD DISAPPEARING SETTING
  // ==========================================

  useEffect(() => {
    if (!disappearingStorageKey) {
      setDisappearingDuration("off");
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          disappearingStorageKey
        );

      if (
        saved === "off" ||
        saved === "24h" ||
        saved === "7d" ||
        saved === "90d"
      ) {
        setDisappearingDuration(
          saved
        );
      } else {
        setDisappearingDuration(
          "off"
        );
      }
    } catch (error) {
      console.error(
        "Unable to load disappearing message setting:",
        error
      );

      setDisappearingDuration("off");
    }
  }, [
    disappearingStorageKey,
  ]);

  // ==========================================
  // SAVE DISAPPEARING SETTING
  // ==========================================

  const saveDisappearingSetting =
    useCallback(
      (duration) => {
        if (!disappearingStorageKey) {
          return;
        }

        try {
          localStorage.setItem(
            disappearingStorageKey,
            duration
          );
        } catch (error) {
          console.error(
            "Unable to save disappearing message setting:",
            error
          );
        }
      },
      [disappearingStorageKey]
    );

  // ==========================================
  // RESIZE MESSAGE INPUT
  // ==========================================

  const resizeMessageInput =
    useCallback(() => {
      const textarea =
        textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.style.height =
        "auto";

      const minimumHeight = 24;
      const maximumHeight = 140;

      const nextHeight = Math.min(
        Math.max(
          textarea.scrollHeight,
          minimumHeight
        ),
        maximumHeight
      );

      textarea.style.height =
        `${nextHeight}px`;
    }, []);

  // ==========================================
  // RESIZE EDIT INPUT
  // ==========================================

  const resizeEditInput =
    useCallback(() => {
      const textarea =
        editTextareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.style.height =
        "auto";

      const minimumHeight = 24;
      const maximumHeight = 120;

      const nextHeight = Math.min(
        Math.max(
          textarea.scrollHeight,
          minimumHeight
        ),
        maximumHeight
      );

      textarea.style.height =
        `${nextHeight}px`;
    }, []);

  // ==========================================
  // RESET INPUT
  // ==========================================

  const resetMessageInput =
    useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height =
          "24px";
      }
    }, []);

  const resetEditInput =
    useCallback(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.style.height =
          "24px";
      }
    }, []);

  // ==========================================
  // KEYBOARD
  // ==========================================

  const handleMessageKeyDown =
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        event.currentTarget.form?.requestSubmit();
      }
    };

  const handleEditKeyDown =
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        handleSaveEdit();
      }

      if (event.key === "Escape") {
        event.preventDefault();

        handleCancelEdit();
      }
    };

  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {
    if (
      !conversationId ||
      !currentUserId
    ) {
      return undefined;
    }

    const socket = io(
      SOCKET_URL,
      {
        transports: [
          "polling",
          "websocket",
        ],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000,
      }
    );

    socketRef.current = socket;

    // ========================================
    // CONNECT
    // ========================================

    socket.on("connect", () => {
      console.log(
        "ZenvaZapp Socket.IO connected:",
        socket.id
      );

      socket.emit(
        "join-conversation",
        conversationId
      );
    });

    // ========================================
    // RECONNECT
    // ========================================

    socket.on(
      "reconnect",
      () => {
        console.log(
          "ZenvaZapp Socket.IO reconnected."
        );

        socket.emit(
          "join-conversation",
          conversationId
        );
      }
    );

    // ========================================
    // CONNECT ERROR
    // ========================================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "ZenvaZapp Socket.IO error:",
          error
        );
      }
    );

    // ========================================
    // NEW MESSAGE
    // ========================================

    const handleIncomingMessage =
      (incomingMessage) => {
        if (!incomingMessage) {
          return;
        }

        const incomingConversationId =
          incomingMessage.conversationId;

        if (
          incomingConversationId &&
          String(
            incomingConversationId
          ) !==
            String(conversationId)
        ) {
          return;
        }

        const formattedMessage =
          formatMessage(
            incomingMessage
          );

        if (!formattedMessage) {
          return;
        }

        setMessages(
          (previous) =>
            mergeMessages(
              previous,
              [formattedMessage]
            )
        );

        // ====================================
        // DELIVERED + READ
        // ====================================

        if (
          String(
            incomingMessage.senderId
          ) !==
          String(currentUserId)
        ) {
          socket.emit(
            "message-delivered",
            {
              conversationId,
              messageId:
                formattedMessage.id,
            }
          );

          socket.emit(
            "message-read",
            {
              conversationId,
              messageId:
                formattedMessage.id,
            }
          );
        }
      };

    socket.on(
      "new-message",
      handleIncomingMessage
    );

    socket.on(
      "message",
      handleIncomingMessage
    );

    // ========================================
    // MESSAGE EDITED
    // ========================================

    const handleEditedMessage =
      (updatedMessage) => {
        if (!updatedMessage) {
          return;
        }

        if (
          updatedMessage.conversationId &&
          String(
            updatedMessage.conversationId
          ) !==
            String(conversationId)
        ) {
          return;
        }

        const updatedId =
          updatedMessage._id ||
          updatedMessage.id ||
          updatedMessage.messageId;

        if (!updatedId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(updatedId)
                ? {
                    ...item,

                    text:
                      updatedMessage.text ||
                      updatedMessage.message ||
                      "",

                    edited: true,

                    updatedAt:
                      updatedMessage.updatedAt ||
                      new Date().toISOString(),
                  }
                : item
            )
        );
      };

    socket.on(
      "message-edited",
      handleEditedMessage
    );

    // ========================================
    // MESSAGE DELETED FOR EVERYONE
    // ========================================

    const handleDeletedForEveryone =
      (deletedMessage) => {
        if (!deletedMessage) {
          return;
        }

        if (
          deletedMessage.conversationId &&
          String(
            deletedMessage.conversationId
          ) !==
            String(conversationId)
        ) {
          return;
        }

        const deletedId =
          deletedMessage._id ||
          deletedMessage.id ||
          deletedMessage.messageId;

        if (!deletedId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(deletedId)
                ? {
                    ...item,

                    text:
                      "This message was deleted.",

                    deletedForEveryone:
                      true,

                    deleted: true,

                    edited: false,
                  }
                : item
            )
        );
      };

    socket.on(
      "message-deleted-for-everyone",
      handleDeletedForEveryone
    );

    socket.on(
      "message-deleted",
      handleDeletedForEveryone
    );

    // ========================================
    // MESSAGE UNDONE
    // ========================================

    const handleMessageUndone =
      (undoneMessage) => {
        if (!undoneMessage) {
          return;
        }

        if (
          undoneMessage.conversationId &&
          String(
            undoneMessage.conversationId
          ) !==
            String(conversationId)
        ) {
          return;
        }

        const undoneId =
          undoneMessage._id ||
          undoneMessage.id ||
          undoneMessage.messageId;

        if (!undoneId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.filter(
              (item) =>
                String(item.id) !==
                String(undoneId)
            )
        );
      };

    socket.on(
      "message-undone",
      handleMessageUndone
    );

    // ========================================
    // MESSAGE DELETED FOR ME
    // ========================================

    socket.on(
      "message-deleted-for-me",
      ({ messageId }) => {
        if (!messageId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.filter(
              (item) =>
                String(item.id) !==
                String(messageId)
            )
        );
      }
    );

    // ========================================
    // CONVERSATION DELETED
    // ========================================

    socket.on(
      "conversation-deleted",
      (data) => {
        if (!data) {
          return;
        }

        if (
          data.conversationId &&
          String(
            data.conversationId
          ) !==
            String(conversationId)
        ) {
          return;
        }

        setMessages([]);

        if (messageCacheKey) {
          try {
            localStorage.removeItem(
              messageCacheKey
            );
          } catch (error) {
            console.warn(
              "Unable to clear message cache:",
              error
            );
          }
        }

        setHasCachedMessages(false);

        setUndoMessageId(null);
        setUndoSeconds(0);
      }
    );

    // ========================================
    // DISAPPEARING SETTING
    // ========================================

    socket.on(
      "disappearing-setting-changed",
      (data) => {
        if (!data) {
          return;
        }

        const {
          conversationId:
            incomingConversationId,
          duration,
        } = data;

        if (
          String(
            incomingConversationId
          ) !==
          String(conversationId)
        ) {
          return;
        }

        if (
          ![
            "off",
            "24h",
            "7d",
            "90d",
          ].includes(duration)
        ) {
          return;
        }

        setDisappearingDuration(
          duration
        );

        saveDisappearingSetting(
          duration
        );
      }
    );

    // ========================================
    // DELIVERED
    // ========================================

    socket.on(
      "message-delivered",
      ({ messageId }) => {
        if (!messageId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(messageId)
                ? {
                    ...item,

                    status:
                      item.status ===
                      "read"
                        ? "read"
                        : "delivered",

                    deliveredAt:
                      item.deliveredAt ||
                      new Date().toISOString(),
                  }
                : item
            )
        );
      }
    );

    // ========================================
    // READ
    // ========================================

    socket.on(
      "message-read",
      ({ messageId }) => {
        if (!messageId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(messageId)
                ? {
                    ...item,

                    status: "read",

                    readAt:
                      item.readAt ||
                      new Date().toISOString(),
                  }
                : item
            )
        );
      }
    );

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      socket.emit(
        "leave-conversation",
        conversationId
      );

      socket.off("connect");
      socket.off("reconnect");
      socket.off("connect_error");

      socket.off(
        "new-message",
        handleIncomingMessage
      );

      socket.off(
        "message",
        handleIncomingMessage
      );

      socket.off(
        "message-edited",
        handleEditedMessage
      );

      socket.off(
        "message-deleted-for-everyone",
        handleDeletedForEveryone
      );

      socket.off(
        "message-deleted",
        handleDeletedForEveryone
      );

      socket.off(
        "message-undone",
        handleMessageUndone
      );

      socket.off(
        "message-deleted-for-me"
      );

      socket.off(
        "conversation-deleted"
      );

      socket.off(
        "disappearing-setting-changed"
      );

      socket.off(
        "message-delivered"
      );

      socket.off(
        "message-read"
      );

      socket.disconnect();

      if (
        socketRef.current === socket
      ) {
        socketRef.current = null;
      }
    };
  }, [
    SOCKET_URL,
    conversationId,
    currentUserId,
    formatMessage,
    mergeMessages,
    saveDisappearingSetting,
    messageCacheKey,
  ]);

  // ==========================================
  // LOAD MESSAGES FROM MONGODB
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadMessages =
      async () => {
        if (
          !conversationId ||
          !currentUserId
        ) {
          setIsLoadingMessages(false);
          return;
        }

        try {
          /*
           * If cache already exists, don't replace
           * the chat with a loading screen.
           */
          if (hasCachedMessages) {
            setIsRefreshingMessages(true);
          } else {
            setIsLoadingMessages(true);
          }

          setSendError("");

          const response =
            await fetch(
              `${API_URL}/api/messages/${encodeURIComponent(
                conversationId
              )}`
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load messages."
            );
          }

          if (cancelled) {
            return;
          }

          const formattedMessages =
            Array.isArray(
              data.messages
            )
              ? data.messages
                  .map((item) =>
                    formatMessage(item)
                  )
                  .filter(Boolean)
              : [];

          /*
           * Server becomes the source of truth after
           * background refresh.
           */
          setMessages(
            formattedMessages
          );

          setHasCachedMessages(
            formattedMessages.length > 0
          );

          // ==================================
          // SAVE FRESH SERVER CACHE
          // ==================================

          saveMessageCache(
            formattedMessages
          );

          // ==================================
          // MARK INCOMING DELIVERED
          // ==================================

          const incomingMessages =
            formattedMessages.filter(
              (item) =>
                item.sender === "them"
            );

          for (
            const item of incomingMessages
          ) {
            try {
              const responseDelivered =
                await fetch(
                  `${API_URL}/api/messages/${item.id}/delivered`,
                  {
                    method: "PATCH",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({
                      userId:
                        currentUserId,
                    }),
                  }
                );

              if (
                responseDelivered.ok
              ) {
                socketRef.current?.emit(
                  "message-delivered",
                  {
                    conversationId,
                    messageId:
                      item.id,
                  }
                );
              }
            } catch (error) {
              console.error(
                "Delivered update error:",
                error
              );
            }
          }

          // ==================================
          // MARK INCOMING READ
          // ==================================

          for (
            const item of incomingMessages
          ) {
            try {
              const responseRead =
                await fetch(
                  `${API_URL}/api/messages/${item.id}/read`,
                  {
                    method: "PATCH",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({
                      userId:
                        currentUserId,
                    }),
                  }
                );

              if (
                responseRead.ok
              ) {
                socketRef.current?.emit(
                  "message-read",
                  {
                    conversationId,
                    messageId:
                      item.id,
                  }
                );
              }
            } catch (error) {
              console.error(
                "Read update error:",
                error
              );
            }
          }

          /*
           * Only mark incoming messages as read.
           * Outgoing messages keep their real status.
           */
          if (!cancelled) {
            setMessages(
              (previous) =>
                previous.map(
                  (item) =>
                    item.sender ===
                    "them"
                      ? {
                          ...item,
                          status:
                            "read",
                          readAt:
                            item.readAt ||
                            new Date().toISOString(),
                        }
                      : item
                )
            );
          }
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Load messages error:",
            error
          );

          /*
           * Do not destroy cached messages if
           * the backend is temporarily unavailable.
           */
          if (!hasCachedMessages) {
            setSendError(
              `Unable to load messages. ${
                error.message || ""
              }`
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingMessages(false);
            setIsRefreshingMessages(false);
          }
        }
      };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [
    API_URL,
    conversationId,
    currentUserId,
    formatMessage,
    hasCachedMessages,
    saveMessageCache,
  ]);

  // ==========================================
  // REMOVE EXPIRED MESSAGES
  // ==========================================

  useEffect(() => {
    if (!messages.length) {
      return undefined;
    }

    const removeExpiredMessages =
      () => {
        const now = Date.now();

        setMessages(
          (previous) =>
            previous.filter(
              (item) => {
                if (!item.expiresAt) {
                  return true;
                }

                const expiration =
                  new Date(
                    item.expiresAt
                  ).getTime();

                if (
                  Number.isNaN(
                    expiration
                  )
                ) {
                  return true;
                }

                return (
                  expiration > now
                );
              }
            )
        );
      };

    removeExpiredMessages();

    const timer =
      setInterval(
        removeExpiredMessages,
        1000
      );

    return () =>
      clearInterval(timer);
  }, [messages.length]);

  // ==========================================
  // INPUT RESIZE
  // ==========================================

  useEffect(() => {
    resizeMessageInput();
  }, [
    message,
    resizeMessageInput,
  ]);

  // ==========================================
  // EDIT INPUT FOCUS
  // ==========================================

  useEffect(() => {
    if (!editingMessage) {
      return undefined;
    }

    const timer = setTimeout(() => {
      resizeEditInput();

      editTextareaRef.current?.focus();

      if (editTextareaRef.current) {
        const length =
          editTextareaRef.current
            .value.length;

        editTextareaRef.current.setSelectionRange(
          length,
          length
        );
      }
    }, 0);

    return () =>
      clearTimeout(timer);
  }, [
    editingMessage,
    resizeEditInput,
  ]);

  // ==========================================
  // SEARCH FOCUS
  // ==========================================

  useEffect(() => {
    if (!showSearch) {
      return undefined;
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () =>
      clearTimeout(timer);
  }, [showSearch]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    if (
      !searchQuery.trim()
    ) {
      messageEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        }
      );
    }
  }, [
    messages,
    searchQuery,
  ]);

  // ==========================================
  // UNDO TIMER
  // ==========================================

  useEffect(() => {
    if (!undoMessageId) {
      return undefined;
    }

    if (undoSeconds <= 0) {
      setUndoMessageId(null);
      setUndoSeconds(0);

      return undefined;
    }

    const timer =
      setTimeout(() => {
        setUndoSeconds(
          (previous) =>
            previous - 1
        );
      }, 1000);

    return () =>
      clearTimeout(timer);
  }, [
    undoMessageId,
    undoSeconds,
  ]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================

// ==========================================
// SEND MESSAGE
// ==========================================

const handleSendMessage = async (event) => {
  event.preventDefault();

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return;
  }

  if (!currentUserId) {
    setSendError(
      "Your account information is missing."
    );
    return;
  }

  if (!otherUserId) {
    setSendError(
      "The selected contact could not be identified."
    );
    return;
  }

  if (!conversationId) {
    setSendError(
      "Conversation could not be identified."
    );
    return;
  }

  setSendError("");

  // ========================================
  // CONVERT UI DURATION TO BACKEND VALUE
  // ========================================
  //
  // UI:
  // "off"
  // "24h"
  // "7d"
  // "90d"
  //
  // Backend:
  // 0
  // 86400000
  // 604800000
  // 7776000000
  // ========================================

  const expirationMilliseconds =
    getDisappearingMilliseconds(
      disappearingDuration
    );

  const safeDuration =
    expirationMilliseconds || 0;

  const expiresAt =
    safeDuration > 0
      ? new Date(
          Date.now() + safeDuration
        ).toISOString()
      : null;

  // ========================================
  // BUILD MESSAGE PAYLOAD
  // ========================================

  const messageToSend = {
    conversationId,
    senderId: currentUserId,
    receiverId: otherUserId,
    text: trimmedMessage,
    messageType: "text",

    // IMPORTANT:
    // Backend expects milliseconds,
    // NOT "off", "24h", "7d", or "90d".
    disappearingDuration:
      safeDuration,
  };

  try {
    console.log(
      "=========================================="
    );

    console.log(
      "ZenvaZapp sending message..."
    );

    console.log(
      "Conversation ID:",
      conversationId
    );

    console.log(
      "Sender ID:",
      currentUserId
    );

    console.log(
      "Receiver ID:",
      otherUserId
    );

    console.log(
      "Message:",
      trimmedMessage
    );

    console.log(
      "Disappearing duration:",
      safeDuration
    );

    console.log(
      "=========================================="
    );

    const response = await fetch(
      `${API_URL}/api/messages`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          messageToSend
        ),
      }
    );

    // ======================================
    // READ SERVER RESPONSE SAFELY
    // ======================================

    let data = {};

    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    console.log(
      "Send message API status:",
      response.status
    );

    console.log(
      "Send message API response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          "Failed to send message."
      );
    }

    if (!data.message) {
      throw new Error(
        "The server did not return the saved message."
      );
    }

    // ======================================
    // USE SERVER-SAVED MESSAGE
    // ======================================

    const savedMessage = {
      ...data.message,

      conversationId:
        data.message.conversationId ||
        conversationId,

      senderId:
        data.message.senderId ||
        currentUserId,

      receiverId:
        data.message.receiverId ||
        otherUserId,

      disappearingDuration:
        data.message
          .disappearingDuration ??
        safeDuration,

      expiresAt:
        data.message.expiresAt ||
        expiresAt,
    };

    const formattedMessage =
      formatMessage(savedMessage);

    if (!formattedMessage) {
      throw new Error(
        "Unable to format the saved message."
      );
    }

    // ======================================
    // ADD MESSAGE LOCALLY
    // ======================================

    setMessages((previous) => {
      const exists = previous.some(
        (item) =>
          String(item.id) ===
          String(formattedMessage.id)
      );

      if (exists) {
        return previous;
      }

      return [
        ...previous,
        formattedMessage,
      ];
    });

    // ======================================
    // SOCKET BROADCAST
    // ======================================

    if (
      socketRef.current?.connected
    ) {
      socketRef.current.emit(
        "send-message",
        savedMessage
      );
    }

    // ======================================
    // CLEAR INPUT
    // ======================================

    setMessage("");

    resetMessageInput();

    // ======================================
    // UNDO WINDOW
    // ======================================

    setUndoMessageId(
      formattedMessage.id
    );

    setUndoSeconds(5);

    console.log(
      "ZenvaZapp message sent successfully."
    );
  } catch (error) {
    console.error(
      "=========================================="
    );

    console.error(
      "ZenvaZapp Send Message Error:",
      error
    );

    console.error(
      "=========================================="
    );

    setSendError(
      `Unable to send message. ${
        error.message || ""
      }`
    );
  }
};
  // ==========================================
  // SELECT MESSAGE
  // ==========================================

  const handleMessageSelect =
    (item) => {
      setSelectedMessage(item);

      setShowMessageMenu(true);

      setShowChatMenu(false);
      setShowDeleteMenu(false);
      setShowEmojiPicker(false);
    };

  // ==========================================
  // CLOSE MESSAGE MENU
  // ==========================================

  const closeMessageMenu =
    () => {
      setSelectedMessage(null);
      setShowMessageMenu(false);
    };

  // ==========================================
  // START EDIT
  // ==========================================

  const handleStartEdit =
    () => {
      if (!selectedMessage) {
        return;
      }

      if (
        selectedMessage.sender !==
        "me"
      ) {
        return;
      }

      if (
        selectedMessage.deletedForEveryone ||
        selectedMessage.deleted
      ) {
        return;
      }

      const originalText =
        selectedMessage.text || "";

      setEditingMessage({
        ...selectedMessage,
        originalText,
      });

      setEditText(
        originalText
      );

      closeMessageMenu();

      setShowEmojiPicker(false);
      setSendError("");
    };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit =
    () => {
      setEditingMessage(null);
      setEditText("");
      resetEditInput();
    };

  // ==========================================
  // SAVE EDIT
  // ==========================================

  const handleSaveEdit =
    async () => {
      if (!editingMessage) {
        return;
      }

      const trimmedText =
        editText.trim();

      if (!trimmedText) {
        setSendError(
          "Edited message cannot be empty."
        );

        return;
      }

      if (!currentUserId) {
        setSendError(
          "Your account information is missing."
        );

        return;
      }

      try {
        setSendError("");

        const response =
          await fetch(
            `${API_URL}/api/messages/${editingMessage.id}/edit`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  currentUserId,

                text: trimmedText,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to edit message."
          );
        }

        const updatedMessage = {
          ...(data.message || {}),

          _id:
            data.message?._id ||
            editingMessage.id,

          id:
            data.message?._id ||
            editingMessage.id,

          conversationId,

          senderId:
            currentUserId,

          receiverId:
            otherUserId,

          text: trimmedText,

          edited: true,

          updatedAt:
            data.message?.updatedAt ||
            new Date().toISOString(),
        };

        // ====================================
        // UPDATE LOCAL
        // ====================================

        setMessages(
          (previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(
                editingMessage.id
              )
                ? {
                    ...item,

                    text:
                      trimmedText,

                    edited: true,

                    updatedAt:
                      updatedMessage.updatedAt,
                  }
                : item
            )
        );

        // ====================================
        // BROADCAST
        // ====================================

        if (
          socketRef.current?.connected
        ) {
          socketRef.current.emit(
            "message-edited",
            updatedMessage
          );
        }

        handleCancelEdit();
      } catch (error) {
        console.error(
          "Edit message error:",
          error
        );

        setSendError(
          `Unable to edit message. ${
            error.message || ""
          }`
        );
      }
    };

  // ==========================================
  // COPY
  // ==========================================

  const handleCopyMessage =
    async () => {
      if (!selectedMessage) {
        return;
      }

      const textToCopy =
        selectedMessage.text || "";

      if (!textToCopy) {
        return;
      }

      try {
        if (
          navigator.clipboard &&
          navigator.clipboard.writeText
        ) {
          await navigator.clipboard.writeText(
            textToCopy
          );
        } else {
          const temporaryTextarea =
            document.createElement(
              "textarea"
            );

          temporaryTextarea.value =
            textToCopy;

          temporaryTextarea.style.position =
            "fixed";

          temporaryTextarea.style.opacity =
            "0";

          document.body.appendChild(
            temporaryTextarea
          );

          temporaryTextarea.focus();
          temporaryTextarea.select();

          document.execCommand(
            "copy"
          );

          document.body.removeChild(
            temporaryTextarea
          );
        }

        closeMessageMenu();
      } catch (error) {
        console.error(
          "Copy message error:",
          error
        );

        setSendError(
          "Unable to copy the message."
        );
      }
    };

  // ==========================================
  // UNDO MESSAGE
  // ==========================================

  const handleUndoMessage =
    async () => {
      if (!undoMessageId) {
        return;
      }

      const messageId =
        undoMessageId;

      try {
        setSendError("");

        const response =
          await fetch(
            `${API_URL}/api/messages/${messageId}/delete-for-everyone`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  currentUserId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to undo message."
          );
        }

        // ====================================
        // REMOVE LOCALLY
        // ====================================

        setMessages(
          (previous) =>
            previous.filter(
              (item) =>
                String(item.id) !==
                String(messageId)
            )
        );

        setUndoMessageId(null);
        setUndoSeconds(0);

        // ====================================
        // BROADCAST
        // ====================================

        if (
          socketRef.current?.connected
        ) {
          socketRef.current.emit(
            "message-undone",
            {
              ...(data.message || {}),

              _id:
                data.message?._id ||
                messageId,

              id:
                data.message?._id ||
                messageId,

              conversationId,
            }
          );
        }
      } catch (error) {
        console.error(
          "Undo message error:",
          error
        );

        setSendError(
          `Unable to undo message. ${
            error.message || ""
          }`
        );
      }
    };

  // ==========================================
  // DELETE FOR ME
  // ==========================================

  const handleDeleteForMe =
    async () => {
      if (!selectedMessage) {
        return;
      }

      const messageId =
        selectedMessage.id;

      try {
        setSendError("");

        const response =
          await fetch(
            `${API_URL}/api/messages/${messageId}/delete-for-me`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  currentUserId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete message."
          );
        }

        setMessages(
          (previous) =>
            previous.filter(
              (item) =>
                String(item.id) !==
                String(messageId)
            )
        );

        closeMessageMenu();

        if (
          socketRef.current?.connected
        ) {
          socketRef.current.emit(
            "message-deleted-for-me",
            {
              messageId,

              conversationId,

              userId:
                currentUserId,
            }
          );
        }
      } catch (error) {
        console.error(
          "Delete for me error:",
          error
        );

        setSendError(
          `Unable to delete message. ${
            error.message || ""
          }`
        );
      }
    };

  // ==========================================
  // DELETE FOR EVERYONE
  // ==========================================

  const handleDeleteForEveryone =
    async () => {
      if (!selectedMessage) {
        return;
      }

      if (
        selectedMessage.sender !==
        "me"
      ) {
        return;
      }

      const messageId =
        selectedMessage.id;

      try {
        setSendError("");

        const response =
          await fetch(
            `${API_URL}/api/messages/${messageId}/delete-for-everyone`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  currentUserId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete message."
          );
        }

        const deletedMessage = {
          ...(data.message || {}),

          _id:
            data.message?._id ||
            messageId,

          id:
            data.message?._id ||
            messageId,

          conversationId,

          text:
            "This message was deleted.",

          deletedForEveryone:
            true,

          deleted: true,
        };

        setMessages(
          (previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(messageId)
                ? {
                    ...item,

                    text:
                      "This message was deleted.",

                    deletedForEveryone:
                      true,

                    deleted: true,

                    edited: false,
                  }
                : item
            )
        );

        if (
          socketRef.current?.connected
        ) {
          socketRef.current.emit(
            "message-deleted-for-everyone",
            deletedMessage
          );
        }

        if (
          String(
            undoMessageId
          ) ===
          String(messageId)
        ) {
          setUndoMessageId(null);
          setUndoSeconds(0);
        }

        closeMessageMenu();
      } catch (error) {
        console.error(
          "Delete for everyone error:",
          error
        );

        setSendError(
          `Unable to delete message for everyone. ${
            error.message || ""
          }`
        );
      }
    };

  // ==========================================
  // DELETE ENTIRE CONVERSATION
  // ==========================================

  const handleDeleteChat =
    () => {
      setShowChatMenu(false);
      setShowDeleteMenu(true);
    };

  // ==========================================
  // CONFIRM DELETE CONVERSATION
  // ==========================================

  const handleConfirmDeleteConversation =
    async () => {
      if (!conversationId) {
        setSendError(
          "Conversation could not be identified."
        );

        return;
      }

      if (!currentUserId) {
        setSendError(
          "Your account information is missing."
        );

        return;
      }

      try {
        setSendError("");

        const response =
          await fetch(
            `${API_URL}/api/messages/conversation/${encodeURIComponent(
              conversationId
            )}/delete`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  currentUserId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete conversation."
          );
        }

        // ====================================
        // CLEAR LOCAL MESSAGES
        // ====================================

        setMessages([]);

        setHasCachedMessages(false);

        if (messageCacheKey) {
          try {
            localStorage.removeItem(
              messageCacheKey
            );
          } catch (storageError) {
            console.warn(
              "Unable to clear message cache:",
              storageError
            );
          }
        }

        // ====================================
        // CLEAR UI
        // ====================================

        setSelectedMessage(null);
        setShowMessageMenu(false);
        setShowDeleteMenu(false);
        setShowChatMenu(false);
        setShowEmojiPicker(false);

        // ====================================
        // CLEAR SEARCH
        // ====================================

        setSearchQuery("");
        setShowSearch(false);

        // ====================================
        // CLEAR UNDO
        // ====================================

        setUndoMessageId(null);
        setUndoSeconds(0);

        // ====================================
        // CLEAR EDIT
        // ====================================

        setEditingMessage(null);
        setEditText("");

        // ====================================
        // CLEAR COMPOSER
        // ====================================

        setMessage("");

        resetMessageInput();
        resetEditInput();

        // ====================================
        // CLEAR DISAPPEARING STORAGE
        // ====================================

        if (
          disappearingStorageKey
        ) {
          try {
            localStorage.removeItem(
              disappearingStorageKey
            );
          } catch (storageError) {
            console.warn(
              "Unable to clear disappearing-message setting:",
              storageError
            );
          }
        }

        setDisappearingDuration(
          "off"
        );

        // ====================================
        // BROADCAST DELETE
        // ====================================

        if (
          socketRef.current?.connected
        ) {
          socketRef.current.emit(
            "conversation-deleted",
            {
              conversationId,

              userId:
                currentUserId,
            }
          );

          socketRef.current.emit(
            "leave-conversation",
            conversationId
          );
        }

        // ====================================
        // RETURN TO CHAT LIST
        // ====================================

        if (
          typeof onBack ===
          "function"
        ) {
          onBack();
        }
      } catch (error) {
        console.error(
          "Delete conversation error:",
          error
        );

        setSendError(
          `Unable to delete conversation. ${
            error.message || ""
          }`
        );
      }
    };

  // ==========================================
  // ATTACHMENT
  // ==========================================

  const handleAttachment =
    () => {
      alert(
        "Attachments will be connected to Smart Files."
      );
    };

  // ==========================================
  // CAMERA
  // ==========================================

  const handleCamera =
    () => {
      alert(
        "Camera will be connected to the ZenvaZapp media system."
      );
    };

  // ==========================================
  // EMOJI
  // ==========================================

  const handleEmoji = () => {
    setShowEmojiPicker(
      (previous) =>
        !previous
    );
  };

  const addEmoji = (emoji) => {
    setMessage(
      (previous) =>
        `${previous}${emoji}`
    );

    setShowEmojiPicker(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // ==========================================
  // VOICE
  // ==========================================

  const handleVoice =
    () => {
      alert(
        "Voice recording will be connected to ZenvaZapp voice messaging."
      );
    };

  // ==========================================
  // CHAT MENU
  // ==========================================

  const handleChatMenuToggle =
    () => {
      setShowChatMenu(
        (previous) =>
          !previous
      );

      setShowDeleteMenu(false);
      setShowMessageMenu(false);
      setShowEmojiPicker(false);
    };

  // ==========================================
  // OPEN SEARCH
  // ==========================================

  const handleOpenSearch =
    () => {
      setShowChatMenu(false);
      setShowSearch(true);
      setSearchQuery("");
    };

  // ==========================================
  // CLOSE SEARCH
  // ==========================================

  const handleCloseSearch =
    () => {
      setShowSearch(false);
      setSearchQuery("");
    };

  // ==========================================
  // OPEN DISAPPEARING SETTINGS
  // ==========================================

  const handleOpenDisappearingSettings =
    () => {
      setShowChatMenu(false);

      if (
        typeof onOpenDisappearingSettings ===
        "function"
      ) {
        onOpenDisappearingSettings(
          chat,
          {
            conversationId,

            currentDuration:
              disappearingDuration,
          }
        );

        return;
      }

      alert(
        "The ZenvaZapp disappearing-message settings page will be connected next."
      );
    };

  // ==========================================
  // PAGE CLICK
  // ==========================================

  const handlePageClick =
    () => {
      if (showMessageMenu) {
        closeMessageMenu();
      }

      if (showChatMenu) {
        setShowChatMenu(false);
      }

      if (showDeleteMenu) {
        setShowDeleteMenu(false);
      }

      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const visibleMessages =
    searchQuery.trim()
      ? messages.filter(
          (item) =>
            String(
              item.text || ""
            )
              .toLowerCase()
              .includes(
                searchQuery
                  .toLowerCase()
                  .trim()
              )
        )
      : messages;

  // ==========================================
  // RENDER
  // ==========================================
    // ==========================================
  // DIRECT CALL ACTIONS
  // ==========================================

  const handleStartCall = useCallback(
    (type) => {
      if (!chat) {
        return;
      }

      if (type === "video") {
        console.log(
          "ZenvaZapp video call requested:",
          chat
        );

        if (onVideoCall) {
          onVideoCall(chat);
        }

        return;
      }

      console.log(
        "ZenvaZapp audio call requested:",
        chat
      );

      if (onCall) {
        onCall(chat);
      }
    },
    [
      chat,
      onCall,
      onVideoCall,
    ]
  );
  return (
    <div
      className="private-chat-page"
      onClick={handlePageClick}
    >
      {/* =====================================
          HEADER
      ===================================== */}

      <header
        className="private-chat-header"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="private-chat-back"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <button
          type="button"
          className="private-chat-contact"
        >
          <div className="private-chat-avatar">
            {chatAvatar.length <= 2
              ? chatAvatar
              : chatAvatar.charAt(0)}
          </div>

          <div className="private-chat-contact-info">
            <h1>{chatName}</h1>

            <p>
              <span className="online-dot" />
              Online
            </p>
          </div>
        </button>

        <div className="private-chat-header-actions">
          <button
            type="button"
            onClick={() =>
             handleStartCall("audio")
            }
            aria-label="Voice call"
            title="Voice call"
          >
            <span className="header-call-icon">
             ☎
            </span>
         </button>

         <button
            type="button"
            onClick={() =>
             handleStartCall("video")
            }
            aria-label="Video call"
            title="Video call"
          >
           <span className="header-video-icon">
             📹
           </span>
          </button>
          <div className="chat-more-container">
            <button
              type="button"
              onClick={
                handleChatMenuToggle
              }
              aria-label="More options"
              title="More options"
            >
              ⋮
            </button>

            {showChatMenu && (
              <div
                className="chat-more-menu"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <button
                  type="button"
                  onClick={
                    handleOpenSearch
                  }
                >
                  <span className="menu-icon">
                    ⌕
                  </span>

                  <span>
                    Search in chat
                  </span>
                </button>

                <button
                  type="button"
                  onClick={
                    handleOpenDisappearingSettings
                  }
                >
                  <span className="menu-icon">
                    ◷
                  </span>

                  <span>
                    Disappearing messages
                  </span>

                  <span className="menu-arrow">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(
                      false
                    );

                    alert(
                      "Chat notifications settings will be added later."
                    );
                  }}
                >
                  <span className="menu-icon">
                    ◌
                  </span>

                  <span>
                    Notifications
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(
                      false
                    );

                    alert(
                      "Contact information will be added later."
                    );
                  }}
                >
                  <span className="menu-icon">
                    ◯
                  </span>

                  <span>
                    Contact info
                  </span>
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteChat
                  }
                >
                  <span className="menu-icon">
                    ⌫
                  </span>

                  <span>
                    Delete conversation
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================
          SEARCH BAR
      ===================================== */}

      {showSearch && (
        <div
          className="private-chat-search-bar"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            className="private-chat-search-back"
            onClick={
              handleCloseSearch
            }
            aria-label="Close search"
          >
            ←
          </button>

          <div className="private-chat-search-field">
            <span className="private-chat-search-icon">
              🔎
            </span>

            <input
              ref={
                searchInputRef
              }
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search messages"
              aria-label="Search messages"
            />

            {searchQuery && (
              <button
                type="button"
                className="private-chat-search-clear"
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
          ERROR
      ===================================== */}

      {sendError && (
        <div className="private-chat-error">
          {sendError}
        </div>
      )}

      {/* =====================================
          BACKGROUND REFRESH
      ===================================== */}

      {isRefreshingMessages && (
        <div className="private-chat-refreshing">
          Syncing messages…
        </div>
      )}

      {/* =====================================
          SEARCH RESULT COUNT
      ===================================== */}

      {showSearch &&
        searchQuery.trim() && (
          <div className="private-chat-search-result-count">
            {visibleMessages.length}{" "}
            {visibleMessages.length ===
            1
              ? "message"
              : "messages"}{" "}
            found
          </div>
        )}

      {/* =====================================
          CHAT AREA
      ===================================== */}

      <main
        className="private-chat-messages"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {!showSearch && (
          <div className="chat-date-divider">
            <span>Today</span>
          </div>
        )}

        {isLoadingMessages &&
        !hasCachedMessages ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">
              💬
            </div>

            <h2>
              Loading messages…
            </h2>

            <p>
              Connecting to your conversation.
            </p>
          </div>
        ) : visibleMessages.length ===
          0 ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">
              {showSearch
                ? "🔎"
                : "💬"}
            </div>

            <h2>
              {showSearch
                ? "No messages found"
                : "No messages"}
            </h2>

            <p>
              {showSearch
                ? "Try another search term."
                : "Start the conversation by sending a message."}
            </p>
          </div>
        ) : (
          visibleMessages.map(
            (item) => (
              <div
                key={item.id}
                className={`message-row ${
                  item.sender ===
                  "me"
                    ? "message-row-outgoing"
                    : "message-row-incoming"
                }`}
              >
                <button
                  type="button"
                  className={`message-bubble ${
                    item.sender ===
                    "me"
                      ? "message-bubble-outgoing"
                      : "message-bubble-incoming"
                  }`}
                  onClick={() =>
                    handleMessageSelect(
                      item
                    )
                  }
                >
                  <p>
                    {item.text}
                  </p>

                  <div className="message-meta">
                    {item.edited && (
                      <span className="message-edited-label">
                        edited
                      </span>
                    )}

                    <span>
                      {item.time}
                    </span>

                    {item.sender ===
                      "me" && (
                      <span
                        className={`message-status ${
                          item.status ||
                          "sent"
                        }`}
                      >
                        {item.status ===
                        "read"
                          ? "✓✓"
                          : item.status ===
                            "delivered"
                          ? "✓✓"
                          : "✓"}
                      </span>
                    )}

                    {item.expiresAt && (
                      <span
                        className="message-expiring-icon"
                        title="Disappearing message"
                      >
                        ◷
                      </span>
                    )}
                  </div>
                </button>
              </div>
            )
          )
        )}

        <div
          ref={messageEndRef}
        />
      </main>

      {/* =====================================
          EMOJI PICKER
      ===================================== */}

      {showEmojiPicker && (
        <div
          className="emoji-picker-container"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {[
            "😊",
            "😂",
            "❤️",
            "👍",
            "🔥",
            "🎉",
            "🙏",
            "😮",
          ].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-btn"
              onClick={() =>
                addEmoji(emoji)
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* =====================================
          UNDO BANNER
      ===================================== */}

      {undoMessageId && (
        <div
          className="undo-banner"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <span>
            Message sent (
            {undoSeconds}s)
          </span>

          <button
            type="button"
            onClick={
              handleUndoMessage
            }
          >
            Undo
          </button>
        </div>
      )}

      {/* =====================================
          MESSAGE ACTION MENU
      ===================================== */}

      {showMessageMenu &&
        selectedMessage && (
          <div
            className="message-action-overlay"
            onClick={
              closeMessageMenu
            }
          >
            <div
              className="message-action-menu"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="message-action-title">
                Message options
              </div>

              {selectedMessage.sender ===
                "me" &&
                !selectedMessage.deletedForEveryone &&
                !selectedMessage.deleted && (
                  <button
                    type="button"
                    onClick={
                      handleStartEdit
                    }
                  >
                    <span className="action-icon">
                      ✎
                    </span>

                    <span>
                      Edit message
                    </span>
                  </button>
                )}

              {!selectedMessage.deleted &&
                !selectedMessage.deletedForEveryone && (
                  <button
                    type="button"
                    onClick={
                      handleCopyMessage
                    }
                  >
                    <span className="action-icon">
                      □
                    </span>

                    <span>
                      Copy message
                    </span>
                  </button>
                )}

              <button
                type="button"
                onClick={
                  handleDeleteForMe
                }
              >
                <span className="action-icon">
                  ⌫
                </span>

                <span>
                  Delete for me
                </span>
              </button>

              {selectedMessage.sender ===
                "me" &&
                !selectedMessage.deletedForEveryone &&
                !selectedMessage.deleted && (
                  <button
                    type="button"
                    onClick={
                      handleDeleteForEveryone
                    }
                  >
                    <span className="action-icon">
                      ⊘
                    </span>

                    <span>
                      Delete for everyone
                    </span>
                  </button>
                )}

              <button
                type="button"
                className="message-action-cancel"
                onClick={
                  closeMessageMenu
                }
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      {/* =====================================
          DELETE CONVERSATION
      ===================================== */}

      {showDeleteMenu && (
        <div
          className="message-action-overlay"
          onClick={() =>
            setShowDeleteMenu(
              false
            )
          }
        >
          <div
            className="message-action-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3>
              Delete entire
              conversation?
            </h3>

            <p>
              This will remove the
              conversation from your
              side. The other person
              will still have their
              messages.
            </p>

            <button
              type="button"
              onClick={
                handleConfirmDeleteConversation
              }
            >
              Confirm Delete
            </button>

            <button
              type="button"
              onClick={() =>
                setShowDeleteMenu(
                  false
                )
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =====================================
          EDIT MODE
      ===================================== */}

      {editingMessage && (
        <div
          className="edit-message-bar"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="edit-message-indicator">
            <span className="edit-message-line" />

            <div className="edit-message-info">
              <strong>
                Edit message
              </strong>

              <span>
                {
                  editingMessage.originalText
                }
              </span>
            </div>
          </div>

          <button
            type="button"
            className="edit-message-close"
            onClick={
              handleCancelEdit
            }
            aria-label="Cancel editing"
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================
          COMPOSER
      ===================================== */}

      <footer
        className={`private-chat-footer ${
          editingMessage
            ? "footer-editing"
            : ""
        }`}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <form
          onSubmit={
            editingMessage
              ? (event) => {
                  event.preventDefault();

                  handleSaveEdit();
                }
              : handleSendMessage
          }
          className="private-chat-input-form"
        >
          {!editingMessage && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={
                handleEmoji
              }
              aria-label="Add emoji"
            >
              <span className="composer-symbol">
                ☺
              </span>
            </button>
          )}

          {!editingMessage && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={
                handleAttachment
              }
              aria-label="Attach file"
            >
              <span className="attachment-icon">
                +
              </span>
            </button>
          )}

          <div className="message-textarea-wrapper">
            <textarea
              ref={
                editingMessage
                  ? editTextareaRef
                  : textareaRef
              }
              className="private-chat-textarea"
              placeholder={
                editingMessage
                  ? "Edit message..."
                  : "Type a message..."
              }
              value={
                editingMessage
                  ? editText
                  : message
              }
              rows={1}
              onChange={(event) => {
                if (
                  editingMessage
                ) {
                  setEditText(
                    event.target.value
                  );

                  resizeEditInput();
                } else {
                  setMessage(
                    event.target.value
                  );

                  resizeMessageInput();
                }
              }}
              onKeyDown={
                editingMessage
                  ? handleEditKeyDown
                  : handleMessageKeyDown
              }
              aria-label={
                editingMessage
                  ? "Edit message"
                  : "Message"
              }
            />
          </div>

          {!editingMessage && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={
                handleCamera
              }
              aria-label="Open camera"
            >
              <span className="camera-icon">
                📷
              </span>
            </button>
          )}

          {editingMessage ? (
            <button
              type="submit"
              className="professional-send-btn edit-save-btn"
              aria-label="Save edited message"
            >
              ✓
            </button>
          ) : message.trim() ? (
            <button
              type="submit"
              className="professional-send-btn"
              aria-label="Send message"
            >
              <span className="send-arrow">
                ➤
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="composer-icon-btn voice-button"
              onClick={
                handleVoice
              }
              aria-label="Record voice message"
              title="Voice message"
            >
              <span className="voice-microphone-icon">
                🎙
              </span>
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}

export default PrivateChat;