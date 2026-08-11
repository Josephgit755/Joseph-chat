import { useState } from "react";

import "./message-ai.css";

function MessageAI({ message, onClose }) {
  const [activeAction, setActiveAction] = useState(null);

  const actions = [
    {
      id: "explain",
      icon: "💡",
      title: "Explain",
      description: "Help me understand this message",
    },
    {
      id: "summarize",
      icon: "📝",
      title: "Summarize",
      description: "Make this message shorter",
    },
    {
      id: "translate",
      icon: "🌐",
      title: "Translate",
      description: "Translate this message",
    },
    {
      id: "professional",
      icon: "💼",
      title: "Rewrite professionally",
      description: "Make the message more professional",
    },
    {
      id: "shorter",
      icon: "✂️",
      title: "Make shorter",
      description: "Create a shorter version",
    },
    {
      id: "reply",
      icon: "💬",
      title: "Suggest reply",
      description: "Generate a suitable response",
    },
    {
      id: "date",
      icon: "📅",
      title: "Extract date",
      description: "Find dates and times in this message",
    },
    {
      id: "reminder",
      icon: "⏰",
      title: "Create reminder",
      description: "Create a reminder from this message",
    },
    {
      id: "task",
      icon: "✅",
      title: "Create task",
      description: "Turn this message into a task",
    },
  ];

  const handleAction = (action) => {
    setActiveAction(action);

    console.log(
      "Zenva AI action:",
      action,
      "Message:",
      message
    );
  };

  return (
    <div className="message-ai-overlay">

      <div className="message-ai-panel">

        {/* HEADER */}

        <header className="message-ai-header">

          <div className="message-ai-title">

            <div className="message-ai-logo">
              ✨
            </div>

            <div>
              <h2>Zenva AI</h2>

              <p>
                Work with this message
              </p>
            </div>

          </div>

          <button
            className="message-ai-close"
            onClick={onClose}
          >
            ×
          </button>

        </header>


        {/* SELECTED MESSAGE */}

        <section className="message-ai-selected">

          <span>
            Selected message
          </span>

          <p>
            "{message?.text || message || "Selected message"}"
          </p>

        </section>


        {/* ACTIONS */}

        <section className="message-ai-actions">

          <h3>
            What would you like Zenva AI to do?
          </h3>

          <div className="message-ai-grid">

            {actions.map((action) => (

              <button
                key={action.id}
                className="message-ai-action"
                onClick={() =>
                  handleAction(action.id)
                }
              >

                <span className="message-ai-action-icon">
                  {action.icon}
                </span>

                <span className="message-ai-action-text">

                  <strong>
                    {action.title}
                  </strong>

                  <small>
                    {action.description}
                  </small>

                </span>

              </button>

            ))}

          </div>

        </section>


        {/* RESULT */}

        {activeAction && (

          <section className="message-ai-result">

            <div className="message-ai-result-header">

              <span>
                ✨
              </span>

              <strong>
                Zenva AI
              </strong>

            </div>

            <p>
              AI processing for{" "}
              <strong>
                {activeAction}
              </strong>{" "}
              will be connected to the ZenvaZapp
              backend next.
            </p>

            {(activeAction === "reminder" ||
              activeAction === "task" ||
              activeAction === "date") && (

              <button
                className="message-ai-result-button"
                onClick={() =>
                  alert(
                    "This action will be connected to the ZenvaZapp reminder and task system."
                  )
                }
              >
                Continue
              </button>

            )}

          </section>

        )}

      </div>

    </div>
  );
}

export default MessageAI;