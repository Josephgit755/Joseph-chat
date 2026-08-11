import { useEffect, useRef, useState } from "react";
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

  // ==========================================
  // API URL
  // ==========================================

  const API_URL = "http://localhost:5000";

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
  // DEBUG INFORMATION
  // ==========================================

  useEffect(() => {
    console.log("========== ZENVAZAPP CHAT DEBUG ==========");
    console.log("API URL:", API_URL);
    console.log("Current user:", user);
    console.log("Current user ID:", currentUserId);
    console.log("Selected chat:", chat);
    console.log("Other user ID:", otherUserId);
    console.log("Conversation ID:", conversationId);
    console.log("==========================================");
  }, [
    user,
    chat,
    currentUserId,
    otherUserId,
    conversationId,
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

        const response = await fetch(url);

        console.log(
          "Load messages status:",
          response.status
        );

        const data = await response.json();

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
          (data.messages || []).map((item) => ({
            ...item,

            id: item._id,

            sender:
              String(item.senderId) ===
              String(currentUserId)
                ? "me"
                : "them",

            text:
              item.deletedForSender &&
              String(item.senderId) ===
                String(currentUserId)
                ? "This message was deleted."
                : item.deletedForReceiver &&
                  String(item.senderId) !==
                    String(currentUserId)
                ? "This message was deleted."
                : item.text,

            time: new Date(
              item.createdAt
            ).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
          }));

        setMessages(formattedMessages);
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
  ]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
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
      const response = await fetch(
        `${API_URL}/api/messages`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
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

      const data = await response.json();

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

      const savedMessage = data.message;

      const formattedMessage = {
        ...savedMessage,

        id: savedMessage._id,

        sender: "me",

        text: savedMessage.text,

        time: new Date(
          savedMessage.createdAt
        ).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setMessages((previous) => [
        ...previous,
        formattedMessage,
      ]);

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

  const handleMessageSelect = (item) => {
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

  const handleUndoMessage = async () => {
    if (!undoMessageId) {
      return;
    }

    setMessages((previous) =>
      previous.filter(
        (item) =>
          item.id !== undoMessageId
      )
    );

    setUndoMessageId(null);

    setUndoSeconds(0);

    closeMessageMenu();
  };

  // ==========================================
  // DELETE FOR ME
  // ==========================================

  const handleDeleteForMe = async () => {
    if (!selectedMessage) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${selectedMessage.id}/delete-for-me`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
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
            item.id !== selectedMessage.id
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
        const response = await fetch(
          `${API_URL}/api/messages/${selectedMessage.id}/delete-for-everyone`,
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

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete message."
          );
        }

        setMessages((previous) =>
          previous.map((item) =>
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
  };

  // ==========================================
  // VOICE
  // ==========================================

  const handleVoice = () => {
    alert(
      "Voice recording will be connected to ZenvaZapp calls."
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
  // DELETE CHAT
  // ==========================================

  const handleDeleteChat = () => {
    setShowDeleteMenu(true);
  };

  // ==========================================
  // CLOSE MENUS
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
  // RENDER
  // ==========================================

  return (
    <div
      className="private-chat-page"
      onClick={handlePageClick}
    >
      {/* HEADER */}

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
              onCall?.(chat)
            }
            aria-label="Voice call"
          >
            📞
          </button>

          <button
            type="button"
            onClick={() =>
              onVideoCall?.(chat)
            }
            aria-label="Video call"
          >
            📹
          </button>

          <div className="chat-more-container">
            <button
              type="button"
              onClick={
                handleChatMenuToggle
              }
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

                    alert(
                      "Search in chat will be connected later."
                    );
                  }}
                >
                  🔍 Search in chat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);

                    alert(
                      "Chat notifications settings will be added later."
                    );
                  }}
                >
                  🔔 Notifications
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatMenu(false);

                    alert(
                      "Contact information will be added later."
                    );
                  }}
                >
                  👤 Contact info
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteChat
                  }
                >
                  🗑️ Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ERROR */}

      {sendError && (
        <div className="private-chat-error">
          {sendError}
        </div>
      )}

      {/* CHAT AREA */}

      <main
        className="private-chat-messages"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="chat-date-divider">
          <span>Today</span>
        </div>

        {isLoadingMessages ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">
              💬
            </div>

            <h2>
              Loading messages...
            </h2>

            <p>
              Please wait.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="private-chat-empty">
            <div className="private-chat-empty-icon">
              💬
            </div>

            <h2>No messages</h2>

            <p>
              Start the conversation by
              sending a message.
            </p>
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
                onClick={() =>
                  handleMessageSelect(item)
                }
              >
                <p>{item.text}</p>

                <div className="message-meta">
                  <span>
                    {item.time}
                  </span>

                  {item.sender ===
                    "me" && (
                    <span
                      className={`message-status ${
                        item.status
                      }`}
                    >
                      {item.status ===
                      "read"
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

      {/* MESSAGE ACTION MENU */}

      {showMessageMenu &&
        selectedMessage && (
          <div
            className="message-action-overlay"
            onClick={
              closeMessageMenu
            }
          >
            <div
              className="message-action-panel"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="message-action-preview">
                <span>
                  {selectedMessage.text}
                </span>
              </div>

              <div className="message-action-buttons">
                {selectedMessage.id ===
                  undoMessageId &&
                  undoSeconds > 0 && (
                    <button
                      type="button"
                      className="message-action-undo"
                      onClick={
                        handleUndoMessage
                      }
                    >
                      ↩️ Undo message

                      <small>
                        {undoSeconds}s
                      </small>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      selectedMessage.text
                    );

                    closeMessageMenu();
                  }}
                >
                  📋 Copy
                </button>

                <button
                  type="button"
                  onClick={() => {
                    alert(
                      "Reply will be connected later."
                    );

                    closeMessageMenu();
                  }}
                >
                  ↩️ Reply
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteForMe
                  }
                >
                  🗑️ Delete for me
                </button>

                {selectedMessage.sender ===
                  "me" && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowDeleteMenu(
                        true
                      )
                    }
                  >
                    🗑️ Delete for everyone
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
          </div>
        )}

      {/* DELETE CONFIRMATION */}

      {showDeleteMenu && (
        <div
          className="delete-dialog-overlay"
          onClick={() =>
            setShowDeleteMenu(false)
          }
        >
          <div
            className="delete-dialog"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-dialog-icon">
              🗑️
            </div>

            <h2>
              Delete
              {selectedMessage
                ? " message"
                : " conversation"}
              ?
            </h2>

            <p>
              Choose how you want to
              delete this content.
            </p>

            <div className="delete-dialog-options">
              {selectedMessage ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleDeleteForMe();

                      setShowDeleteMenu(
                        false
                      );
                    }}
                  >
                    <strong>
                      Delete for me
                    </strong>

                    <span>
                      Remove it only from
                      your chat.
                    </span>
                  </button>

                  {selectedMessage.sender ===
                    "me" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleDeleteForEveryone();

                        setShowDeleteMenu(
                          false
                        );
                      }}
                    >
                      <strong>
                        Delete for everyone
                      </strong>

                      <span>
                        Remove it from
                        everyone's chat.
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteMenu(false);

                      alert(
                        "Delete conversation for me will be connected to the backend."
                      );
                    }}
                  >
                    <strong>
                      Delete for me
                    </strong>

                    <span>
                      Remove this conversation
                      from your chat list.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteMenu(false);

                      alert(
                        "Delete conversation for everyone will be connected to the backend."
                      );
                    }}
                  >
                    <strong>
                      Delete for everyone
                    </strong>

                    <span>
                      Delete the conversation
                      for everyone where permitted.
                    </span>
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              className="delete-dialog-cancel"
              onClick={() =>
                setShowDeleteMenu(false)
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* UNDO BAR */}

      {undoMessageId &&
        undoSeconds > 0 && (
          <div className="undo-message-bar">
            <span>Message sent</span>

            <strong>
              {undoSeconds}s
            </strong>

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

      {/* EMOJI PICKER */}

      {showEmojiPicker && (
        <div
          className="emoji-picker"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {[
            "😀",
            "😂",
            "❤️",
            "👍",
            "🙏",
            "😊",
            "🔥",
            "🎉",
          ].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                addEmoji(emoji)
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* MESSAGE COMPOSER */}

      <div className="private-chat-composer-wrapper">
        <form
          className="private-chat-composer"
          onSubmit={
            handleSendMessage
          }
        >
          <button
            type="button"
            className="composer-icon-button"
            onClick={
              handleAttachment
            }
            aria-label="Attach file"
          >
            +
          </button>

          <input
            type="text"
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            placeholder="Type a message..."
            aria-label="Message"
          />

          <button
            type="button"
            className="composer-icon-button"
            onClick={handleEmoji}
            aria-label="Emoji"
          >
            😊
          </button>

          <button
            type="button"
            className="composer-icon-button"
            onClick={handleCamera}
            aria-label="Camera"
          >
            📷
          </button>

          {message.trim() ? (
            <button
              type="submit"
              className="composer-send-button"
              aria-label="Send message"
            >
              ➤
            </button>
          ) : (
            <button
              type="button"
              className="composer-icon-button"
              onClick={handleVoice}
              aria-label="Voice message"
            >
              🎤
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default PrivateChat;