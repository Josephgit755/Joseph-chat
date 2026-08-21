import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import { io } from "socket.io-client";

import "./private-chat.css";


// =========================================================
// ZENVazAPP PRIVATE CHAT
// =========================================================
//
// IMPORTANT CALLING ARCHITECTURE
//
// PrivateChat DOES NOT create WebRTC connections.
//
// Calling is now handled globally by:
//     App.js
//        ↓
//     CallManager.js
//        ↓
//     WebRTC / CallScreen / IncomingCall
//
// PrivateChat only sends:
//     onCall(chat)
//     onVideoCall(chat)
//
// Everything else in this file belongs to messaging.
// =========================================================


function PrivateChat({
  chat,
  user,
  onBack,
  onCall,
  onVideoCall,
  onOpenDisappearingSettings,
}) {

  // =========================================================
  // API
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
  // CONVERSATION ID
  // =========================================================

  const conversationId =
    chat?.conversationId ||
    [
      currentUserId,
      otherUserId,
    ]
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
    chatName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // MESSAGE STATE
  // =========================================================

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [
    isLoadingMessages,
    setIsLoadingMessages,
  ] = useState(true);

  const [
    hasCachedMessages,
    setHasCachedMessages,
  ] = useState(false);

  const [
    isRefreshingMessages,
    setIsRefreshingMessages,
  ] = useState(false);

  const [
    sendError,
    setSendError,
  ] = useState("");


  // =========================================================
  // MESSAGE MENU
  // =========================================================

  const [
    selectedMessage,
    setSelectedMessage,
  ] = useState(null);

  const [
    showMessageMenu,
    setShowMessageMenu,
  ] = useState(false);

  const [
    showChatMenu,
    setShowChatMenu,
  ] = useState(false);

  const [
    showDeleteMenu,
    setShowDeleteMenu,
  ] = useState(false);


  // =========================================================
  // EMOJI
  // =========================================================

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);


  // =========================================================
  // UNDO
  // =========================================================

  const [
    undoMessageId,
    setUndoMessageId,
  ] = useState(null);

  const [
    undoSeconds,
    setUndoSeconds,
  ] = useState(0);


  // =========================================================
  // EDIT
  // =========================================================

  const [
    editingMessage,
    setEditingMessage,
  ] = useState(null);

  const [
    editText,
    setEditText,
  ] = useState("");


  // =========================================================
  // SEARCH
  // =========================================================

  const [
    showSearch,
    setShowSearch,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const searchInputRef =
    useRef(null);


  // =========================================================
  // DISAPPEARING MESSAGES
  // =========================================================

  const [
    disappearingDuration,
    setDisappearingDuration,
  ] = useState("off");


  // =========================================================
  // REFS
  // =========================================================

  const messageEndRef =
    useRef(null);

  const socketRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const editTextareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);


  // =========================================================
  // STORAGE KEYS
  // =========================================================

  const disappearingStorageKey =
    conversationId
      ? `zenvazapp-disappearing-${conversationId}`
      : null;

  const messageCacheKey =
    conversationId &&
    currentUserId
      ? `zenvazapp-messages-${currentUserId}-${conversationId}`
      : null;


  // =========================================================
  // DISAPPEARING OPTIONS
  // =========================================================

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


  // =========================================================
  // DISAPPEARING MILLISECONDS
  // =========================================================

  const getDisappearingMilliseconds =
    useCallback(
      (duration) => {
        switch (duration) {

          case "24h":
            return (
              24 *
              60 *
              60 *
              1000
            );

          case "7d":
            return (
              7 *
              24 *
              60 *
              60 *
              1000
            );

          case "90d":
            return (
              90 *
              24 *
              60 *
              60 *
              1000
            );

          default:
            return null;
        }
      },
      []
    );


  // =========================================================
  // FORMAT MESSAGE
  // =========================================================

  const formatMessage =
    useCallback(
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
          Boolean(
            item.deletedForEveryone
          );

        const deletedForSender =
          Boolean(
            item.deletedForSender
          );

        const deletedForReceiver =
          Boolean(
            item.deletedForReceiver
          );

        const deleted =
          Boolean(
            item.deleted
          );

        if (
          deletedForEveryone ||
          deleted ||
          (
            deletedForSender &&
            senderIsCurrentUser
          ) ||
          (
            deletedForReceiver &&
            !senderIsCurrentUser
          )
        ) {
          displayText =
            "This message was deleted.";
        }

        const createdAt =
          item.createdAt ||
          item.timestamp ||
          item.sentAt;

        const parsedDate =
          createdAt
            ? new Date(createdAt)
            : new Date();

        const validDate =
          !Number.isNaN(
            parsedDate.getTime()
          );

        const messageTime =
          validDate
            ? parsedDate.toLocaleTimeString(
                [],
                {
                  hour:
                    "numeric",
                  minute:
                    "2-digit",
                }
              )
            : "";

        return {
          ...item,

          id,

          _id:
            item._id ||
            id,

          senderId,

          receiverId:
            item.receiverId ||
            item.recipientId,

          sender:
            senderIsCurrentUser
              ? "me"
              : "them",

          text:
            displayText,

          time:
            messageTime,

          status:
            item.status ||
            (
              item.readAt
                ? "read"
                : item.deliveredAt
                ? "delivered"
                : "sent"
            ),

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


  // =========================================================
  // SORT + DEDUPLICATE
  // =========================================================

  const mergeMessages =
    useCallback(
      (
        existingMessages,
        incomingMessages
      ) => {

        const combined = [
          ...existingMessages,
          ...incomingMessages,
        ];

        const unique =
          new Map();

        combined.forEach(
          (item) => {

            if (!item?.id) {
              return;
            }

            const key =
              String(item.id);

            if (
              !unique.has(key)
            ) {
              unique.set(
                key,
                item
              );

              return;
            }

            unique.set(
              key,
              {
                ...unique.get(
                  key
                ),

                ...item,
              }
            );
          }
        );

        return Array.from(
          unique.values()
        ).sort(
          (a, b) => {

            const aTime =
              new Date(
                a.createdAt ||
                a.timestamp ||
                a.sentAt ||
                0
              ).getTime();

            const bTime =
              new Date(
                b.createdAt ||
                b.timestamp ||
                b.sentAt ||
                0
              ).getTime();

            return (
              aTime -
              bTime
            );
          }
        );
      },
      []
    );


  // =========================================================
  // SAVE MESSAGE CACHE
  // =========================================================

  const saveMessageCache =
    useCallback(
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
            "Unable to save message cache:",
            error
          );
        }
      },
      [messageCacheKey]
    );


  // =========================================================
  // LOAD MESSAGE CACHE
  // =========================================================

  useEffect(() => {

    if (!messageCacheKey) {

      setHasCachedMessages(
        false
      );

      return;
    }

    try {

      const cached =
        localStorage.getItem(
          messageCacheKey
        );

      if (!cached) {

        setHasCachedMessages(
          false
        );

        return;
      }

      const parsed =
        JSON.parse(cached);

      if (
        !Array.isArray(parsed)
      ) {

        setHasCachedMessages(
          false
        );

        return;
      }

      const formatted =
        parsed
          .map((item) =>
            formatMessage(item)
          )
          .filter(Boolean);

      if (
        formatted.length
      ) {

        setMessages(
          formatted
        );

        setHasCachedMessages(
          true
        );

      } else {

        setHasCachedMessages(
          false
        );
      }

    } catch (error) {

      console.warn(
        "Unable to load cached messages:",
        error
      );

      setHasCachedMessages(
        false
      );
    }

  }, [
    messageCacheKey,
    formatMessage,
  ]);


  // =========================================================
  // LOAD DISAPPEARING SETTING
  // =========================================================

  useEffect(() => {

    if (
      !disappearingStorageKey
    ) {

      setDisappearingDuration(
        "off"
      );

      return;
    }

    try {

      const saved =
        localStorage.getItem(
          disappearingStorageKey
        );

      setDisappearingDuration(
        saved || "off"
      );

    } catch (error) {

      console.warn(
        "Unable to load disappearing setting:",
        error
      );

      setDisappearingDuration(
        "off"
      );
    }

  }, [
    disappearingStorageKey,
  ]);


  // =========================================================
  // SAVE DISAPPEARING SETTING
  // =========================================================



  // =========================================================
  // SCROLL TO BOTTOM
  // =========================================================

  const scrollToBottom =
    useCallback(() => {

      requestAnimationFrame(
        () => {

          messageEndRef.current?.scrollIntoView(
            {
              behavior:
                "smooth",
            }
          );

        }
      );

    }, []);


  // =========================================================
  // INPUT RESIZE
  // =========================================================

  const resizeMessageInput =
    useCallback(() => {

      const textarea =
        textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.style.height =
        "auto";

      textarea.style.height =
        `${Math.min(
          textarea.scrollHeight,
          120
        )}px`;

    }, []);


  const resizeEditInput =
    useCallback(() => {

      const textarea =
        editTextareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.style.height =
        "auto";

      textarea.style.height =
        `${Math.min(
          textarea.scrollHeight,
          120
        )}px`;

    }, []);


  // =========================================================
  // CLOSE MESSAGE MENU
  // =========================================================

  const closeMessageMenu =
    useCallback(() => {

      setShowMessageMenu(
        false
      );

      setSelectedMessage(
        null
      );

    }, []);


  // =========================================================
  // SOCKET CONNECTION
  // =========================================================
  //
  // IMPORTANT:
  //
  // This socket is ONLY for messaging.
  //
  // There are NO:
  //
  // call-offer
  // call-answer
  // call-ice-candidate
  // call-rejected
  // call-ended
  //
  // listeners here anymore.
  //
  // Calling belongs to CallManager.
  // =========================================================

  useEffect(() => {

    if (!currentUserId) {
      return undefined;
    }

    const socket =
      io(SOCKET_URL, {
        transports: [
          "websocket",
          "polling",
        ],

        autoConnect:
          true,
      });

    socketRef.current =
      socket;


    // =======================================================
    // REGISTER SOCKET USER
    // =======================================================

    const registerSocketUser =
      () => {

        if (
          !socket.connected
        ) {
          return;
        }

        socket.emit(
          "register-user",
          currentUserId
        );

        if (
          conversationId
        ) {

          socket.emit(
            "join-conversation",
            conversationId
          );
        }
      };


    socket.on(
      "connect",
      registerSocketUser
    );

    socket.on(
      "reconnect",
      registerSocketUser
    );


    socket.on(
      "connect_error",
      (error) => {

        console.error(
          "ZenvaZapp Socket.IO connection error:",
          error
        );

      }
    );


    // =======================================================
    // NEW MESSAGE
    // =======================================================

    const handleIncomingMessage =
      (incoming) => {

        if (!incoming) {
          return;
        }

        if (
          String(
            incoming.conversationId
          ) !==
          String(
            conversationId
          )
        ) {
          return;
        }

        const formatted =
          formatMessage(
            incoming
          );

        if (!formatted) {
          return;
        }

        setMessages(
          (previous) => {

            const updated =
              mergeMessages(
                previous,
                [formatted]
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );

        scrollToBottom();
      };


    // =======================================================
    // EDITED MESSAGE
    // =======================================================

    const handleEditedMessage =
      (incoming) => {

        if (!incoming) {
          return;
        }

        if (
          String(
            incoming.conversationId
          ) !==
          String(
            conversationId
          )
        ) {
          return;
        }

        const formatted =
          formatMessage(
            incoming
          );

        if (!formatted) {
          return;
        }

        setMessages(
          (previous) => {

            const updated =
              previous.map(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    formatted.id
                  )
                    ? {
                        ...item,
                        ...formatted,
                      }
                    : item
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );
      };


    // =======================================================
    // DELETE FOR EVERYONE
    // =======================================================

    const handleDeletedForEveryone =
      (incoming) => {

        if (!incoming) {
          return;
        }

        if (
          String(
            incoming.conversationId
          ) !==
          String(
            conversationId
          )
        ) {
          return;
        }

        const incomingId =
          incoming._id ||
          incoming.id ||
          incoming.messageId;

        if (!incomingId) {
          return;
        }

        setMessages(
          (previous) => {

            const updated =
              previous.map(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    incomingId
                  )
                    ? {
                        ...item,
                        ...incoming,

                        deletedForEveryone:
                          true,

                        deleted:
                          true,

                        text:
                          "This message was deleted.",
                      }
                    : item
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );
      };


    // =======================================================
    // MESSAGE UNDONE
    // =======================================================

    const handleMessageUndone =
      (incoming) => {

        if (!incoming) {
          return;
        }

        if (
          String(
            incoming.conversationId
          ) !==
          String(
            conversationId
          )
        ) {
          return;
        }

        const formatted =
          formatMessage(
            incoming
          );

        if (!formatted) {
          return;
        }

        setMessages(
          (previous) => {

            const updated =
              previous.map(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    formatted.id
                  )
                    ? {
                        ...item,
                        ...formatted,

                        deleted:
                          false,

                        deletedForEveryone:
                          false,
                      }
                    : item
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );
      };


    // =======================================================
    // MESSAGE DELIVERED
    // =======================================================

    socket.on(
      "message-delivered",
      ({
        messageId,
      } = {}) => {

        if (!messageId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  messageId
                )
                  ? {
                      ...item,

                      status:
                        item.status ===
                        "read"
                          ? "read"
                          : "delivered",
                    }
                  : item
            )
        );
      }
    );


    // =======================================================
    // MESSAGE READ
    // =======================================================

    socket.on(
      "message-read",
      ({
        messageId,
      } = {}) => {

        if (!messageId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  messageId
                )
                  ? {
                      ...item,
                      status:
                        "read",
                    }
                  : item
            )
        );
      }
    );


    // =======================================================
    // SOCKET MESSAGE LISTENERS
    // =======================================================

    socket.on(
      "new-message",
      handleIncomingMessage
    );

    socket.on(
      "message",
      handleIncomingMessage
    );

    socket.on(
      "message-edited",
      handleEditedMessage
    );

    socket.on(
      "message-deleted-for-everyone",
      handleDeletedForEveryone
    );

    socket.on(
      "message-deleted",
      handleDeletedForEveryone
    );

    socket.on(
      "message-undone",
      handleMessageUndone
    );


    // =======================================================
    // REGISTER
    // =======================================================

    registerSocketUser();


    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {

      socket.emit(
        "leave-conversation",
        conversationId
      );

      socket.off(
        "connect",
        registerSocketUser
      );

      socket.off(
        "reconnect",
        registerSocketUser
      );

      socket.off(
        "connect_error"
      );

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
        "message-delivered"
      );

      socket.off(
        "message-read"
      );

      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }

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
  // LOAD MESSAGES FROM MONGODB
  // =========================================================

  useEffect(() => {

    let cancelled =
      false;

    const loadMessages =
      async () => {

        if (
          !conversationId ||
          !currentUserId
        ) {

          setIsLoadingMessages(
            false
          );

          return;
        }

        try {

          if (
            hasCachedMessages
          ) {

            setIsRefreshingMessages(
              true
            );

          } else {

            setIsLoadingMessages(
              true
            );
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
                  .map(
                    (item) =>
                      formatMessage(
                        item
                      )
                  )
                  .filter(Boolean)
              : [];

          setMessages(
            formattedMessages
          );

          setHasCachedMessages(
            formattedMessages.length >
              0
          );

          saveMessageCache(
            formattedMessages
          );


          // =================================================
          // MARK INCOMING MESSAGES DELIVERED
          // =================================================

          const incomingMessages =
            formattedMessages.filter(
              (item) =>
                item.sender ===
                "them"
            );


          for (
            const item of
              incomingMessages
          ) {

            try {

              const responseDelivered =
                await fetch(
                  `${API_URL}/api/messages/${item.id}/delivered`,
                  {
                    method:
                      "PATCH",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body:
                      JSON.stringify(
                        {
                          userId:
                            currentUserId,
                        }
                      ),
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

            } catch (
              error
            ) {

              console.error(
                "Delivered update error:",
                error
              );
            }
          }


          // =================================================
          // MARK INCOMING MESSAGES READ
          // =================================================

          for (
            const item of
              incomingMessages
          ) {

            try {

              const responseRead =
                await fetch(
                  `${API_URL}/api/messages/${item.id}/read`,
                  {
                    method:
                      "PATCH",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body:
                      JSON.stringify(
                        {
                          userId:
                            currentUserId,
                        }
                      ),
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

            } catch (
              error
            ) {

              console.error(
                "Read update error:",
                error
              );
            }
          }


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

        } catch (
          error
        ) {

          if (cancelled) {
            return;
          }

          console.error(
            "Load messages error:",
            error
          );

          if (
            !hasCachedMessages
          ) {

            setSendError(
              `Unable to load messages. ${
                error.message ||
                ""
              }`
            );
          }

        } finally {

          if (!cancelled) {

            setIsLoadingMessages(
              false
            );

            setIsRefreshingMessages(
              false
            );
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


  // =========================================================
  // REMOVE EXPIRED MESSAGES
  // =========================================================

  useEffect(() => {

    if (!messages.length) {
      return undefined;
    }

    const removeExpiredMessages =
      () => {

        const now =
          Date.now();

        setMessages(
          (previous) =>
            previous.filter(
              (item) => {

                if (
                  !item.expiresAt
                ) {
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
                  expiration >
                  now
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

  }, [
    messages.length,
  ]);


  // =========================================================
  // INPUT RESIZE
  // =========================================================

  useEffect(() => {

    resizeMessageInput();

  }, [
    message,
    resizeMessageInput,
  ]);


  // =========================================================
  // EDIT INPUT FOCUS
  // =========================================================

  useEffect(() => {

    if (!editingMessage) {
      return undefined;
    }

    const timer =
      setTimeout(() => {

        resizeEditInput();

        editTextareaRef.current?.focus();

        if (
          editTextareaRef.current
        ) {

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


  // =========================================================
  // SEARCH FOCUS
  // =========================================================

  useEffect(() => {

    if (!showSearch) {
      return undefined;
    }

    const timer =
      setTimeout(() => {

        searchInputRef.current?.focus();

      }, 0);

    return () =>
      clearTimeout(timer);

  }, [
    showSearch,
  ]);


  // =========================================================
  // SCROLL WHEN MESSAGES CHANGE
  // =========================================================

  useEffect(() => {

    if (
      messages.length ||
      isLoadingMessages
    ) {

      scrollToBottom();
    }

  }, [
    messages.length,
    isLoadingMessages,
    scrollToBottom,
  ]);


  // =========================================================
  // UNDO TIMER
  // =========================================================

  useEffect(() => {

    if (!undoMessageId) {
      return undefined;
    }

    if (
      undoSeconds <= 0
    ) {

      setUndoMessageId(
        null
      );

      return undefined;
    }

    const timer =
      setInterval(() => {

        setUndoSeconds(
          (previous) =>
            previous - 1
        );

      }, 1000);

    return () =>
      clearInterval(timer);

  }, [
    undoMessageId,
    undoSeconds,
  ]);


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage =
    async (event) => {

      if (event) {
        event.preventDefault();
      }

      const trimmedMessage =
        message.trim();

      if (!trimmedMessage) {
        return;
      }

      if (
        !currentUserId ||
        !otherUserId ||
        !conversationId
      ) {

        setSendError(
          "Unable to identify this conversation."
        );

        return;
      }

      try {

        setSendError("");

        const milliseconds =
          getDisappearingMilliseconds(
            disappearingDuration
          );

        const createdAt =
          new Date().toISOString();

        const payload = {
          conversationId,

          senderId:
            currentUserId,

          receiverId:
            otherUserId,

          text:
            trimmedMessage,

          messageType:
            "text",

          createdAt,
        };

        if (
          disappearingDuration !==
            "off" &&
          milliseconds
        ) {

          payload.disappearingDuration =
            disappearingDuration;

          payload.expiresAt =
            new Date(
              Date.now() +
                milliseconds
            ).toISOString();
        }

        const response =
          await fetch(
            `${API_URL}/api/messages`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to send message."
          );
        }

        const savedMessage =
          formatMessage(
            data.message ||
              data
          );

        if (!savedMessage) {

          throw new Error(
            "The server returned an invalid message."
          );
        }

        setMessages(
          (previous) => {

            const updated =
              mergeMessages(
                previous,
                [savedMessage]
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );

        setMessage("");

        requestAnimationFrame(() => {
          resizeMessageInput();
        });

        setUndoMessageId(
          savedMessage.id
        );

        setUndoSeconds(5);

        if (
          socketRef.current?.connected
        ) {

          socketRef.current.emit(
            "send-message",
            savedMessage
          );
        }

        scrollToBottom();

      } catch (
        error
      ) {

        console.error(
          "Send message error:",
          error
        );

        setSendError(
          error?.message ||
            "Unable to send message."
        );
      }
    };


  // =========================================================
  // MESSAGE KEYBOARD
  // =========================================================

  const handleMessageKeyDown =
    (event) => {

      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        handleSendMessage();
      }
    };


  // =========================================================
  // EMOJI
  // =========================================================

  const handleEmoji =
    () => {

      setShowEmojiPicker(
        (previous) =>
          !previous
      );
    };


  const addEmoji =
    (emoji) => {

      setMessage(
        (previous) =>
          `${previous}${emoji}`
      );

      setShowEmojiPicker(
        false
      );

      requestAnimationFrame(
        () => {
          textareaRef.current?.focus();
        }
      );
    };


  // =========================================================
  // ATTACHMENT
  // =========================================================

  const handleAttachment =
    () => {

      fileInputRef.current?.click();

    };


  const handleFileChange =
    async (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      console.log(
        "Selected attachment:",
        file.name,
        file.type,
        file.size
      );

      setSendError(
        "File attachment selected. Media upload will be connected to the ZenvaZapp media service."
      );

      event.target.value =
        "";
    };


  // =========================================================
  // CAMERA
  // =========================================================

  const handleCamera =
    async () => {

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video:
                true,

              audio:
                true,
            }
          );

        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        setSendError(
          "Camera access is available. Camera messaging can be connected to the media upload service next."
        );

      } catch (
        error
      ) {

        console.error(
          "Camera access error:",
          error
        );

        setSendError(
          "Camera access was denied or is unavailable."
        );
      }
    };


  // =========================================================
  // VOICE MESSAGE
  // =========================================================

  const handleVoice =
    async () => {

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio:
                true,
            }
          );

        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        setSendError(
          "Microphone access is available. Voice-note upload can be connected to the media service next."
        );

      } catch (
        error
      ) {

        console.error(
          "Microphone access error:",
          error
        );

        setSendError(
          "Microphone access was denied or is unavailable."
        );
      }
    };


  // =========================================================
  // MESSAGE SELECT
  // =========================================================

  const handleMessageSelect =
    (item) => {

      setSelectedMessage(
        item
      );

      setShowMessageMenu(
        true
      );
    };


  // =========================================================
  // COPY MESSAGE
  // =========================================================

  const handleCopyMessage =
    async () => {

      if (
        !selectedMessage ||
        selectedMessage.deleted ||
        selectedMessage.deletedForEveryone
      ) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          selectedMessage.text ||
            ""
        );

      } catch (
        error
      ) {

        console.warn(
          "Copy message failed:",
          error
        );
      }

      closeMessageMenu();
    };


  // =========================================================
  // START EDIT
  // =========================================================

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
        selectedMessage.deleted ||
        selectedMessage.deletedForEveryone
      ) {
        return;
      }

      setEditingMessage({
        ...selectedMessage,

        originalText:
          selectedMessage.text,
      });

      setEditText(
        selectedMessage.text ||
          ""
      );

      closeMessageMenu();
    };


  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit =
    () => {

      setEditingMessage(
        null
      );

      setEditText("");

    };


  // =========================================================
  // EDIT KEYBOARD
  // =========================================================

  const handleEditKeyDown =
    (event) => {

      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        handleSaveEdit();
      }

      if (
        event.key ===
        "Escape"
      ) {

        event.preventDefault();

        handleCancelEdit();
      }
    };


  // =========================================================
  // SAVE EDIT
  // =========================================================

  const handleSaveEdit =
    async () => {

      if (!editingMessage) {
        return;
      }

      const trimmed =
        editText.trim();

      if (!trimmed) {
        return;
      }

      const messageId =
        editingMessage.id;

      try {

        const response =
          await fetch(
            `${API_URL}/api/messages/${encodeURIComponent(
              messageId
            )}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  userId:
                    currentUserId,

                  text:
                    trimmed,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to edit message."
          );
        }

        const updatedMessage =
          formatMessage(
            data.message ||
              data
          );

        setMessages(
          (previous) => {

            const updated =
              previous.map(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    messageId
                  )
                    ? {
                        ...item,

                        ...(updatedMessage ||
                          {}),

                        text:
                          trimmed,

                        edited:
                          true,
                      }
                    : item
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );

        if (
          socketRef.current?.connected
        ) {

          socketRef.current.emit(
            "message-edited",
            {
              ...(updatedMessage ||
                editingMessage),

              id:
                messageId,

              _id:
                messageId,

              conversationId,

              text:
                trimmed,

              edited:
                true,
            }
          );
        }

        handleCancelEdit();

      } catch (
        error
      ) {

        console.error(
          "Edit message error:",
          error
        );

        setSendError(
          error?.message ||
            "Unable to edit message."
        );
      }
    };


  // =========================================================
  // DELETE FOR ME
  // =========================================================

  const handleDeleteForMe =
    async () => {

      if (!selectedMessage) {
        return;
      }

      const messageId =
        selectedMessage.id;

      try {

        const response =
          await fetch(
            `${API_URL}/api/messages/${encodeURIComponent(
              messageId
            )}/delete-for-me`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
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
              "Unable to delete message for you."
          );
        }

        setMessages(
          (previous) =>
            previous.filter(
              (item) =>
                String(
                  item.id
                ) !==
                String(
                  messageId
                )
            )
        );

        saveMessageCache(
          messages.filter(
            (item) =>
              String(
                item.id
              ) !==
              String(
                messageId
              )
          )
        );

        closeMessageMenu();

      } catch (
        error
      ) {

        console.error(
          "Delete for me error:",
          error
        );

        setSendError(
          error?.message ||
            "Unable to delete message for you."
        );
      }
    };


  // =========================================================
  // DELETE FOR EVERYONE
  // =========================================================

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

        const response =
          await fetch(
            `${API_URL}/api/messages/${encodeURIComponent(
              messageId
            )}/delete-for-everyone`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
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
              "Unable to delete message for everyone."
          );
        }

        setMessages(
          (previous) => {

            const updated =
              previous.map(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    messageId
                  )
                    ? {
                        ...item,

                        deleted:
                          true,

                        deletedForEveryone:
                          true,

                        text:
                          "This message was deleted.",
                      }
                    : item
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );

        if (
          socketRef.current?.connected
        ) {

          socketRef.current.emit(
            "message-deleted-for-everyone",
            {
              ...selectedMessage,

              id:
                messageId,

              _id:
                messageId,

              conversationId,

              deleted:
                true,

              deletedForEveryone:
                true,

              text:
                "This message was deleted.",
            }
          );
        }

        closeMessageMenu();

      } catch (
        error
      ) {

        console.error(
          "Delete for everyone error:",
          error
        );

        setSendError(
          error?.message ||
            "Unable to delete message for everyone."
        );
      }
    };


  // =========================================================
  // UNDO MESSAGE
  // =========================================================

  const handleUndoMessage =
    async () => {

      if (!undoMessageId) {
        return;
      }

      const messageId =
        undoMessageId;

      try {

        const response =
          await fetch(
            `${API_URL}/api/messages/${encodeURIComponent(
              messageId
            )}/undo`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
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
              "Unable to undo message."
          );
        }

        const restored =
          formatMessage(
            data.message ||
              data
          );

        setMessages(
          (previous) => {

            const updated =
              previous.map(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    messageId
                  )
                    ? {
                        ...item,

                        ...(restored ||
                          {}),

                        deleted:
                          false,

                        deletedForEveryone:
                          false,
                      }
                    : item
              );

            saveMessageCache(
              updated
            );

            return updated;
          }
        );

        if (
          socketRef.current?.connected
        ) {

          socketRef.current.emit(
            "message-undone",
            {
              ...(restored ||
                {}),

              id:
                messageId,

              _id:
                messageId,

              conversationId,

              deleted:
                false,

              deletedForEveryone:
                false,
            }
          );
        }

        setUndoMessageId(
          null
        );

        setUndoSeconds(
          0
        );

      } catch (
        error
      ) {

        console.error(
          "Undo message error:",
          error
        );

        setSendError(
          error?.message ||
            "Unable to undo message."
        );
      }
    };


  // =========================================================
  // DELETE CONVERSATION
  // =========================================================

  const handleConfirmDeleteConversation =
    async () => {

      if (
        !currentUserId ||
        !conversationId
      ) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/api/conversations/${encodeURIComponent(
              conversationId
            )}`,
            {
              method:
                "DELETE",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
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
              "Unable to delete conversation."
          );
        }

        if (
          messageCacheKey
        ) {

          try {

            localStorage.removeItem(
              messageCacheKey
            );

          } catch (
            error
          ) {

            console.warn(
              "Unable to remove conversation cache:",
              error
            );
          }
        }

        setMessages([]);

        setShowDeleteMenu(
          false
        );

        onBack?.();

      } catch (
        error
      ) {

        console.error(
          "Delete conversation error:",
          error
        );

        setSendError(
          error?.message ||
            "Unable to delete conversation."
        );
      }
    };


  // =========================================================
  // OPEN DISAPPEARING SETTINGS
  // =========================================================

  const handleOpenDisappearing =
    () => {

      onOpenDisappearingSettings?.(
        chat,
        {
          duration:
            disappearingDuration,
        }
      );
    };


  // =========================================================
  // SEARCH
  // =========================================================

  const visibleMessages =
    messages.filter(
      (item) => {

        if (!showSearch) {
          return true;
        }

        const query =
          searchQuery
            .toLowerCase()
            .trim();

        if (!query) {
          return true;
        }

        return String(
          item.text ||
            ""
        )
          .toLowerCase()
          .includes(query);
      }
    );


  // =========================================================
  // AVATAR HELPERS
  // =========================================================


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="private-chat-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header
        className="private-chat-header"
      >

        <div
          className="private-chat-header-left"
        >

          <button
            type="button"
            className="private-chat-back"
            onClick={() => {
              onBack?.();
            }}
            aria-label="Back"
          >
            ←
          </button>


          <div
            className="private-chat-header-avatar"
          >

            {chat?.profilePhoto ? (

              <img
                src={
                  chat.profilePhoto
                }
                alt={
                  chatName
                }
              />

            ) : (

              chatAvatar

            )}

          </div>


          <div
            className="private-chat-header-info"
          >

            <h1>
              {chatName}
            </h1>

            <span>
              Online
            </span>

          </div>

        </div>


        {/* =================================
            CALL BUTTONS
            =================================
            
            These buttons DO NOT start WebRTC.

            They hand the call to App.js,
            which hands it to CallManager.
        */}

        <div
          className="private-chat-header-actions"
        >

          <button
            type="button"
            className="private-chat-header-call"
            onClick={() =>
              onCall?.(chat)
            }
            aria-label="Voice call"
            title="Voice call"
          >
            📞
          </button>


          <button
            type="button"
            className="private-chat-header-call"
            onClick={() =>
              onVideoCall?.(chat)
            }
            aria-label="Video call"
            title="Video call"
          >
            🎥
          </button>


          <button
            type="button"
            className="private-chat-header-more"
            onClick={() =>
              setShowChatMenu(
                (previous) =>
                  !previous
              )
            }
            aria-label="More options"
          >
            ⋮
          </button>

        </div>

      </header>


      {/* =====================================
          CHAT MENU
      ===================================== */}

      {showChatMenu && (

        <div
          className="private-chat-menu-overlay"
          onClick={() =>
            setShowChatMenu(false)
          }
        >

          <div
            className="private-chat-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() => {

                setShowChatMenu(
                  false
                );

                setShowSearch(
                  true
                );
              }}
            >
              🔍 Search messages
            </button>


            <button
              type="button"
              onClick={() => {

                setShowChatMenu(
                  false
                );

                handleOpenDisappearing();
              }}
            >
              ◷ Disappearing messages
            </button>


            <button
              type="button"
              onClick={() => {

                setShowChatMenu(
                  false
                );

                setShowDeleteMenu(
                  true
                );
              }}
            >
              🗑 Delete conversation
            </button>

          </div>

        </div>

      )}


      {/* =====================================
          SEARCH BAR
      ===================================== */}

      {showSearch && (

        <section
          className="private-chat-search"
        >

          <div
            className="private-chat-search-box"
          >

            <span>
              🔍
            </span>


            <input
              ref={
                searchInputRef
              }
              type="text"
              value={
                searchQuery
              }
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search messages..."
              aria-label="Search messages"
            />


            {searchQuery && (

              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                aria-label="Clear search"
              >
                ×
              </button>

            )}


            <button
              type="button"
              onClick={() => {

                setSearchQuery(
                  ""
                );

                setShowSearch(
                  false
                );
              }}
              aria-label="Close search"
            >
              ✕
            </button>

          </div>

        </section>

      )}


      {/* =====================================
          UNDO BAR
      ===================================== */}

      {undoMessageId && (
        <div
          className="private-chat-undo-bar"
        >

          <span>
            Message sent
          </span>

          <span>
            {undoSeconds}s
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

              <h3>
                Message
              </h3>


              {!selectedMessage.deleted &&
                !selectedMessage.deletedForEveryone && (

                  <button
                    type="button"
                    onClick={
                      handleCopyMessage
                    }
                  >
                    📋 Copy
                  </button>

                )}


              {selectedMessage.sender ===
                "me" &&
                !selectedMessage.deleted &&
                !selectedMessage.deletedForEveryone && (

                  <button
                    type="button"
                    onClick={
                      handleStartEdit
                    }
                  >
                    ✏️ Edit
                  </button>

                )}


              <button
                type="button"
                onClick={
                  handleDeleteForMe
                }
              >
                🗑 Delete for me
              </button>


              {selectedMessage.sender ===
                "me" &&
                !selectedMessage.deleted &&
                !selectedMessage.deletedForEveryone && (

                  <button
                    type="button"
                    onClick={
                      handleDeleteForEveryone
                    }
                  >
                    🗑 Delete for everyone
                  </button>

                )}


              <button
                type="button"
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
          EDIT MODE
      ===================================== */}

      {editingMessage && (

        <div
          className="edit-message-bar"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          <div
            className="edit-message-indicator"
          >

            <span
              className="edit-message-line"
            />

            <div
              className="edit-message-info"
            >

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
          HIDDEN FILE INPUT
      ===================================== */}

      <input
        ref={
          fileInputRef
        }
        type="file"
        hidden
        onChange={
          handleFileChange
        }
      />


      {/* =====================================
          MESSAGE AREA
      ===================================== */}

      <main
        className="private-chat-messages"
      >

        {isRefreshingMessages && (

          <div
            className="private-chat-refreshing"
          >
            Updating messages...
          </div>

        )}


        {sendError && (

          <div
            className="private-chat-error"
          >

            <span>
              {sendError}
            </span>

            <button
              type="button"
              onClick={() =>
                setSendError("")
              }
              aria-label="Dismiss error"
            >
              ×
            </button>

          </div>

        )}


        {isLoadingMessages &&
        !hasCachedMessages ? (

          <div
            className="private-chat-loading"
          >

            <div
              className="private-chat-spinner"
            />

            <h2>
              Loading messages...
            </h2>

            <p>
              Connecting to your conversation.
            </p>

          </div>

        ) : visibleMessages.length ===
          0 ? (

          <div
            className="private-chat-empty"
          >

            <div
              className="private-chat-empty-icon"
            >
              {showSearch
                ? "⌕"
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
                key={
                  item.id
                }
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


                  <div
                    className="message-meta"
                  >

                    {item.edited && (

                      <span
                        className="message-edited-label"
                      >
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
          ref={
            messageEndRef
          }
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
          ].map(
            (emoji) => (

              <button
                key={
                  emoji
                }
                type="button"
                className="emoji-btn"
                onClick={() =>
                  addEmoji(
                    emoji
                  )
                }
              >
                {emoji}
              </button>

            )
          )}

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
              <span
                className="composer-symbol"
              >
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
              <span
                className="attachment-icon"
              >
                +
              </span>
            </button>

          )}


          <div
            className="message-textarea-wrapper"
          >

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
              <span
                className="camera-icon"
              >
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
              <span
                className="send-arrow"
              >
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
              <span
                className="voice-microphone-icon"
              >
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