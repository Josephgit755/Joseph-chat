import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import "./private-chat.css";

function PrivateChat({
  chat,
  user,
  onBack,
  onCall,
  onVideoCall,
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [isLoadingMessages, setIsLoadingMessages] =
    useState(true);

  const [sendError, setSendError] = useState("");

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [showMessageMenu, setShowMessageMenu] =
    useState(false);

  const [showChatMenu, setShowChatMenu] =
    useState(false);

  const [showDeleteMenu, setShowDeleteMenu] =
    useState(false);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [undoMessageId, setUndoMessageId] =
    useState(null);

  const [undoSeconds, setUndoSeconds] =
    useState(0);

  const messageEndRef = useRef(null);

  const socketRef = useRef(null);

  // ==========================================
  // API URL
  // ==========================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // SOCKET.IO URL
  // ==========================================

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
  // FORMAT MESSAGE (Wrapped in useCallback)
  // ==========================================

  const formatMessage = useCallback((item) => {
    const senderIsCurrentUser =
      String(item.senderId) ===
      String(currentUserId);

    let displayText = item.text;

    if (
      item.deletedForSender &&
      senderIsCurrentUser
    ) {
      displayText =
        "This message was deleted.";
    }

    if (
      item.deletedForReceiver &&
      !senderIsCurrentUser
    ) {
      displayText =
        "This message was deleted.";
    }

    return {
      ...item,

      id: item._id || item.id,

      sender: senderIsCurrentUser
        ? "me"
        : "them",

      text: displayText,

      time: item.createdAt
        ? new Date(
            item.createdAt
          ).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : new Date().toLocaleTimeString(
            [],
            {
              hour: "numeric",
              minute: "2-digit",
            }
          ),
    };
  }, [currentUserId]);

  // ==========================================
  // DEBUG INFORMATION
  // ==========================================

  useEffect(() => {
    console.log(
      "========== ZENVAZAPP CHAT DEBUG =========="
    );

    console.log(
      "API URL:",
      API_URL
    );

    console.log(
      "Socket URL:",
      SOCKET_URL
    );

    console.log(
      "Current user:",
      user
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
      "Other user ID:",
      otherUserId
    );

    console.log(
      "Conversation ID:",
      conversationId
    );

    console.log(
      "=========================================="
    );
  }, [
    API_URL,
    SOCKET_URL,
    user,
    chat,
    currentUserId,
    otherUserId,
    conversationId,
  ]);

  // ==========================================
  // SOCKET.IO CONNECTION
  // ==========================================

  useEffect(() => {
    if (
      !conversationId ||
      !currentUserId
    ) {
      console.log(
        "Socket connection skipped: missing conversation or user ID."
      );

      return;
    }

    console.log(
      "Connecting to ZenvaZapp Socket.IO:",
      SOCKET_URL
    );

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

      console.log(
        "Joined conversation:",
        conversationId
      );
    });

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "ZenvaZapp Socket.IO connection error:",
          error
        );
      }
    );

    socket.on(
      "new-message",
      (incomingMessage) => {
        console.log("🔥 NEW MESSAGE EVENT RECEIVED IN THIS BROWSER");
        console.log("Incoming message:", incomingMessage);
        console.log("This browser conversationId:", conversationId);
        console.log(
          "Incoming conversationId:",
          incomingMessage?.conversationId
        );

        if (
          !incomingMessage ||
          !incomingMessage._id
        ) {
          console.log(
            "Ignoring invalid real-time message."
          );

          return;
        }

        if (
          String(
            incomingMessage.conversationId
          ) !== String(conversationId)
        ) {
          console.log(
            "Ignoring message from another conversation."
          );

          return;
        }

        const formattedMessage =
          formatMessage(
            incomingMessage
          );

        setMessages(
          (previous) => {
            const alreadyExists =
              previous.some(
                (item) =>
                  String(item.id) ===
                  String(
                    formattedMessage.id
                  )
              );

            if (alreadyExists) {
              return previous;
            }

            return [
              ...previous,
              formattedMessage,
            ];
          }
        );

        if (
          String(
            incomingMessage.senderId
          ) !== String(currentUserId)
        ) {
          socket.emit(
            "message-delivered",
            {
              conversationId,
              messageId:
                incomingMessage._id,
            }
          );

          console.log(
            "Sent delivered event:",
            incomingMessage._id
          );

          socket.emit(
            "message-read",
            {
              conversationId,
              messageId:
                incomingMessage._id,
            }
          );

          console.log(
            "Sent read event:",
            incomingMessage._id
          );
        }
      }
    );

    socket.on(
      "message-delivered",
      ({
        messageId,
      }) => {
        if (!messageId) {
          return;
        }

        console.log(
          "Message delivered:",
          messageId
        );

        setMessages(
          (previous) =>
            previous.map(
              (item) =>
                String(item.id) ===
                String(messageId)
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

    socket.on(
      "message-read",
      ({
        messageId,
      }) => {
        if (!messageId) {
          return;
        }

        console.log(
          "Message read:",
          messageId
        );

        setMessages(
          (previous) =>
            previous.map(
              (item) =>
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
      console.log(
        "Leaving conversation:",
        conversationId
      );

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
  ]);

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        console.log(
          "No conversation ID available."
        );

        setIsLoadingMessages(false);

        return;
      }

      if (!currentUserId) {
        console.log(
          "No current user ID available."
        );

        setIsLoadingMessages(false);

        return;
      }

      try {
        setIsLoadingMessages(true);
        setSendError("");

        const url =
          `${API_URL}/api/messages/${encodeURIComponent(
            conversationId
          )}`;

        console.log(
          "Loading messages from:",
          url
        );

        const response =
          await fetch(url);

        console.log(
          "Load messages status:",
          response.status
        );

        const data =
          await response.json();

        console.log(
          "Load messages response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load messages."
          );
        }

        const formattedMessages =
          (data.messages || []).map(
            (item) =>
              formatMessage(item)
          );

        setMessages(
          formattedMessages
        );

        const incomingMessages =
          formattedMessages.filter(
            (item) =>
              item.sender === "them" &&
              item.status !== "read"
          );

        for (
          const item of
          incomingMessages
        ) {
          try {
            const deliveredResponse =
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

            const deliveredData =
              await deliveredResponse.json();

            console.log(
              "Message delivered response:",
              deliveredData
            );

            if (
              deliveredResponse.ok
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
              "Mark message delivered error:",
              error
            );
          }
        }

        for (
          const item of
          incomingMessages
        ) {
          try {
            const readResponse =
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

            const readData =
              await readResponse.json();

            console.log(
              "Message read response:",
              readData
            );

            if (readResponse.ok) {
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
              "Mark message read error:",
              error
            );
          }
        }

        setMessages(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item.sender ===
                  "them"
                ) {
                  return {
                    ...item,
                    status:
                      "read",
                  };
                }

                return item;
              }
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
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messageEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

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

  const handleSendMessage = async (
    event
  ) => {
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

      console.error(
        "Cannot send message: currentUserId is missing."
      );

      return;
    }

    if (!otherUserId) {
      setSendError(
        "The selected contact could not be identified."
      );

      console.error(
        "Cannot send message: otherUserId is missing."
      );

      return;
    }

    if (!conversationId) {
      setSendError(
        "Conversation could not be identified."
      );

      console.error(
        "Cannot send message: conversationId is missing."
      );

      return;
    }

    setSendError("");

    const messageToSend = {
      conversationId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text: trimmedMessage,
      messageType: "text",
    };

    console.log(
      "Sending message:",
      messageToSend
    );

    try {
      const response =
        await fetch(
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

      console.log(
        "Send message status:",
        response.status
      );

      const data =
        await response.json();

      console.log(
        "Send message response:",
        data
      );

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

      const savedMessage =
        data.message;

      const formattedMessage =
        formatMessage(
          savedMessage
        );

      setMessages(
        (previous) => {
          const alreadyExists =
            previous.some(
              (item) =>
                String(item.id) ===
                String(
                  formattedMessage.id
                )
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            ...previous,
            formattedMessage,
          ];
        }
      );

      if (
        socketRef.current?.connected
      ) {
        socketRef.current.emit(
          "send-message",
          savedMessage
        );

        console.log(
          "Message sent through Socket.IO:",
          savedMessage
        );
      } else {
        console.warn(
          "Socket.IO is not connected. Message was saved to MongoDB but not broadcast in real time."
        );
      }

      setMessage("");

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

  const handleMessageSelect = (
    item
  ) => {
    setSelectedMessage(item);

    setShowMessageMenu(true);

    setShowChatMenu(false);

    setShowDeleteMenu(false);
  };

  // ==========================================
  // CLOSE MESSAGE MENU
  // ==========================================

  const closeMessageMenu = () => {
    setSelectedMessage(null);

    setShowMessageMenu(false);
  };

  // ==========================================
  // UNDO MESSAGE
  // ==========================================

  const handleUndoMessage =
    async () => {
      if (!undoMessageId) {
        return;
      }

      setMessages(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              undoMessageId
          )
      );

      setUndoMessageId(null);

      setUndoSeconds(0);

      closeMessageMenu();
    };

  // ==========================================
  // DELETE FOR ME
  // ==========================================

  const handleDeleteForMe =
    async () => {
      if (!selectedMessage) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/messages/${selectedMessage.id}/delete-for-me`,
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
                item.id !==
                selectedMessage.id
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

      try {
        const response =
          await fetch(
            `${API_URL}/api/messages/${selectedMessage.id}/delete-for-everyone`,
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
            previous.map(
              (item) =>
                item.id ===
                selectedMessage.id
                  ? {
                      ...item,
                      text:
                        "This message was deleted.",
                    }
                  : item
            )
        );

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
  // ATTACHMENT / CAMERA / EMOJI / VOICE
  // ==========================================

  const handleAttachment = () => {
    alert("Attachments will be connected to Smart Files.");
  };

  const handleCamera = () => {
    alert("Camera will be connected to the ZenvaZapp media system.");
  };

  const handleEmoji = () => {
    setShowEmojiPicker((previous) => !previous);
  };

  const addEmoji = (emoji) => {
    setMessage((previous) => `${previous}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleVoice = () => {
    alert("Voice recording will be connected to ZenvaZapp calls.");
  };

  // ==========================================
  // CHAT MENU & DELETE
  // ==========================================

  const handleChatMenuToggle = () => {
    setShowChatMenu((previous) => !previous);
    setShowDeleteMenu(false);
    setShowMessageMenu(false);
  };

  const handleDeleteChat = () => {
    setShowDeleteMenu(true);
  };

  const handlePageClick = () => {
    if (showMessageMenu) closeMessageMenu();
    if (showChatMenu) setShowChatMenu(false);
    if (showDeleteMenu) setShowDeleteMenu(false);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="private-chat-page" onClick={handlePageClick}>
      {/* HEADER */}
      <header
        className="private-chat-header"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="private-chat-back"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <button type="button" className="private-chat-contact">
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
            onClick={() => onCall?.(chat)}
            aria-label="Voice call"
          >
            📞
          </button>

          <button
            type="button"
            onClick={() => onVideoCall?.(chat)}
            aria-label="Video call"
          >
            📹
          </button>

          <div className="chat-more-container">
            <button
              type="button"
              onClick={handleChatMenuToggle}
              aria-label="More options"
            >
              ⋮
            </button>

            {showChatMenu && (
              <div className="chat-more-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);
                    alert("Search in chat will be connected later.");
                  }}
                >
                  🔍 Search in chat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);
                    alert("Chat notifications settings will be added later.");
                  }}
                >
                  🔔 Notifications
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);
                    alert("Contact information will be added later.");
                  }}
                >
                  👤 Contact info
                </button>

                <button type="button" onClick={handleDeleteChat}>
                  🗑️ Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ERROR */}
      {sendError && <div className="private-chat-error">{sendError}</div>}

      {/* CHAT AREA */}
      <main
        className="private-chat-messages"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-date-divider">
          <span>Today</span>
        </div>

        {isLoadingMessages ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">💬</div>
            <h2>Loading messages...</h2>
            <p>Please wait.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">💬</div>
            <h2>No messages</h2>
            <p>Start the conversation by sending a message.</p>
          </div>
        ) : (
          messages.map((item) => (
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
                onClick={() => handleMessageSelect(item)}
              >
                <p>{item.text}</p>

                <div className="message-meta">
                  <span>{item.time}</span>
                  {item.sender === "me" && (
                    <span className={`message-status ${item.status}`}>
                      {item.status === "read"
                        ? "✓✓"
                        : item.status === "delivered"
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))
        )}

        <div ref={messageEndRef} />
      </main>

      {/* EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <div
          className="emoji-picker-container"
          onClick={(e) => e.stopPropagation()}
        >
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

      {/* UNDO BANNER */}
      {undoMessageId && (
        <div className="undo-banner">
          <span>Message sent ({undoSeconds}s)</span>
          <button type="button" onClick={handleUndoMessage}>
            Undo
          </button>
        </div>
      )}

      {/* MESSAGE ACTION MENU */}
      {showMessageMenu && selectedMessage && (
        <div className="message-action-overlay" onClick={closeMessageMenu}>
          <div
            className="message-action-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={handleDeleteForMe}>
              Delete for me
            </button>
            {selectedMessage.sender === "me" && (
              <button type="button" onClick={handleDeleteForEveryone}>
                Delete for everyone
              </button>
            )}
            <button type="button" onClick={closeMessageMenu}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONVERSATION MENU */}
      {showDeleteMenu && (
        <div
          className="message-action-overlay"
          onClick={() => setShowDeleteMenu(false)}
        >
          <div
            className="message-action-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete entire conversation?</h3>
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
              onClick={() => setShowDeleteMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FOOTER / INPUT BAR */}
      <footer
        className="private-chat-footer"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSendMessage} className="private-chat-input-form">
          <button
            type="button"
            className="chat-action-btn"
            onClick={handleEmoji}
            aria-label="Add Emoji"
          >
            😊
          </button>

          <button
            type="button"
            className="chat-action-btn"
            onClick={handleAttachment}
            aria-label="Attach File"
          >
            📎
          </button>

          <input
            type="text"
            className="private-chat-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="button"
            className="chat-action-btn"
            onClick={handleCamera}
            aria-label="Open Camera"
          >
            📷
          </button>

          {message.trim() ? (
            <button
              type="submit"
              className="chat-send-btn"
              aria-label="Send Message"
            >
              ➔
            </button>
          ) : (
            <button
              type="button"
              className="chat-action-btn"
              onClick={handleVoice}
              aria-label="Record Voice"
            >
              🎙️
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}

export default PrivateChat;import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import "./private-chat.css";

function PrivateChat({
  chat,
  user,
  onBack,
  onCall,
  onVideoCall,
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [isLoadingMessages, setIsLoadingMessages] =
    useState(true);

  const [sendError, setSendError] = useState("");

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [showMessageMenu, setShowMessageMenu] =
    useState(false);

  const [showChatMenu, setShowChatMenu] =
    useState(false);

  const [showDeleteMenu, setShowDeleteMenu] =
    useState(false);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [undoMessageId, setUndoMessageId] =
    useState(null);

  const [undoSeconds, setUndoSeconds] =
    useState(0);

  const messageEndRef = useRef(null);

  const socketRef = useRef(null);

  // ==========================================
  // API URL
  // ==========================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // ==========================================
  // SOCKET.IO URL
  // ==========================================

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
  // FORMAT MESSAGE (Wrapped in useCallback)
  // ==========================================

  const formatMessage = useCallback((item) => {
    const senderIsCurrentUser =
      String(item.senderId) ===
      String(currentUserId);

    let displayText = item.text;

    if (
      item.deletedForSender &&
      senderIsCurrentUser
    ) {
      displayText =
        "This message was deleted.";
    }

    if (
      item.deletedForReceiver &&
      !senderIsCurrentUser
    ) {
      displayText =
        "This message was deleted.";
    }

    return {
      ...item,

      id: item._id || item.id,

      sender: senderIsCurrentUser
        ? "me"
        : "them",

      text: displayText,

      time: item.createdAt
        ? new Date(
            item.createdAt
          ).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : new Date().toLocaleTimeString(
            [],
            {
              hour: "numeric",
              minute: "2-digit",
            }
          ),
    };
  }, [currentUserId]);

  // ==========================================
  // DEBUG INFORMATION
  // ==========================================

  useEffect(() => {
    console.log(
      "========== ZENVAZAPP CHAT DEBUG =========="
    );

    console.log(
      "API URL:",
      API_URL
    );

    console.log(
      "Socket URL:",
      SOCKET_URL
    );

    console.log(
      "Current user:",
      user
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
      "Other user ID:",
      otherUserId
    );

    console.log(
      "Conversation ID:",
      conversationId
    );

    console.log(
      "=========================================="
    );
  }, [
    API_URL,
    SOCKET_URL,
    user,
    chat,
    currentUserId,
    otherUserId,
    conversationId,
  ]);

  // ==========================================
  // SOCKET.IO CONNECTION
  // ==========================================

  useEffect(() => {
    if (
      !conversationId ||
      !currentUserId
    ) {
      console.log(
        "Socket connection skipped: missing conversation or user ID."
      );

      return;
    }

    console.log(
      "Connecting to ZenvaZapp Socket.IO:",
      SOCKET_URL
    );

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

      console.log(
        "Joined conversation:",
        conversationId
      );
    });

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "ZenvaZapp Socket.IO connection error:",
          error
        );
      }
    );

    socket.on(
      "new-message",
      (incomingMessage) => {
        console.log("🔥 NEW MESSAGE EVENT RECEIVED IN THIS BROWSER");
        console.log("Incoming message:", incomingMessage);
        console.log("This browser conversationId:", conversationId);
        console.log(
          "Incoming conversationId:",
          incomingMessage?.conversationId
        );

        if (
          !incomingMessage ||
          !incomingMessage._id
        ) {
          console.log(
            "Ignoring invalid real-time message."
          );

          return;
        }

        if (
          String(
            incomingMessage.conversationId
          ) !== String(conversationId)
        ) {
          console.log(
            "Ignoring message from another conversation."
          );

          return;
        }

        const formattedMessage =
          formatMessage(
            incomingMessage
          );

        setMessages(
          (previous) => {
            const alreadyExists =
              previous.some(
                (item) =>
                  String(item.id) ===
                  String(
                    formattedMessage.id
                  )
              );

            if (alreadyExists) {
              return previous;
            }

            return [
              ...previous,
              formattedMessage,
            ];
          }
        );

        if (
          String(
            incomingMessage.senderId
          ) !== String(currentUserId)
        ) {
          socket.emit(
            "message-delivered",
            {
              conversationId,
              messageId:
                incomingMessage._id,
            }
          );

          console.log(
            "Sent delivered event:",
            incomingMessage._id
          );

          socket.emit(
            "message-read",
            {
              conversationId,
              messageId:
                incomingMessage._id,
            }
          );

          console.log(
            "Sent read event:",
            incomingMessage._id
          );
        }
      }
    );

    socket.on(
      "message-delivered",
      ({
        messageId,
      }) => {
        if (!messageId) {
          return;
        }

        console.log(
          "Message delivered:",
          messageId
        );

        setMessages(
          (previous) =>
            previous.map(
              (item) =>
                String(item.id) ===
                String(messageId)
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

    socket.on(
      "message-read",
      ({
        messageId,
      }) => {
        if (!messageId) {
          return;
        }

        console.log(
          "Message read:",
          messageId
        );

        setMessages(
          (previous) =>
            previous.map(
              (item) =>
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
      console.log(
        "Leaving conversation:",
        conversationId
      );

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
  ]);

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        console.log(
          "No conversation ID available."
        );

        setIsLoadingMessages(false);

        return;
      }

      if (!currentUserId) {
        console.log(
          "No current user ID available."
        );

        setIsLoadingMessages(false);

        return;
      }

      try {
        setIsLoadingMessages(true);
        setSendError("");

        const url =
          `${API_URL}/api/messages/${encodeURIComponent(
            conversationId
          )}`;

        console.log(
          "Loading messages from:",
          url
        );

        const response =
          await fetch(url);

        console.log(
          "Load messages status:",
          response.status
        );

        const data =
          await response.json();

        console.log(
          "Load messages response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load messages."
          );
        }

        const formattedMessages =
          (data.messages || []).map(
            (item) =>
              formatMessage(item)
          );

        setMessages(
          formattedMessages
        );

        const incomingMessages =
          formattedMessages.filter(
            (item) =>
              item.sender === "them" &&
              item.status !== "read"
          );

        for (
          const item of
          incomingMessages
        ) {
          try {
            const deliveredResponse =
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

            const deliveredData =
              await deliveredResponse.json();

            console.log(
              "Message delivered response:",
              deliveredData
            );

            if (
              deliveredResponse.ok
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
              "Mark message delivered error:",
              error
            );
          }
        }

        for (
          const item of
          incomingMessages
        ) {
          try {
            const readResponse =
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

            const readData =
              await readResponse.json();

            console.log(
              "Message read response:",
              readData
            );

            if (readResponse.ok) {
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
              "Mark message read error:",
              error
            );
          }
        }

        setMessages(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item.sender ===
                  "them"
                ) {
                  return {
                    ...item,
                    status:
                      "read",
                  };
                }

                return item;
              }
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
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messageEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

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

  const handleSendMessage = async (
    event
  ) => {
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

      console.error(
        "Cannot send message: currentUserId is missing."
      );

      return;
    }

    if (!otherUserId) {
      setSendError(
        "The selected contact could not be identified."
      );

      console.error(
        "Cannot send message: otherUserId is missing."
      );

      return;
    }

    if (!conversationId) {
      setSendError(
        "Conversation could not be identified."
      );

      console.error(
        "Cannot send message: conversationId is missing."
      );

      return;
    }

    setSendError("");

    const messageToSend = {
      conversationId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text: trimmedMessage,
      messageType: "text",
    };

    console.log(
      "Sending message:",
      messageToSend
    );

    try {
      const response =
        await fetch(
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

      console.log(
        "Send message status:",
        response.status
      );

      const data =
        await response.json();

      console.log(
        "Send message response:",
        data
      );

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

      const savedMessage =
        data.message;

      const formattedMessage =
        formatMessage(
          savedMessage
        );

      setMessages(
        (previous) => {
          const alreadyExists =
            previous.some(
              (item) =>
                String(item.id) ===
                String(
                  formattedMessage.id
                )
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            ...previous,
            formattedMessage,
          ];
        }
      );

      if (
        socketRef.current?.connected
      ) {
        socketRef.current.emit(
          "send-message",
          savedMessage
        );

        console.log(
          "Message sent through Socket.IO:",
          savedMessage
        );
      } else {
        console.warn(
          "Socket.IO is not connected. Message was saved to MongoDB but not broadcast in real time."
        );
      }

      setMessage("");

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

  const handleMessageSelect = (
    item
  ) => {
    setSelectedMessage(item);

    setShowMessageMenu(true);

    setShowChatMenu(false);

    setShowDeleteMenu(false);
  };

  // ==========================================
  // CLOSE MESSAGE MENU
  // ==========================================

  const closeMessageMenu = () => {
    setSelectedMessage(null);

    setShowMessageMenu(false);
  };

  // ==========================================
  // UNDO MESSAGE
  // ==========================================

  const handleUndoMessage =
    async () => {
      if (!undoMessageId) {
        return;
      }

      setMessages(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              undoMessageId
          )
      );

      setUndoMessageId(null);

      setUndoSeconds(0);

      closeMessageMenu();
    };

  // ==========================================
  // DELETE FOR ME
  // ==========================================

  const handleDeleteForMe =
    async () => {
      if (!selectedMessage) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/messages/${selectedMessage.id}/delete-for-me`,
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
                item.id !==
                selectedMessage.id
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

      try {
        const response =
          await fetch(
            `${API_URL}/api/messages/${selectedMessage.id}/delete-for-everyone`,
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
            previous.map(
              (item) =>
                item.id ===
                selectedMessage.id
                  ? {
                      ...item,
                      text:
                        "This message was deleted.",
                    }
                  : item
            )
        );

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
  // ATTACHMENT / CAMERA / EMOJI / VOICE
  // ==========================================

  const handleAttachment = () => {
    alert("Attachments will be connected to Smart Files.");
  };

  const handleCamera = () => {
    alert("Camera will be connected to the ZenvaZapp media system.");
  };

  const handleEmoji = () => {
    setShowEmojiPicker((previous) => !previous);
  };

  const addEmoji = (emoji) => {
    setMessage((previous) => `${previous}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleVoice = () => {
    alert("Voice recording will be connected to ZenvaZapp calls.");
  };

  // ==========================================
  // CHAT MENU & DELETE
  // ==========================================

  const handleChatMenuToggle = () => {
    setShowChatMenu((previous) => !previous);
    setShowDeleteMenu(false);
    setShowMessageMenu(false);
  };

  const handleDeleteChat = () => {
    setShowDeleteMenu(true);
  };

  const handlePageClick = () => {
    if (showMessageMenu) closeMessageMenu();
    if (showChatMenu) setShowChatMenu(false);
    if (showDeleteMenu) setShowDeleteMenu(false);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="private-chat-page" onClick={handlePageClick}>
      {/* HEADER */}
      <header
        className="private-chat-header"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="private-chat-back"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <button type="button" className="private-chat-contact">
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
            onClick={() => onCall?.(chat)}
            aria-label="Voice call"
          >
            📞
          </button>

          <button
            type="button"
            onClick={() => onVideoCall?.(chat)}
            aria-label="Video call"
          >
            📹
          </button>

          <div className="chat-more-container">
            <button
              type="button"
              onClick={handleChatMenuToggle}
              aria-label="More options"
            >
              ⋮
            </button>

            {showChatMenu && (
              <div className="chat-more-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);
                    alert("Search in chat will be connected later.");
                  }}
                >
                  🔍 Search in chat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);
                    alert("Chat notifications settings will be added later.");
                  }}
                >
                  🔔 Notifications
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);
                    alert("Contact information will be added later.");
                  }}
                >
                  👤 Contact info
                </button>

                <button type="button" onClick={handleDeleteChat}>
                  🗑️ Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ERROR */}
      {sendError && <div className="private-chat-error">{sendError}</div>}

      {/* CHAT AREA */}
      <main
        className="private-chat-messages"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-date-divider">
          <span>Today</span>
        </div>

        {isLoadingMessages ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">💬</div>
            <h2>Loading messages...</h2>
            <p>Please wait.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">💬</div>
            <h2>No messages</h2>
            <p>Start the conversation by sending a message.</p>
          </div>
        ) : (
          messages.map((item) => (
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
                onClick={() => handleMessageSelect(item)}
              >
                <p>{item.text}</p>

                <div className="message-meta">
                  <span>{item.time}</span>
                  {item.sender === "me" && (
                    <span className={`message-status ${item.status}`}>
                      {item.status === "read"
                        ? "✓✓"
                        : item.status === "delivered"
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))
        )}

        <div ref={messageEndRef} />
      </main>

      {/* EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <div
          className="emoji-picker-container"
          onClick={(e) => e.stopPropagation()}
        >
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

      {/* UNDO BANNER */}
      {undoMessageId && (
        <div className="undo-banner">
          <span>Message sent ({undoSeconds}s)</span>
          <button type="button" onClick={handleUndoMessage}>
            Undo
          </button>
        </div>
      )}

      {/* MESSAGE ACTION MENU */}
      {showMessageMenu && selectedMessage && (
        <div className="message-action-overlay" onClick={closeMessageMenu}>
          <div
            className="message-action-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={handleDeleteForMe}>
              Delete for me
            </button>
            {selectedMessage.sender === "me" && (
              <button type="button" onClick={handleDeleteForEveryone}>
                Delete for everyone
              </button>
            )}
            <button type="button" onClick={closeMessageMenu}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONVERSATION MENU */}
      {showDeleteMenu && (
        <div
          className="message-action-overlay"
          onClick={() => setShowDeleteMenu(false)}
        >
          <div
            className="message-action-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete entire conversation?</h3>
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
              onClick={() => setShowDeleteMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FOOTER / INPUT BAR */}
      <footer
        className="private-chat-footer"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSendMessage} className="private-chat-input-form">
          <button
            type="button"
            className="chat-action-btn"
            onClick={handleEmoji}
            aria-label="Add Emoji"
          >
            😊
          </button>

          <button
            type="button"
            className="chat-action-btn"
            onClick={handleAttachment}
            aria-label="Attach File"
          >
            📎
          </button>

          <input
            type="text"
            className="private-chat-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="button"
            className="chat-action-btn"
            onClick={handleCamera}
            aria-label="Open Camera"
          >
            📷
          </button>

          {message.trim() ? (
            <button
              type="submit"
              className="chat-send-btn"
              aria-label="Send Message"
            >
              ➔
            </button>
          ) : (
            <button
              type="button"
              className="chat-action-btn"
              onClick={handleVoice}
              aria-label="Record Voice"
            >
              🎙️
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}

export default PrivateChat;