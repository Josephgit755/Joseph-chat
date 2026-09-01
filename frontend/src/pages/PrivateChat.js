import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import "./private-chat.css";

// =========================================================
// ZENVAZAPP PRIVATE CHAT
// =========================================================
// IMPORTANT CALLING ARCHITECTURE
// Calling is handled globally via App.js -> CallManager.js
// PrivateChat handles messaging, media, and real-time events.
// =========================================================

function PrivateChat({
  chat,
  user,
  contacts = [],
  onBack,
  onCall,
  onVideoCall,
  onOpenDisappearingSettings,
}) {
  // =========================================================
  // API & URLS
  // =========================================================
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const SOCKET_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // =========================================================
  // USER IDS
  // =========================================================
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

  // =========================================================
  // CONVERSATION ID (DETERMINISTIC FALLBACK)
  // =========================================================
  const conversationId =
    chat?.conversationId ||
    [String(currentUserId), String(otherUserId)]
      .filter(Boolean)
      .sort()
      .join("_");

  // =========================================================
  // CHAT INFORMATION
  // =========================================================
  const chatName =
    chat?.name ||
    chat?.fullName ||
    chat?.displayName ||
    chat?.username ||
    "ZenvaZapp User";

  const chatAvatar =
    chat?.avatar ||
    chatName.charAt(0).toUpperCase();

  // =========================================================
  // STATE DEFINITIONS
  // =========================================================
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [hasCachedMessages, setHasCachedMessages] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [sendError, setSendError] = useState("");

  // Media Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Menus & Modals
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Undo & Edit
  const [undoMessageId, setUndoMessageId] = useState(null);
  const [undoSeconds, setUndoSeconds] = useState(0);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  // Search & Settings
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [disappearingDuration, setDisappearingDuration] = useState("off");

  // Realtime Typing
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  // =========================================================
  // REFS
  // =========================================================
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageEndRef = useRef(null);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Storage Keys
  const disappearingStorageKey = conversationId
    ? `zenvazapp-disappearing-${conversationId}`
    : null;

  const messageCacheKey =
    conversationId && currentUserId
      ? `zenvazapp-messages-${currentUserId}-${conversationId}`
      : null;

  // Forwardable Contacts Helper
  const forwardableContacts = (contacts || []).filter((contactItem) => {
    const contactId =
      contactItem._id ||
      contactItem.id ||
      contactItem.userId ||
      contactItem.username;
    return contactId && String(contactId) !== String(currentUserId);
  });

  // =========================================================
  // DISAPPEARING MILLISECONDS
  // =========================================================
  const getDisappearingMilliseconds = useCallback((duration) => {
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

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getOptimizedMediaUrl = (url, type) => {
    if (!url) return url;
    if (type === "video" && url.includes("cloudinary.com") && !url.endsWith(".mp4")) {
      return url.replace(/\/upload\//, "/upload/f_mp4,q_auto/");
    }
    return url;
  };


  // =========================================================
  // FORMAT MESSAGE
  // =========================================================
  const formatMessage = useCallback(
    (item) => {
      if (!item) return null;
      const id = item._id || item.id || item.messageId;
      if (!id) return null;

      const senderId = item.senderId || item.sender?._id || item.sender?.id;
      const senderIsCurrentUser = String(senderId) === String(currentUserId);
      let displayText = item.text || item.message || "";

      const deletedForEveryone = Boolean(item.deletedForEveryone);
      const deletedForSender = Boolean(item.deletedForSender);
      const deletedForReceiver = Boolean(item.deletedForReceiver);
      const deleted = Boolean(item.deleted);

      const isDeleted =
        deletedForEveryone ||
        deleted ||
        (deletedForSender && senderIsCurrentUser) ||
        (deletedForReceiver && !senderIsCurrentUser);

      if (isDeleted) {
        displayText = "This message was deleted.";
      }

      const createdAt = item.createdAt || item.timestamp || item.sentAt;
      const parsedDate = createdAt ? new Date(createdAt) : new Date();
      const validDate = !Number.isNaN(parsedDate.getTime());
      const messageTime = validDate
        ? parsedDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : "";

      return {
        ...item,
        id,
        _id: item._id || id,
        senderId,
        receiverId: item.receiverId || item.recipientId,
        sender: senderIsCurrentUser ? "me" : "them",
        text: displayText,
        mediaUrl: isDeleted ? null : item.mediaUrl || item.fileUrl || null,
        mediaType: isDeleted ? "text" : item.mediaType || item.messageType || "text",
        time: messageTime,
        status:
          item.status ||
          (item.readAt ? "read" : item.deliveredAt ? "delivered" : "sent"),
        edited: Boolean(item.edited) || Boolean(item.isEdited),
        deletedForEveryone,
        deletedForSender,
        deletedForReceiver,
        deleted,
        disappearingDuration: item.disappearingDuration || "off",
        expiresAt: item.expiresAt || null,
        createdAt:
          item.createdAt ||
          item.timestamp ||
          item.sentAt ||
          new Date().toISOString(),
      };
    },
    [currentUserId]
  );

  // =========================================================
  // SORT & DEDUPLICATE
  // =========================================================
  const mergeMessages = useCallback((existingMessages, incomingMessages) => {
    const combined = [...existingMessages, ...incomingMessages];
    const unique = new Map();

    combined.forEach((item) => {
      if (!item?.id) return;
      const key = String(item.id);
      if (!unique.has(key)) {
        unique.set(key, item);
        return;
      }
      unique.set(key, { ...unique.get(key), ...item });
    });

    return Array.from(unique.values()).sort((a, b) => {
      const aTime = new Date(a.createdAt || a.timestamp || a.sentAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.timestamp || b.sentAt || 0).getTime();
      return aTime - bTime;
    });
  }, []);

  const saveMessageCache = useCallback(
    (items) => {
      if (!messageCacheKey) return;
      try {
        localStorage.setItem(messageCacheKey, JSON.stringify(items));
      } catch (error) {
        console.warn("Unable to save message cache:", error);
      }
    },
    [messageCacheKey]
  );

  // =========================================================
  // TYPING EMITTER
  // =========================================================
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    const socketInstance = socketRef.current;
    const recipientId = otherUserId;

    if (socketInstance && recipientId) {
      socketInstance.emit("typing-start", { recipientId, conversationId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socketInstance.emit("typing-stop", { recipientId, conversationId });
      }, 2000);
    }
  };
 
  // =========================================================
  // LIFECYCLE EFFECTS
  // =========================================================
  useEffect(() => {
    if (!messageCacheKey) {
      setHasCachedMessages(false);
      return;
    }
    try {
      const cached = localStorage.getItem(messageCacheKey);
      if (!cached) {
        setHasCachedMessages(false);
        return;
      }
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) {
        setHasCachedMessages(false);
        return;
      }
      const formatted = parsed.map((item) => formatMessage(item)).filter(Boolean);
      if (formatted.length) {
        setMessages(formatted);
        setHasCachedMessages(true);
      } else {
        setHasCachedMessages(false);
      }
    } catch (error) {
      console.warn("Unable to load cached messages:", error);
      setHasCachedMessages(false);
    }
  }, [messageCacheKey, formatMessage]);

  useEffect(() => {
    if (!disappearingStorageKey) {
      setDisappearingDuration("off");
      return;
    }
    try {
      const saved = localStorage.getItem(disappearingStorageKey);
      setDisappearingDuration(saved || "off");
    } catch (error) {
      console.warn("Unable to load disappearing setting:", error);
      setDisappearingDuration("off");
    }
  }, [disappearingStorageKey]);

  useEffect(() => {
    if (!disappearingStorageKey) return;
    try {
      localStorage.setItem(disappearingStorageKey, disappearingDuration);
    } catch (error) {
      console.warn("Unable to save disappearing setting:", error);
    }
  }, [disappearingStorageKey, disappearingDuration]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const resizeMessageInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  const resizeEditInput = useCallback(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false);
    setSelectedMessage(null);
  }, []);

  // =========================================================
  // SOCKET CONNECTION & LISTENERS
  // =========================================================
  useEffect(() => {
    if (!currentUserId) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    const registerSocketUser = () => {
      if (!socket.connected) return;
      socket.emit("register-user", currentUserId);
      if (conversationId) {
        socket.emit("join-conversation", conversationId);
      }
    };

    socket.on("connect", registerSocketUser);
    socket.on("reconnect", registerSocketUser);
    socket.on("connect_error", (error) => {
      console.error("ZenvaZapp Socket.IO connection error:", error);
    });

    const handleIncomingMessage = (incoming) => {
      if (!incoming) return;
      if (String(incoming.conversationId) !== String(conversationId)) return;
      const formatted = formatMessage(incoming);
      if (!formatted) return;

      setMessages((previous) => {
        const updated = mergeMessages(previous, [formatted]);
        saveMessageCache(updated);
        return updated;
      });
      scrollToBottom();
    };

    const handleEditedMessage = (incoming) => {
      if (!incoming) return;
      if (String(incoming.conversationId) !== String(conversationId)) return;
      const formatted = formatMessage(incoming);
      if (!formatted) return;

      setMessages((previous) => {
        const updated = previous.map((item) =>
          String(item.id) === String(formatted.id) ? { ...item, ...formatted } : item
        );
        saveMessageCache(updated);
        return updated;
      });
    };

    const handleDeletedForEveryone = (incoming) => {
      if (!incoming) return;
      if (String(incoming.conversationId) !== String(conversationId)) return;
      const incomingId = incoming._id || incoming.id || incoming.messageId;
      if (!incomingId) return;

      setMessages((previous) => {
        const updated = previous.map((item) =>
          String(item.id) === String(incomingId)
            ? {
                ...item,
                ...incoming,
                deletedForEveryone: true,
                deleted: true,
                mediaUrl: null,
                mediaType: "text",
                text: "This message was deleted.",
              }
            : item
        );
        saveMessageCache(updated);
        return updated;
      });
    };

    const handleMessageUndone = (incoming) => {
      if (!incoming) return;
      if (String(incoming.conversationId) !== String(conversationId)) return;
      const formatted = formatMessage(incoming);
      if (!formatted) return;

      setMessages((previous) => {
        const updated = previous.map((item) =>
          String(item.id) === String(formatted.id)
            ? { ...item, ...formatted, deleted: false, deletedForEveryone: false }
            : item
        );
        saveMessageCache(updated);
        return updated;
      });
    };

    const handleUserTyping = ({ conversationId: incomingConvId }) => {
      if (incomingConvId === conversationId) setIsRecipientTyping(true);
    };

    const handleUserStoppedTyping = ({ conversationId: incomingConvId }) => {
      if (incomingConvId === conversationId) setIsRecipientTyping(false);
    };

    const handleMessagesReadUpdate = ({ conversationId: incomingConvId, messageIds }) => {
      if (incomingConvId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id) ? { ...msg, status: "read" } : msg
          )
        );
      }
    };

    socket.on("message-delivered", ({ messageId } = {}) => {
      if (!messageId) return;
      setMessages((previous) =>
        previous.map((item) =>
          String(item.id) === String(messageId)
            ? { ...item, status: item.status === "read" ? "read" : "delivered" }
            : item
        )
      );
    });

    socket.on("message-read", ({ messageId } = {}) => {
      if (!messageId) return;
      setMessages((previous) =>
        previous.map((item) =>
          String(item.id) === String(messageId) ? { ...item, status: "read" } : item
        )
      );
    });

    socket.on("new-message", handleIncomingMessage);
    socket.on("message", handleIncomingMessage);
    socket.on("message-edited", handleEditedMessage);
    socket.on("message-deleted-for-everyone", handleDeletedForEveryone);
    socket.on("message-deleted", handleDeletedForEveryone);
    socket.on("message-undone", handleMessageUndone);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stopped-typing", handleUserStoppedTyping);
    socket.on("messages-read-update", handleMessagesReadUpdate);

    registerSocketUser();

    return () => {
      socket.emit("leave-conversation", conversationId);
      socket.off("connect", registerSocketUser);
      socket.off("reconnect", registerSocketUser);
      socket.off("connect_error");
      socket.off("new-message", handleIncomingMessage);
      socket.off("message", handleIncomingMessage);
      socket.off("message-edited", handleEditedMessage);
      socket.off("message-deleted-for-everyone", handleDeletedForEveryone);
      socket.off("message-deleted", handleDeletedForEveryone);
      socket.off("message-undone", handleMessageUndone);
      socket.off("message-delivered");
      socket.off("message-read");
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stopped-typing", handleUserStoppedTyping);
      socket.off("messages-read-update", handleMessagesReadUpdate);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [
    SOCKET_URL,
    conversationId,
    currentUserId,
    formatMessage,
    mergeMessages,
    saveMessageCache,
    scrollToBottom,
  ]);

  // =========================================================
  // LOAD MESSAGES VIA REST API
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      if (!conversationId || !currentUserId) {
        setIsLoadingMessages(false);
        return;
      }

      try {
        if (hasCachedMessages) {
          setIsRefreshingMessages(true);
        } else {
          setIsLoadingMessages(true);
        }
        setSendError("");

        const response = await fetch(
          `${API_URL}/api/messages/${encodeURIComponent(
            conversationId
          )}?userId=${encodeURIComponent(currentUserId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load messages.");
        }
        if (cancelled) return;

        const formattedMessages = Array.isArray(data.messages)
          ? data.messages.map((item) => formatMessage(item)).filter(Boolean)
          : [];

        setMessages(formattedMessages);
        setHasCachedMessages(formattedMessages.length > 0);
        saveMessageCache(formattedMessages);

        const incomingMessages = formattedMessages.filter((item) => item.sender === "them");

        for (const item of incomingMessages) {
          try {
            const responseDelivered = await fetch(
              `${API_URL}/api/messages/${item.id}/delivered`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId }),
              }
            );
            if (responseDelivered.ok) {
              socketRef.current?.emit("message-delivered", {
                conversationId,
                messageId: item.id,
              });
            }
          } catch (error) {
            console.error("Delivered update error:", error);
          }
        }

        for (const item of incomingMessages) {
          try {
            const responseRead = await fetch(`${API_URL}/api/messages/${item.id}/read`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: currentUserId }),
            });
            if (responseRead.ok) {
              socketRef.current?.emit("message-read", {
                conversationId,
                messageId: item.id,
              });
            }
          } catch (error) {
            console.error("Read update error:", error);
          }
        }

        if (!cancelled) {
          setMessages((previous) =>
            previous.map((item) =>
              item.sender === "them"
                ? { ...item, status: "read", readAt: item.readAt || new Date().toISOString() }
                : item
            )
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Load messages error:", error);
        if (!hasCachedMessages) {
          setSendError(`Unable to load messages. ${error.message || ""}`);
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
  }, [API_URL, conversationId, currentUserId, formatMessage, hasCachedMessages, saveMessageCache]);

  // Expiration cleanup
  useEffect(() => {
    if (!messages.length) return undefined;

    const removeExpiredMessages = () => {
      const now = Date.now();
      setMessages((previous) =>
        previous.filter((item) => {
          if (!item.expiresAt) return true;
          const expiration = new Date(item.expiresAt).getTime();
          if (Number.isNaN(expiration)) return true;
          return expiration > now;
        })
      );
    };

    removeExpiredMessages();
    const timer = setInterval(removeExpiredMessages, 1000);
    return () => clearInterval(timer);
  }, [messages.length]);

  useEffect(() => {
    resizeMessageInput();
  }, [message, resizeMessageInput]);

  useEffect(() => {
    if (!editingMessage) return undefined;
    const timer = setTimeout(() => {
      resizeEditInput();
      editTextareaRef.current?.focus();
      if (editTextareaRef.current) {
        const length = editTextareaRef.current.value.length;
        editTextareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [editingMessage, resizeEditInput]);

  useEffect(() => {
    if (!showSearch) return undefined;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [showSearch]);

  useEffect(() => {
    if (messages.length || isLoadingMessages) {
      scrollToBottom();
    }
  }, [messages.length, isLoadingMessages, scrollToBottom]);

  useEffect(() => {
    if (!undoMessageId) return undefined;
    if (undoSeconds <= 0) {
      setUndoMessageId(null);
      return undefined;
    }
    const timer = setInterval(() => {
      setUndoSeconds((previous) => previous - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [undoMessageId, undoSeconds]);

  // =========================================================
  // ACTIONS & HANDLERS
  // =========================================================
  const uploadAndSendMedia = async (file, mediaType) => {
    if (!currentUserId || !otherUserId || !conversationId) {
      setSendError("Unable to identify this conversation.");
      return;
    }

    try {
      setSendError("");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/messages/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await response.json();
      if (!response.ok) {
        throw new Error(uploadData.error || uploadData.message || "Media upload failed.");
      }

      const mediaUrl = uploadData.url;
      const milliseconds = getDisappearingMilliseconds(disappearingDuration);
      const createdAt = new Date().toISOString();

      const payload = {
        conversationId,
        senderId: currentUserId,
        receiverId: otherUserId,
        text: "",
        mediaUrl,
        mediaType,
        messageType: mediaType,
        createdAt,
      };

      if (disappearingDuration !== "off" && milliseconds) {
        payload.disappearingDuration = disappearingDuration;
        payload.expiresAt = new Date(Date.now() + milliseconds).toISOString();
      }

      const sendResponse = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const sendData = await sendResponse.json();
      if (!sendResponse.ok) {
        throw new Error(sendData.message || "Unable to send media message.");
      }

      const savedMessage = formatMessage(sendData.message || sendData);
      if (!savedMessage) throw new Error("The server returned an invalid message.");

      setMessages((previous) => {
        const updated = mergeMessages(previous, [savedMessage]);
        saveMessageCache(updated);
        return updated;
      });

      setUndoMessageId(savedMessage.id);
      setUndoSeconds(5);

      if (socketRef.current?.connected) {
        socketRef.current.emit("send-message", savedMessage);
      }
      scrollToBottom();
    } catch (error) {
      console.error("Media send error:", error);
      setSendError(error?.message || "Unable to send media message.");
    }
  };

  const handleSendMessage = async (event) => {
    if (event) event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (!currentUserId || !otherUserId || !conversationId) {
      setSendError("Unable to identify this conversation.");
      return;
    }

    try {
      setSendError("");
      const milliseconds = getDisappearingMilliseconds(disappearingDuration);
      const createdAt = new Date().toISOString();

      const payload = {
        conversationId,
        senderId: currentUserId,
        receiverId: otherUserId,
        text: trimmedMessage,
        messageType: "text",
        createdAt,
      };

      if (disappearingDuration !== "off" && milliseconds) {
        payload.disappearingDuration = disappearingDuration;
        payload.expiresAt = new Date(Date.now() + milliseconds).toISOString();
      }

      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to send message.");
      }

      const savedMessage = formatMessage(data.message || data);
      if (!savedMessage) {
        throw new Error("The server returned an invalid message.");
      }

      setMessages((previous) => {
        const updated = mergeMessages(previous, [savedMessage]);
        saveMessageCache(updated);
        return updated;
      });

      setMessage("");
      requestAnimationFrame(() => {
        resizeMessageInput();
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current?.emit("typing-stop", { recipientId: otherUserId, conversationId });

      setUndoMessageId(savedMessage.id);
      setUndoSeconds(5);

      if (socketRef.current?.connected) {
        socketRef.current.emit("send-message", savedMessage);
      }
      scrollToBottom();
    } catch (error) {
      console.error("Send message error:", error);
      setSendError(error?.message || "Unable to send message.");
    }
  };

  const handleForwardToContact = async (targetContact) => {
    if (!selectedMessage || !targetContact) return;

    const targetUserId =
      targetContact._id ||
      targetContact.id ||
      targetContact.userId ||
      targetContact.username;

    if (!targetUserId || !currentUserId) {
      setSendError("Unable to identify forward recipient.");
      return;
    }

    const targetConvId = [String(currentUserId), String(targetUserId)].sort().join("_");
    const createdAt = new Date().toISOString();

    const payload = {
      conversationId: targetConvId,
      senderId: currentUserId,
      receiverId: targetUserId,
      text: selectedMessage.text || "",
      mediaUrl: selectedMessage.mediaUrl || null,
      mediaType: selectedMessage.mediaType || "text",
      messageType: selectedMessage.mediaType || "text",
      createdAt,
    };

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to forward message.");
      }

      if (String(targetConvId) === String(conversationId)) {
        const savedMessage = formatMessage(data.message || data);
        if (savedMessage) {
          setMessages((previous) => {
            const updated = mergeMessages(previous, [savedMessage]);
            saveMessageCache(updated);
            return updated;
          });
          scrollToBottom();
        }
      }

      if (socketRef.current?.connected) {
        socketRef.current.emit("send-message", data.message || data);
      }

      setShowForwardModal(false);
      closeMessageMenu();
    } catch (error) {
      console.error("Forward message error:", error);
      setSendError(error?.message || "Failed to forward message.");
    }
  };

  const handleMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmoji = () => {
    setShowEmojiPicker((previous) => !previous);
  };

  const addEmoji = (emoji) => {
    setMessage((previous) => `${previous}${emoji}`);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let mediaType = "document";
    if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type.startsWith("audio/")) mediaType = "audio";

    await uploadAndSendMedia(file, mediaType);
    event.target.value = "";
  };

  const handleCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setSendError("Camera access is not supported by your browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob(async (blob) => {
        if (blob) {
          const imageFile = new File([blob], `photo_${Date.now()}.png`, { type: "image/png" });
          await uploadAndSendMedia(imageFile, "image");
        }
      }, "image/png");
    } catch (error) {
      console.error("Camera access error:", error);
      setSendError("Camera access was denied or is unavailable.");
    }
  };

  const handleVoice = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
    } else {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setSendError("Audio recording is not supported by your browser.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
          await uploadAndSendMedia(audioFile, "audio");
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);

        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error("Microphone access error:", error);
        setSendError("Microphone access was denied or is unavailable.");
      }
    }
  };

  const handleMessageSelect = (item) => {
    setSelectedMessage(item);
    setShowMessageMenu(true);
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage || selectedMessage.deleted || selectedMessage.deletedForEveryone) return;
    try {
      await navigator.clipboard.writeText(selectedMessage.text || "");
    } catch (error) {
      console.warn("Copy message failed:", error);
    }
    closeMessageMenu();
  };

  const handleStartEdit = () => {
    if (!selectedMessage || selectedMessage.sender !== "me") return;
    if (selectedMessage.deleted || selectedMessage.deletedForEveryone) return;

    setEditingMessage({ ...selectedMessage, originalText: selectedMessage.text });
    setEditText(selectedMessage.text || "");
    closeMessageMenu();
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleEditKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSaveEdit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;

    const trimmed = editText.trim();
    if (!trimmed) return;
    const messageId = editingMessage.id;

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(messageId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            text: trimmed,
            content: trimmed,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to edit message.");
      }

      const rawUpdated = data.message || data;
      const updatedMessage = formatMessage({
        ...rawUpdated,
        text: trimmed,
        isEdited: true,
        edited: true,
      });

      setMessages((previous) => {
        const updated = previous.map((item) =>
          String(item.id) === String(messageId) ? updatedMessage : item
        );
        saveMessageCache(updated);
        return updated;
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit("message-edited", updatedMessage);
      }
      handleCancelEdit();
    } catch (error) {
      console.error("Edit message error:", error);
      setSendError(error?.message || "Unable to edit message.");
    }
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;
    const messageId = selectedMessage.id;

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(messageId)}/delete-for-me`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete message for you.");
      }

      setMessages((previous) => {
        const filtered = previous.filter((item) => String(item.id) !== String(messageId));
        saveMessageCache(filtered);
        return filtered;
      });
      closeMessageMenu();
    } catch (error) {
      console.error("Delete for me error:", error);
      setSendError(error?.message || "Unable to delete message for you.");
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || selectedMessage.sender !== "me") return;
    const messageId = selectedMessage.id;

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(messageId)}/delete-for-everyone`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete message for everyone.");
      }

      setMessages((previous) => {
        const updated = previous.map((item) =>
          String(item.id) === String(messageId)
            ? {
                ...item,
                deleted: true,
                deletedForEveryone: true,
                mediaUrl: null,
                mediaType: "text",
                text: "This message was deleted.",
              }
            : item
        );
        saveMessageCache(updated);
        return updated;
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit("message-deleted-for-everyone", {
          ...selectedMessage,
          id: messageId,
          _id: messageId,
          conversationId,
          deleted: true,
          deletedForEveryone: true,
          mediaUrl: null,
          mediaType: "text",
          text: "This message was deleted.",
        });
      }
      closeMessageMenu();
    } catch (error) {
      console.error("Delete for everyone error:", error);
      setSendError(error?.message || "Unable to delete message for everyone.");
    }
  };

  const handleUndoMessage = async () => {
    if (!undoMessageId) return;
    const messageId = undoMessageId;

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(messageId)}/undo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to undo message.");
      }

      const restored = formatMessage(data.message || data);

      setMessages((previous) => {
        const updated = previous.map((item) =>
          String(item.id) === String(messageId)
            ? { ...item, ...(restored || {}), deleted: false, deletedForEveryone: false }
            : item
        );
        saveMessageCache(updated);
        return updated;
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit("message-undone", {
          ...(restored || {}),
          id: messageId,
          _id: messageId,
          conversationId,
          deleted: false,
          deletedForEveryone: false,
        });
      }
      setUndoMessageId(null);
      setUndoSeconds(0);
    } catch (error) {
      console.error("Undo message error:", error);
      setSendError(error?.message || "Unable to undo message.");
    }
  };

  const handleConfirmDeleteConversation = async () => {
    if (!currentUserId || !conversationId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/messages/conversation/${encodeURIComponent(conversationId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete conversation.");
      }

      if (messageCacheKey) {
        try {
          localStorage.removeItem(messageCacheKey);
        } catch (error) {
          console.warn("Unable to remove conversation cache:", error);
        }
      }

      setMessages([]);
      setShowDeleteMenu(false);
      onBack?.();
    } catch (error) {
      console.error("Delete conversation error:", error);
      setSendError(error?.message || "Unable to delete conversation.");
    }
  };

  const handleOpenDisappearing = () => {
    onOpenDisappearingSettings?.(chat, {
      duration: disappearingDuration,
      setDuration: (newDuration) => setDisappearingDuration(newDuration),
    });
  };

  // Filter messages for search
  const visibleMessages = messages.filter((item) => {
    if (!showSearch) return true;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return String(item.text || "").toLowerCase().includes(query);
  });

  // =========================================================
  // RENDER JSX
  // =========================================================
  return (
    <div className="private-chat-page">
      <header className="private-chat-header">
        <div className="private-chat-header-left">
          {onBack && (
            <button className="private-chat-back" onClick={onBack} aria-label="Go back">
              <svg viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="private-chat-contact">
            <div className="private-chat-header-avatar">
              {chat?.avatarUrl ? (
                <img src={chat.avatarUrl} alt={chatName} />
              ) : (
                <span>{chatAvatar}</span>
              )}
              <span className="private-chat-header-online"></span>
            </div>

            <div className="private-chat-header-info">
              <h1>{chatName}</h1>
              <span>{isRecipientTyping ? "typing..." : "online"}</span>
            </div>
          </div>
        </div>

        <div className="private-chat-header-actions">
          {onCall && (
            <button
              className="private-chat-header-call"
              onClick={() => onCall(chat)}
              title="Start Voice Call"
            >
              <svg viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          )}

          {onVideoCall && (
            <button
              className="private-chat-header-call"
              onClick={() => onVideoCall(chat)}
              title="Start Video Call"
            >
              <svg viewBox="0 0 24 24">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          )}

          <div className="chat-more-container">
            <button
              className="private-chat-header-more"
              onClick={() => setShowChatMenu((prev) => !prev)}
              title="More Options"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {showChatMenu && (
        <div className="private-chat-menu-overlay" onClick={() => setShowChatMenu(false)}>
          <div className="private-chat-menu" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setShowChatMenu(false);
                setShowSearch(true);
              }}
            >
              🔍 Search messages
            </button>

            <button
              type="button"
              onClick={() => {
                setShowChatMenu(false);
                handleOpenDisappearing();
              }}
            >
              ◷ Disappearing messages
            </button>

            <button
              type="button"
              onClick={() => {
                setShowChatMenu(false);
                setShowDeleteMenu(true);
              }}
            >
              🗑 Delete conversation
            </button>
          </div>
        </div>
      )}

      {showSearch && (
        <section className="private-chat-search">
          <div className="private-chat-search-box">
            <span>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              aria-label="Search messages"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
                ×
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearch(false);
              }}
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
        </section>
      )}

      {showDeleteMenu && (
        <div className="message-action-overlay" onClick={() => setShowDeleteMenu(false)}>
          <div className="message-action-menu" onClick={(e) => e.stopPropagation()}>
            <h3>Delete entire conversation?</h3>
            <p>
              This will remove the conversation from your side. The other person will still have
              their messages.
            </p>
            <button type="button" onClick={handleConfirmDeleteConversation}>
              Confirm Delete
            </button>
            <button type="button" onClick={() => setShowDeleteMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showMessageMenu && selectedMessage && (
        <div className="message-action-overlay" onClick={closeMessageMenu}>
          <div className="message-action-menu" onClick={(e) => e.stopPropagation()}>
            <h3>Message Options</h3>

            {!selectedMessage.deleted && !selectedMessage.deletedForEveryone && (
              <button
                type="button"
                onClick={() => {
                  setShowMessageMenu(false);
                  setShowForwardModal(true);
                }}
              >
                ↗️ Forward
              </button>
            )}

            {!selectedMessage.deleted && !selectedMessage.deletedForEveryone && (
              <button type="button" onClick={handleCopyMessage}>
                📋 Copy
              </button>
            )}

            {selectedMessage.sender === "me" &&
              !selectedMessage.deleted &&
              !selectedMessage.deletedForEveryone && (
                <button type="button" onClick={handleStartEdit}>
                  ✏️ Edit
                </button>
              )}

            <button type="button" onClick={handleDeleteForMe}>
              🗑 Delete for me
            </button>

            {selectedMessage.sender === "me" &&
              !selectedMessage.deleted &&
              !selectedMessage.deletedForEveryone && (
                <button type="button" onClick={handleDeleteForEveryone}>
                  🗑 Delete for everyone
                </button>
              )}

            <button type="button" onClick={closeMessageMenu}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="message-action-overlay" onClick={() => setShowForwardModal(false)}>
          <div
            className="message-action-menu"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <h3>Forward Message To</h3>
            {forwardableContacts.length === 0 ? (
              <p>No contacts available for forwarding.</p>
            ) : (
              forwardableContacts.map((contactItem) => {
                const name =
                  contactItem.name ||
                  contactItem.fullName ||
                  contactItem.displayName ||
                  contactItem.username ||
                  "ZenvaZapp User";

                return (
                  <button
                    key={contactItem._id || contactItem.id || contactItem.username}
                    type="button"
                    onClick={() => handleForwardToContact(contactItem)}
                    style={{ textAlign: "left", padding: "10px 14px" }}
                  >
                    {name}
                  </button>
                );
              })
            )}
            <button
              type="button"
              onClick={() => setShowForwardModal(false)}
              style={{ marginTop: "10px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingMessage && (
        <div className="edit-message-bar" onClick={(e) => e.stopPropagation()}>
          <div className="edit-message-indicator">
            <span className="edit-message-line" />
            <div className="edit-message-info">
              <strong>Edit message</strong>
              <span>{editingMessage.originalText}</span>
            </div>
          </div>
          <button
            type="button"
            className="edit-message-close"
            onClick={handleCancelEdit}
            aria-label="Cancel editing"
          >
            ×
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />

      <main className="private-chat-messages">
        {isRefreshingMessages && (
          <div className="private-chat-refreshing">Updating messages...</div>
        )}

        {sendError && (
          <div className="private-chat-error">
            <span>{sendError}</span>
            <button type="button" onClick={() => setSendError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        {isLoadingMessages && !hasCachedMessages ? (
          <div className="private-chat-loading">
            <div className="private-chat-spinner" />
            <h2>Loading messages...</h2>
            <p>Connecting to your conversation.</p>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">{showSearch ? "⌕" : "💬"}</div>
            <h2>{showSearch ? "No messages found" : "No messages"}</h2>
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
                item.sender === "me" ? "message-row-outgoing" : "message-row-incoming"
              }`}
            >
              <button
                type="button"
                className={`message-bubble ${
                  item.sender === "me" ? "message-bubble-outgoing" : "message-bubble-incoming"
                }`}
                onClick={() => handleMessageSelect(item)}
              >
                {item.mediaUrl && item.mediaType === "image" && (
                  <img
                    src={item.mediaUrl}
                    alt="Attached media"
                    className="chat-media-image"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      marginBottom: item.text ? "6px" : "0",
                    }}
                  />
                )}

                {item.mediaUrl && item.mediaType === "video" && (
                  <div
                    className="chat-media-video-container"
                    style={{ marginBottom: item.text ? "6px" : "0" }}
                  >
                    <video
                      controls
                      src={getOptimizedMediaUrl(item.mediaUrl, "video")}
                      className="chat-media-video"
                      style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-media-video-fallback"
                      style={{
                        display: "block",
                        marginTop: "4px",
                        fontSize: "0.85rem",
                        color: "#007bff",
                      }}
                    >
                      ▶ Open video
                    </a>
                  </div>
                )}

                {item.mediaUrl && item.mediaType === "audio" && (
                  <audio
                    controls
                    src={item.mediaUrl}
                    className="chat-media-audio"
                    style={{ maxWidth: "100%", marginBottom: item.text ? "6px" : "0" }}
                  />
                )}

                {item.mediaUrl && item.mediaType === "document" && (
                  <a
                    href={item.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-media-file"
                    style={{
                      color: "#007bff",
                      textDecoration: "underline",
                      display: "block",
                      marginBottom: item.text ? "6px" : "0",
                    }}
                  >
                    📄 View Attachment
                  </a>
                )}

                {item.text && <p>{item.text}</p>}

                <div className="message-meta">
                  {item.edited && <span className="message-edited-label">edited</span>}
                  <span>{item.time}</span>
                  {item.sender === "me" && (
                    <span className={`message-status ${item.status || "sent"}`}>
                      {item.status === "read"
                        ? "✔✔"
                        : item.status === "delivered"
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}
                  {item.expiresAt && (
                    <span className="message-expiring-icon" title="Disappearing message">
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

      {showEmojiPicker && (
        <div className="emoji-picker-container" onClick={(e) => e.stopPropagation()}>
          {["😊", "😂", "❤️", "👍", "🔥", "🎉", "🙏", "😮"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-btn"
              onClick={() => addEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <footer
        className={`private-chat-footer ${editingMessage ? "footer-editing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {undoMessageId && (
          <div className="private-chat-undo-bar" role="status" aria-live="polite">
            <div className="private-chat-undo-info">
              <span className="private-chat-undo-icon">✓</span>
              <div className="private-chat-undo-text">
                <strong>Message sent</strong>
                <span>You can undo this message</span>
              </div>
              <span className="private-chat-undo-timer">{undoSeconds}s</span>
            </div>
            <button
              type="button"
              className="private-chat-undo-button"
              onClick={handleUndoMessage}
            >
              Undo
            </button>
          </div>
        )}

        <form
          onSubmit={
            editingMessage
              ? (e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }
              : handleSendMessage
          }
          className="private-chat-input-form"
        >
          {!editingMessage && !isRecording && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={handleEmoji}
              aria-label="Add emoji"
            >
              <span className="composer-symbol">☺</span>
            </button>
          )}

          {!editingMessage && !isRecording && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={handleAttachment}
              aria-label="Attach file"
            >
              <span className="attachment-icon">+</span>
            </button>
          )}

          <div className="message-textarea-wrapper">
            {isRecording ? (
              <div
                className="voice-recording-indicator"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 12px",
                  color: "#e53e3e",
                  fontWeight: "500",
                }}
              >
                <span>🔴 Recording voice message...</span>
                <span style={{ fontFamily: "monospace", fontSize: "1rem" }}>
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
            ) : (
              <textarea
                ref={editingMessage ? editTextareaRef : textareaRef}
                className="private-chat-textarea"
                placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                value={editingMessage ? editText : message}
                rows={1}
                onChange={(e) => {
                  if (editingMessage) {
                    setEditText(e.target.value);
                    resizeEditInput();
                  } else {
                    handleInputChange(e);
                    resizeMessageInput();
                  }
                }}
                onKeyDown={editingMessage ? handleEditKeyDown : handleMessageKeyDown}
                aria-label={editingMessage ? "Edit message" : "Message"}
              />
            )}
          </div>

          {!editingMessage && !isRecording && (
            <button
              type="button"
              className="composer-icon-btn"
              onClick={handleCamera}
              aria-label="Open camera"
            >
              <span className="camera-icon">📷</span>
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
              <span className="send-arrow">➤</span>
            </button>
          ) : (
            <button
              type="button"
              className={`composer-icon-btn voice-button ${isRecording ? "recording" : ""}`}
              onClick={handleVoice}
              aria-label={isRecording ? "Stop recording voice message" : "Record voice message"}
              title={isRecording ? "Stop recording" : "Voice message"}
              style={{ color: isRecording ? "#ff4d4d" : "inherit" }}
            >
              <span className="voice-microphone-icon">
                {isRecording ? "🛑 Stop" : "🎙"}
              </span>
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}

export default PrivateChat;