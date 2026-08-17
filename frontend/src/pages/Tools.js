import "./tools.css";

function Tools({ user, onNavigate }) {
  const tools = [
    {
      id: "breath",
      icon: "🫁",
      title: "Zenva Breath",
      description:
        "Calm down, breathe and reset after a difficult conversation or call.",
    },
    {
      id: "translator",
      icon: "🌐",
      title: "Translator",
      description:
        "Translate selected messages into English, French, Pidgin and other languages.",
    },
    {
      id: "student",
      icon: "🎓",
      title: "Student Mode",
      description:
        "Create study rooms, share notes and files, use AI tutoring and generate quizzes.",
    },
    {
      id: "files",
      icon: "📁",
      title: "Smart Files",
      description:
        "Automatically organize documents, images, videos, audio and PDFs.",
    },
    {
      id: "marketing",
      icon: "📣",
      title: "Marketing Status",
      description:
        "Create promotional statuses for products, services and businesses.",
    },
    {
      id: "ai",
      icon: "🤖",
      title: "Zenva AI",
      description:
        "Understand, summarize, rewrite, translate and work with messages.",
    },
  ];

  const handleToolClick = (tool) => {
    switch (tool.id) {
      case "breath":
        onNavigate?.("breath");
        break;

      case "translator":
        onNavigate?.("translator");
        break;

      case "student":
        onNavigate?.("student");
        break;

      case "files":
        onNavigate?.("files");
        break;

      case "marketing":
        onNavigate?.("marketing");
        break;

      case "ai":
        onNavigate?.("ai");
        break;

      default:
        break;
    }
  };

  return (
    <div className="tools-page">
      {/* HEADER */}

      <header className="tools-header">
        <div className="tools-title-area">
          <div className="tools-logo">
            Z
          </div>

          <div>
            <h1>Tools</h1>

            <span>
              More ways to make ZenvaZapp useful
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="tools-content">
        <div className="tools-intro">
          <h2>
            What do you need?
          </h2>

          <p>
            Explore tools designed to help you
            communicate, learn, work and get things done.
          </p>
        </div>

        {/* TOOLS */}

        <section className="tools-grid">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={
                tool.id === "ai"
                  ? "tool-card featured"
                  : "tool-card"
              }
              onClick={() =>
                handleToolClick(tool)
              }
            >
              <div className="tool-icon">
                {tool.icon}
              </div>

              <div className="tool-information">
                <h3>
                  {tool.title}
                </h3>

                <p>
                  {tool.description}
                </p>
              </div>

              <span className="tool-arrow">
                →
              </span>
            </button>
          ))}
        </section>

        {/* ZENVA AI INFORMATION */}

        <section className="tools-ai-note">
          <div className="tools-ai-icon">
            ✨
          </div>

          <div>
            <h3>
              Zenva AI
            </h3>

            <p>
              Your intelligent assistant can help
              you understand, rewrite, summarize
              and work with your messages and content.
            </p>
          </div>
        </section>
      </main>

      {/* BOTTOM NAVIGATION */}

      <nav
        className="tools-bottom-navigation"
        aria-label="Main navigation"
      >
        <button
          type="button"
          className="tools-nav-button"
          onClick={() =>
            onNavigate?.("chatlist")
          }
        >
          <span>💬</span>
          <small>Chats</small>
        </button>

        <button
          type="button"
          className="tools-nav-button"
          onClick={() =>
            onNavigate?.("contacts")
          }
        >
          <span>👥</span>
          <small>Contacts</small>
        </button>

        <button
          type="button"
          className="tools-nav-button active"
          onClick={() =>
            onNavigate?.("tools")
          }
        >
          <span>🛠️</span>
          <small>Tools</small>
        </button>

        <button
          type="button"
          className="tools-nav-button"
          onClick={() =>
            onNavigate?.("settings")
          }
        >
          <span>⚙️</span>
          <small>Settings</small>
        </button>
      </nav>
    </div>
  );
}

export default Tools;