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
  // MESSAGE STATE
  // ==========================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [sendError, setSendError] = useState("");

  // ==========================================
  // MESSAGE MENU
  // ==========================================

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  // ==========================================
  // EMOJI
  // ==========================================

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ==========================================
  // UNDO
  // ==========================================

  const [undoMessageId, setUndoMessageId] = useState(null);
  const [undoSeconds, setUndoSeconds] = useState(0);

  // ==========================================
  // EDIT
  // ==========================================

  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  // ==========================================
  // SEARCH
  // ==========================================

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchInputRef = useRef(null);

  // ==========================================
  // DISAPPEARING MESSAGES
  // ==========================================

  const [disappearingDuration, setDisappearingDuration] =
    useState("off");

  // ==========================================
  // REFS
  // ==========================================

  const messageEndRef = useRef(null);
  const socketRef = useRef(null);

  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);

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
  // DISAPPEARING OPTIONS
  // ==========================================

  const disappearingOptions = [
    {
      value: "off",
      label: "Off",
      description: "Messages never disappear.",
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

  // Avoid unused-variable lint problems while keeping
  // these options available for future UI integration.
  void disappearingOptions;

  // ==========================================
  // DISAPPEARING STORAGE
  // ==========================================

  const disappearingStorageKey = conversationId
    ? `zenvazapp-disappearing-${conversationId}`
    : null;

  // ==========================================
  // LOAD DISAPPEARING SETTING
  // ==========================================

  useEffect(() => {
    if (!disappearingStorageKey) {
      return;
    }

    try {
      const saved = localStorage.getItem(
        disappearingStorageKey
      );

      if (
        saved === "off" ||
        saved === "24h" ||
        saved === "7d" ||
        saved === "90d"
      ) {
        setDisappearingDuration(saved);
      } else {
        setDisappearingDuration("off");
      }
    } catch (error) {
      console.error(
        "Unable to load disappearing message setting:",
        error
      );

      setDisappearingDuration("off");
    }
  }, [disappearingStorageKey]);

  // ==========================================
  // FORMAT MESSAGE
  // ==========================================

  const formatMessage = useCallback(
    (item) => {
      if (!item) {
        return null;
      }

      const senderIsCurrentUser =
        String(item.senderId) ===
        String(currentUserId);

      let displayText = item.text || "";

      if (
        item.deletedForEveryone ||
        item.deleted ||
        (item.deletedForSender && senderIsCurrentUser) ||
        (item.deletedForReceiver && !senderIsCurrentUser)
      ) {
        displayText = "This message was deleted.";
      }

      return {
        ...item,

        id: item._id || item.id,

        sender: senderIsCurrentUser
          ? "me"
          : "them",

        text: displayText,

        time: item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString(
              [],
              {
                hour: "numeric",
                minute: "2-digit",
              }
            )
          : new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
      };
    },
    [currentUserId]
  );

  // ==========================================
  // DISAPPEARING MILLISECONDS
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
  // RESIZE MESSAGE INPUT
  // ==========================================

  const resizeMessageInput = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const minimumHeight = 24;
    const maximumHeight = 140;

    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minimumHeight),
      maximumHeight
    );

    textarea.style.height = `${nextHeight}px`;
  }, []);

  // ==========================================
  // RESIZE EDIT INPUT
  // ==========================================

  const resizeEditInput = useCallback(() => {
    const textarea = editTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const minimumHeight = 24;
    const maximumHeight = 120;

    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minimumHeight),
      maximumHeight
    );

    textarea.style.height = `${nextHeight}px`;
  }, []);

  // ==========================================
  // RESET INPUT
  // ==========================================

  const resetMessageInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
  }, []);

  const resetEditInput = useCallback(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = "24px";
    }
  }, []);

  // ==========================================
  // KEYBOARD
  // ==========================================

  const handleMessageKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleEditKeyDown = (event) => {
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
    if (!conversationId || !currentUserId) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
    });

    socketRef.current = socket;

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

    socket.on("connect_error", (error) => {
      console.error(
        "ZenvaZapp Socket.IO error:",
        error
      );
    });

    // ========================================
    // NEW MESSAGE
    // ========================================

    socket.on(
      "new-message",
      (incomingMessage) => {
        if (
          !incomingMessage ||
          !incomingMessage._id
        ) {
          return;
        }

        if (
          String(
            incomingMessage.conversationId
          ) !== String(conversationId)
        ) {
          return;
        }

        const formattedMessage =
          formatMessage(incomingMessage);

        if (!formattedMessage) {
          return;
        }

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

        if (
          String(incomingMessage.senderId) !==
          String(currentUserId)
        ) {
          socket.emit(
            "message-delivered",
            {
              conversationId,
              messageId:
                incomingMessage._id,
            }
          );

          socket.emit(
            "message-read",
            {
              conversationId,
              messageId:
                incomingMessage._id,
            }
          );
        }
      }
    );

    // ========================================
    // EDITED
    // ========================================

    socket.on(
      "message-edited",
      (updatedMessage) => {
        if (
          !updatedMessage ||
          !updatedMessage._id
        ) {
          return;
        }

        if (
          String(
            updatedMessage.conversationId
          ) !== String(conversationId)
        ) {
          return;
        }

        setMessages((previous) =>
          previous.map((item) => {
            if (
              String(item.id) !==
              String(updatedMessage._id)
            ) {
              return item;
            }

            return {
              ...item,
              text:
                updatedMessage.text || "",
              edited: true,
              updatedAt:
                updatedMessage.updatedAt ||
                new Date().toISOString(),
            };
          })
        );
      }
    );

    // ========================================
    // DELETE EVERYONE
    // ========================================

    socket.on(
      "message-deleted-for-everyone",
      (deletedMessage) => {
        if (
          !deletedMessage ||
          !deletedMessage._id
        ) {
          return;
        }

        if (
          String(
            deletedMessage.conversationId
          ) !== String(conversationId)
        ) {
          return;
        }

        setMessages((previous) =>
          previous.map((item) =>
            String(item.id) ===
            String(deletedMessage._id)
              ? {
                  ...item,
                  text:
                    "This message was deleted.",
                  deletedForEveryone: true,
                  deleted: true,
                }
              : item
          )
        );
      }
    );

    // ========================================
    // MESSAGE UNDONE
    // ========================================

    socket.on(
      "message-undone",
      (undoneMessage) => {
        if (
          !undoneMessage ||
          !undoneMessage._id
        ) {
          return;
        }

        if (
          String(
            undoneMessage.conversationId
          ) !== String(conversationId)
        ) {
          return;
        }

        setMessages((previous) =>
          previous.filter(
            (item) =>
              String(item.id) !==
              String(undoneMessage._id)
          )
        );
      }
    );

    // ========================================
    // DISAPPEARING SETTING
    // ========================================

    socket.on(
      "disappearing-setting-changed",
      ({
        conversationId:
          incomingConversationId,
        duration,
      }) => {
        if (
          String(
            incomingConversationId
          ) !== String(conversationId)
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

        setDisappearingDuration(duration);

        if (disappearingStorageKey) {
          try {
            localStorage.setItem(
              disappearingStorageKey,
              duration
            );
          } catch (error) {
            console.error(
              "Unable to save received disappearing setting:",
              error
            );
          }
        }
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

        setMessages((previous) =>
          previous.map((item) =>
            String(item.id) ===
            String(messageId)
              ? {
                  ...item,
                  status:
                    item.status === "read"
                      ? "read"
                      : "delivered",
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

        setMessages((previous) =>
          previous.map((item) =>
            String(item.id) ===
            String(messageId)
              ? {
                  ...item,
                  status: "read",
                }
              : item
          )
        );
      }
    );

    return () => {
      socket.emit(
        "leave-conversation",
        conversationId
      );

      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    SOCKET_URL,
    conversationId,
    currentUserId,
    formatMessage,
    disappearingStorageKey,
  ]);

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !currentUserId) {
        setIsLoadingMessages(false);
        return;
      }

      try {
        setIsLoadingMessages(true);
        setSendError("");

        const response = await fetch(
          `${API_URL}/api/messages/${encodeURIComponent(
            conversationId
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load messages."
          );
        }

        const formattedMessages =
          (data.messages || [])
            .map((item) =>
              formatMessage(item)
            )
            .filter(Boolean);

        setMessages(formattedMessages);

        const incomingMessages =
          formattedMessages.filter(
            (item) =>
              item.sender === "them" &&
              item.status !== "read"
          );

        for (const item of incomingMessages) {
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
                  messageId: item.id,
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

        for (const item of incomingMessages) {
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

            if (responseRead.ok) {
              socketRef.current?.emit(
                "message-read",
                {
                  conversationId,
                  messageId: item.id,
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

        setMessages((previous) =>
          previous.map((item) =>
            item.sender === "them"
              ? {
                  ...item,
                  status: "read",
                }
              : item
          )
        );
      } catch (error) {
        console.error(
          "Load messages error:",
          error
        );

        setSendError(
          `Unable to load messages. ${
            error.message || ""
          }`
        );
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [
    API_URL,
    conversationId,
    currentUserId,
    formatMessage,
  ]);

  // ==========================================
  // REMOVE EXPIRED MESSAGES
  // ==========================================

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const removeExpiredMessages = () => {
      const now = Date.now();

      setMessages((previous) =>
        previous.filter((item) => {
          if (!item.expiresAt) {
            return true;
          }

          const expiration =
            new Date(
              item.expiresAt
            ).getTime();

          if (
            Number.isNaN(expiration)
          ) {
            return true;
          }

          return expiration > now;
        })
      );
    };

    removeExpiredMessages();

    const timer = setInterval(
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

  useEffect(() => {
    if (!editingMessage) {
      return;
    }

    setTimeout(() => {
      resizeEditInput();

      editTextareaRef.current?.focus();

      if (editTextareaRef.current) {
        const length =
          editTextareaRef.current.value
            .length;

        editTextareaRef.current.setSelectionRange(
          length,
          length
        );
      }
    }, 0);
  }, [
    editingMessage,
    resizeEditInput,
  ]);

  // ==========================================
  // SEARCH FOCUS
  // ==========================================

  useEffect(() => {
    if (!showSearch) {
      return;
    }

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [showSearch]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    if (!searchQuery.trim()) {
      messageEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, searchQuery]);

  // ==========================================
  // UNDO TIMER
  // ==========================================

  useEffect(() => {
    if (!undoMessageId) {
      return;
    }

    if (undoSeconds <= 0) {
      setUndoMessageId(null);
      setUndoSeconds(0);
      return;
    }

    const timer = setTimeout(() => {
      setUndoSeconds(
        (previous) => previous - 1
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    undoMessageId,
    undoSeconds,
  ]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage =
      message.trim();

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

    const expirationMilliseconds =
      getDisappearingMilliseconds(
        disappearingDuration
      );

    const expiresAt =
      expirationMilliseconds
        ? new Date(
            Date.now() +
              expirationMilliseconds
          ).toISOString()
        : null;

    const messageToSend = {
      conversationId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text: trimmedMessage,
      messageType: "text",
      disappearingDuration,
      expiresAt,
    };

    try {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send message."
        );
      }

      if (!data.message) {
        throw new Error(
          "The server did not return the saved message."
        );
      }

      const savedMessage = {
        ...data.message,

        disappearingDuration:
          data.message
            .disappearingDuration ||
          disappearingDuration,

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

      if (
        socketRef.current?.connected
      ) {
        socketRef.current.emit(
          "send-message",
          savedMessage
        );
      }

      setMessage("");
      resetMessageInput();

      setUndoMessageId(
        formattedMessage.id
      );

      setUndoSeconds(5);
    } catch (error) {
      console.error(
        "Send message error:",
        error
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

  const handleMessageSelect = (item) => {
    setSelectedMessage(item);
    setShowMessageMenu(true);
    setShowChatMenu(false);
    setShowDeleteMenu(false);
    setShowEmojiPicker(false);
  };

  const closeMessageMenu = () => {
    setSelectedMessage(null);
    setShowMessageMenu(false);
  };

  // ==========================================
  // START EDIT
  // ==========================================

  const handleStartEdit = () => {
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

    setEditText(originalText);

    closeMessageMenu();
    setShowEmojiPicker(false);
    setSendError("");
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
    resetEditInput();
  };

  // ==========================================
  // SAVE EDIT
  // ==========================================

  const handleSaveEdit = async () => {
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

    try {
      setSendError("");

      const response = await fetch(
        `${API_URL}/api/messages/${editingMessage.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
            text: trimmedText,
          }),
        }
      );

      const data = await response.json();

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
        conversationId,
        senderId: currentUserId,
        receiverId: otherUserId,
        text: trimmedText,
        edited: true,
        updatedAt:
          data.message?.updatedAt ||
          new Date().toISOString(),
      };

      // ========================================
      // UPDATE LOCAL BROWSER
      // ========================================

      setMessages((previous) =>
        previous.map((item) =>
          String(item.id) ===
          String(editingMessage.id)
            ? {
                ...item,
                text: trimmedText,
                edited: true,
                updatedAt:
                  updatedMessage.updatedAt,
              }
            : item
        )
      );

      // ========================================
      // UPDATE OTHER BROWSER
      // ========================================

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

  const handleCopyMessage = async () => {
    if (!selectedMessage) {
      return;
    }

    const textToCopy =
      selectedMessage.text || "";

    if (!textToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        textToCopy
      );

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
  // UNDO
  // ==========================================

  const handleUndoMessage = async () => {
    if (!undoMessageId) {
      return;
    }

    const messageId =
      undoMessageId;

    try {
      setSendError("");

      const response = await fetch(
        `${API_URL}/api/messages/${messageId}/delete-for-everyone`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to undo message."
        );
      }

      setMessages((previous) =>
        previous.filter(
          (item) =>
            String(item.id) !==
            String(messageId)
        )
      );

      setUndoMessageId(null);
      setUndoSeconds(0);

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

  const handleDeleteForMe = async () => {
    if (!selectedMessage) {
      return;
    }

    const messageId =
      selectedMessage.id;

    try {
      setSendError("");

      const response = await fetch(
        `${API_URL}/api/messages/${messageId}/delete-for-me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete message."
        );
      }

      setMessages((previous) =>
        previous.filter(
          (item) =>
            String(item.id) !==
            String(messageId)
        )
      );

      closeMessageMenu();
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

      const messageId =
        selectedMessage.id;

      try {
        setSendError("");

        const response = await fetch(
          `${API_URL}/api/messages/${messageId}/delete-for-everyone`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              userId: currentUserId,
            }),
          }
        );

        const data = await response.json();

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
          conversationId,
          text:
            "This message was deleted.",
          deletedForEveryone: true,
          deleted: true,
        };

        setMessages((previous) =>
          previous.map((item) =>
            String(item.id) ===
            String(messageId)
              ? {
                  ...item,
                  text:
                    "This message was deleted.",
                  deletedForEveryone: true,
                  deleted: true,
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
  // ATTACHMENT
  // ==========================================

  const handleAttachment = () => {
    alert(
      "Attachments will be connected to Smart Files."
    );
  };

  // ==========================================
  // CAMERA
  // ==========================================

  const handleCamera = () => {
    alert(
      "Camera will be connected to the ZenvaZapp media system."
    );
  };

  // ==========================================
  // EMOJI
  // ==========================================

  const handleEmoji = () => {
    setShowEmojiPicker(
      (previous) => !previous
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

  const handleVoice = () => {
    alert(
      "Voice recording will be connected to ZenvaZapp voice messaging."
    );
  };

  // ==========================================
  // CHAT MENU
  // ==========================================

  const handleChatMenuToggle = () => {
    setShowChatMenu(
      (previous) => !previous
    );

    setShowDeleteMenu(false);
    setShowMessageMenu(false);
  };

  // ==========================================
  // OPEN SEARCH
  // ==========================================

  const handleOpenSearch = () => {
    setShowChatMenu(false);
    setShowSearch(true);
    setSearchQuery("");
  };

  const handleCloseSearch = () => {
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
  // DELETE CHAT
  // ==========================================

  const handleDeleteChat = () => {
    setShowChatMenu(false);
    setShowDeleteMenu(true);
  };

  // ==========================================
  // PAGE CLICK
  // ==========================================

  const handlePageClick = () => {
    if (showMessageMenu) {
      closeMessageMenu();
    }

    if (showChatMenu) {
      setShowChatMenu(false);
    }

    if (showDeleteMenu) {
      setShowDeleteMenu(false);
    }
  };

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const visibleMessages =
    searchQuery.trim()
      ? messages.filter((item) =>
          String(item.text || "")
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
        {/* BACK */}

        <button
          type="button"
          className="private-chat-back"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        {/* CONTACT */}

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

        {/* HEADER ACTIONS */}

        <div className="private-chat-header-actions">
          {/* AUDIO CALL */}

          <button
            type="button"
            onClick={() =>
              onCall?.(chat)
            }
            aria-label="Voice call"
            title="Voice call"
          >
            <span className="header-call-icon">
              ☎
            </span>
          </button>

          {/* VIDEO CALL */}

          <button
            type="button"
            onClick={() =>
              onVideoCall?.(chat)
            }
            aria-label="Video call"
            title="Video call"
          >
            <span className="header-video-icon">
              📹
            </span>
          </button>

          {/* MORE */}

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
                {/* SEARCH */}

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

                {/* DISAPPEARING */}

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

                {/* NOTIFICATIONS */}

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);

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

                {/* CONTACT INFO */}

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);

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

                {/* DELETE */}

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
          PROFESSIONAL SEARCH BAR
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
              ⌕
            </span>

            <input
              ref={searchInputRef}
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
          SEARCH RESULT COUNT
      ===================================== */}

      {showSearch &&
        searchQuery.trim() && (
          <div className="private-chat-search-result-count">
            {visibleMessages.length}{" "}
            {visibleMessages.length === 1
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

        {isLoadingMessages ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">
              💬
            </div>

            <h2>
              Loading messages...
            </h2>

            <p>Please wait.</p>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">
              {showSearch ? "⌕" : "💬"}
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
          visibleMessages.map((item) => (
            <div
              key={item.id}
              className={`message-row ${
                item.sender === "me"
                  ? "message-row-outgoing"
                  : "message-row-incoming"
              }`}
            >
              <button
                type="button"
                className={`message-bubble ${
                  item.sender === "me"
                    ? "message-bubble-outgoing"
                    : "message-bubble-incoming"
                }`}
                onClick={() =>
                  handleMessageSelect(item)
                }
              >
                <p>{item.text}</p>

                <div className="message-meta">
                  {item.edited && (
                    <span className="message-edited-label">
                      edited
                    </span>
                  )}

                  <span>
                    {item.time}
                  </span>

                  {item.sender === "me" && (
                    <span
                      className={`message-status ${item.status || "sent"}`}
                    >
                      {item.status === "read"
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
          ))
        )}

        <div ref={messageEndRef} />
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
            Message sent ({undoSeconds}s)
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
            onClick={closeMessageMenu}
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

              {/* EDIT */}

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

              {/* COPY */}

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

              {/* DELETE FOR ME */}

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

              {/* DELETE FOR EVERYONE */}

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

              {/* CANCEL */}

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
            setShowDeleteMenu(false)
          }
        >
          <div
            className="message-action-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3>
              Delete entire conversation?
            </h3>

            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setShowDeleteMenu(false);
              }}
            >
              Confirm Delete
            </button>

            <button
              type="button"
              onClick={() =>
                setShowDeleteMenu(false)
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
                {editingMessage.originalText}
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
          {/* EMOJI */}

          {!editingMessage && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={handleEmoji}
              aria-label="Add emoji"
            >
              <span className="composer-symbol">
                ☺
              </span>
            </button>
          )}

          {/* ATTACHMENT */}

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

          {/* TEXTAREA */}

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
                if (editingMessage) {
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

          {/* CAMERA */}

          {!editingMessage && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={handleCamera}
              aria-label="Open camera"
            >
              <span className="camera-icon">
                📷
              </span>
            </button>
          )}

          {/* SEND / SAVE / VOICE */}

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
              onClick={handleVoice}
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