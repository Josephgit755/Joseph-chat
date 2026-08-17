import {
  useState,
} from "react";

import "./zenva-ai.css";

function ZenvaAI({
  user,
  onBack,
  onNavigate,
}) {
  const [input, setInput] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [selectedAction, setSelectedAction] =
    useState("Ask");

  const actions = [
    {
      id: "Ask",
      icon: "💬",
      title: "Ask Zenva AI",
      description:
        "Ask questions and get help with your content.",
    },
    {
      id: "Summarize",
      icon: "📝",
      title: "Summarize",
      description:
        "Turn long text into a shorter explanation.",
    },
    {
      id: "Rewrite",
      icon: "✍️",
      title: "Rewrite",
      description:
        "Make your text clearer, shorter or more professional.",
    },
    {
      id: "Translate",
      icon: "🌐",
      title: "Translate",
      description:
        "Translate text into another language.",
    },
  ];

  const handleActionSelect = (
    action
  ) => {
    setSelectedAction(
      action
    );

    setInput("");
  };

  const createLocalResponse = (
    text,
    action
  ) => {
    const cleanText =
      text.trim();

    if (!cleanText) {
      return "";
    }

    if (action === "Summarize") {
      return `Summary request received:\n\n${cleanText}\n\nZenva AI will summarize this content when the AI backend is connected.`;
    }

    if (action === "Rewrite") {
      return `Rewrite request received:\n\n${cleanText}\n\nZenva AI will rewrite this content when the AI backend is connected.`;
    }

    if (action === "Translate") {
      return `Translation request received:\n\n${cleanText}\n\nZenva AI will translate this content when the translation/AI service is connected.`;
    }

    return `I received your request:\n\n${cleanText}\n\nZenva AI is ready for the AI backend integration.`;
  };

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    const cleanInput =
      input.trim();

    if (!cleanInput) {
      return;
    }

    const userMessage = {
      id:
        Date.now(),
      type: "user",
      text: cleanInput,
      action:
        selectedAction,
    };

    const assistantMessage = {
      id:
        Date.now() + 1,
      type: "assistant",
      text:
        createLocalResponse(
          cleanInput,
          selectedAction
        ),
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
        assistantMessage,
      ]
    );

    setInput("");
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="zenva-ai-page">
      {/* HEADER */}

      <header className="zenva-ai-header">
        <button
          type="button"
          className="zenva-ai-back"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <div className="zenva-ai-brand">
          <div className="zenva-ai-logo">
            ✨
          </div>

          <div>
            <h1>
              Zenva AI
            </h1>

            <span>
              Your intelligent ZenvaZapp assistant
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="zenva-ai-clear"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </header>

      {/* MAIN */}

      <main className="zenva-ai-content">
        {messages.length === 0 ? (
          <>
            <section className="zenva-ai-welcome">
              <div className="zenva-ai-welcome-icon">
                🤖
              </div>

              <h2>
                Hello
                {user?.fullName
                  ? `, ${user.fullName}`
                  : ""}
                !
              </h2>

              <p>
                What would you like Zenva AI
                to help you with?
              </p>
            </section>

            <section className="zenva-ai-actions">
              {actions.map(
                (action) => (
                  <button
                    type="button"
                    key={action.id}
                    className={
                      selectedAction ===
                      action.id
                        ? "zenva-ai-action active"
                        : "zenva-ai-action"
                    }
                    onClick={() =>
                      handleActionSelect(
                        action.id
                      )
                    }
                  >
                    <div className="zenva-ai-action-icon">
                      {action.icon}
                    </div>

                    <div>
                      <strong>
                        {action.title}
                      </strong>

                      <p>
                        {action.description}
                      </p>
                    </div>

                    <span>
                      →
                    </span>
                  </button>
                )
              )}
            </section>
          </>
        ) : (
          <section className="zenva-ai-conversation">
            {messages.map(
              (message) => (
                <div
                  key={message.id}
                  className={
                    message.type ===
                    "user"
                      ? "zenva-ai-message user"
                      : "zenva-ai-message assistant"
                  }
                >
                  <div className="zenva-ai-message-label">
                    {message.type ===
                    "user"
                      ? "You"
                      : "Zenva AI"}
                  </div>

                  <p>
                    {message.text}
                  </p>

                  {message.action && (
                    <span className="zenva-ai-action-label">
                      {message.action}
                    </span>
                  )}
                </div>
              )
            )}
          </section>
        )}

        {/* INPUT */}

        <section className="zenva-ai-input-section">
          <div className="zenva-ai-selected-action">
            <span>
              Mode
            </span>

            <strong>
              {selectedAction}
            </strong>
          </div>

          <form
            className="zenva-ai-form"
            onSubmit={handleSubmit}
          >
            <textarea
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              placeholder={
                selectedAction ===
                "Ask"
                  ? "Ask Zenva AI something..."
                  : `Enter text to ${selectedAction.toLowerCase()}...`
              }
              rows="4"
              aria-label="Zenva AI message"
            />

            <button
              type="submit"
              disabled={
                !input.trim()
              }
              aria-label="Send"
            >
              ↑
            </button>
          </form>

          <p className="zenva-ai-disclaimer">
            Zenva AI features will connect
            to the AI service/backend during
            the integration phase.
          </p>
        </section>

        {/* NAVIGATION */}

        <section className="zenva-ai-quick-links">
          <button
            type="button"
            onClick={() =>
              onNavigate?.("chatlist")
            }
          >
            💬 Chats
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate?.("contacts")
            }
          >
            👥 Contacts
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate?.("tools")
            }
          >
            🛠️ Tools
          </button>
        </section>
      </main>
    </div>
  );
}

export default ZenvaAI;