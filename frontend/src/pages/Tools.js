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
    if (tool.id === "breath") {
      onNavigate?.("breath");
      return;
    }

    if (tool.id === "translator") {
      onNavigate?.("translator");
      return;
    }

    if (tool.id === "student") {
      onNavigate?.("student");
      return;
    }

    if (tool.id === "files") {
      onNavigate?.("files");
      return;
    }

    if (tool.id === "marketing") {
      onNavigate?.("marketing");
      return;
    }

    if (tool.id === "ai") {
      onNavigate?.("ai");
      return;
    }
  };

  return (
    <div className="tools-page">

      {/* =====================================
          HEADER
      ===================================== */}

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


      {/* =====================================
          MAIN CONTENT
      ===================================== */}

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


        {/* =====================================
            TOOLS
        ===================================== */}

        <section className="tools-grid">

          {tools.map((tool) => (

            <button
              key={tool.id}
              className="tool-card"
              onClick={() => handleToolClick(tool)}
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


        {/* =====================================
            AI INFORMATION
        ===================================== */}

        <section className="tools-ai-note">

          <div className="tools-ai-icon">
            ✨
          </div>

          <div>

            <h3>
              Zenva AI
            </h3>

            <p>
              Your intelligent assistant will eventually
              work directly inside your conversations,
              helping you understand and manage messages.
            </p>

          </div>

        </section>

      </main>


      {/* =====================================
          BOTTOM NAVIGATION
      ===================================== */}

      <nav className="tools-bottom-navigation">

        <button
          className="tools-nav-button"
          onClick={() =>
            onNavigate?.("chatlist")
          }
        >
          <span>💬</span>
          <small>Chats</small>
        </button>


        <button
          className="tools-nav-button"
          onClick={() =>
            onNavigate?.("calls")
          }
        >
          <span>📞</span>
          <small>Calls</small>
        </button>


        <button
          className="tools-nav-button active"
          onClick={() =>
            onNavigate?.("tools")
          }
        >
          <span>🛠️</span>
          <small>Tools</small>
        </button>


        <button
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