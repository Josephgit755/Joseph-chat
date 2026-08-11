import { useMemo, useState } from "react";

import "./smart-files.css";

function SmartFiles({ user, onBack, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [files] = useState([
    {
      id: 1,
      name: "Computer Engineering Notes.pdf",
      type: "pdf",
      category: "documents",
      size: "2.4 MB",
      sender: "John",
      date: "Today",
      icon: "📕",
    },
    {
      id: 2,
      name: "Project Presentation.pptx",
      type: "presentation",
      category: "documents",
      size: "5.8 MB",
      sender: "Mary",
      date: "Yesterday",
      icon: "📊",
    },
    {
      id: 3,
      name: "Business Logo.png",
      type: "image",
      category: "images",
      size: "1.2 MB",
      sender: "David",
      date: "Yesterday",
      icon: "🖼️",
    },
    {
      id: 4,
      name: "Class Recording.mp4",
      type: "video",
      category: "videos",
      size: "18.5 MB",
      sender: "Peter",
      date: "Monday",
      icon: "🎥",
    },
    {
      id: 5,
      name: "Voice Message.mp3",
      type: "audio",
      category: "audio",
      size: "3.1 MB",
      sender: "Sarah",
      date: "Monday",
      icon: "🎵",
    },
    {
      id: 6,
      name: "Sales Report.xlsx",
      type: "spreadsheet",
      category: "spreadsheets",
      size: "820 KB",
      sender: "Business Group",
      date: "Last week",
      icon: "📗",
    },
  ]);

  const categories = [
    {
      id: "all",
      label: "All",
      icon: "📂",
    },
    {
      id: "documents",
      label: "Documents",
      icon: "📄",
    },
    {
      id: "images",
      label: "Images",
      icon: "🖼️",
    },
    {
      id: "videos",
      label: "Videos",
      icon: "🎥",
    },
    {
      id: "audio",
      label: "Audio",
      icon: "🎵",
    },
    {
      id: "pdf",
      label: "PDFs",
      icon: "📕",
    },
    {
      id: "spreadsheets",
      label: "Spreadsheets",
      icon: "📊",
    },
  ];

  // ==========================================
  // FILTER FILES
  // ==========================================

  const filteredFiles = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return files.filter((file) => {
      const matchesCategory =
        activeCategory === "all" ||
        file.category === activeCategory ||
        (activeCategory === "pdf" && file.type === "pdf");

      const matchesSearch =
        !search ||
        file.name.toLowerCase().includes(search) ||
        file.sender.toLowerCase().includes(search) ||
        file.type.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [files, searchTerm, activeCategory]);


  // ==========================================
  // AI SEARCH
  // ==========================================

  const handleAISearch = () => {
    if (!searchTerm.trim()) {
      alert(
        "Try something like: Find the PDF John sent me last month."
      );
      return;
    }

    alert(
      `Zenva AI search:\n\n"${searchTerm}"\n\nAI-powered file search will be connected to your backend later.`
    );
  };


  // ==========================================
  // FILE ACTIONS
  // ==========================================

  const handleFileOpen = (file) => {
    alert(`Opening ${file.name}`);
  };

  const handleFileShare = (file) => {
    alert(`Sharing ${file.name}`);
  };

  const handleFileDownload = (file) => {
    alert(`Downloading ${file.name}`);
  };


  return (
    <div className="smart-files-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="smart-files-header">

        <button
          className="smart-files-back"
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>

        <div className="smart-files-title">

          <div className="smart-files-title-icon">
            📁
          </div>

          <div>
            <h1>Smart Files</h1>

            <p>
              All your shared files, organized automatically
            </p>
          </div>

        </div>

      </header>


      {/* =====================================
          SEARCH
      ===================================== */}

      <section className="smart-files-search-section">

        <div className="smart-files-search">

          <span className="smart-files-search-icon">
            🔎
          </span>

          <input
            type="text"
            placeholder="Search files, contacts or conversations..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          {searchTerm && (
            <button
              className="smart-files-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>

        <p className="smart-files-search-hint">
          Try: "Find the PDF John sent me last month"
        </p>

      </section>


      {/* =====================================
          AI SEARCH
      ===================================== */}

      <section className="smart-files-ai-search">

        <div className="smart-files-ai-icon">
          ✨
        </div>

        <div className="smart-files-ai-content">

          <strong>
            Ask Zenva AI
          </strong>

          <p>
            Search your files naturally using people,
            dates, file types and conversations.
          </p>

        </div>

        <button
          className="smart-files-ai-button"
          onClick={handleAISearch}
        >
          Search
        </button>

      </section>


      {/* =====================================
          CATEGORIES
      ===================================== */}

      <section className="smart-files-categories">

        <div className="smart-files-section-heading">

          <h2>
            File Categories
          </h2>

          <span>
            {files.length} files
          </span>

        </div>

        <div className="smart-files-category-list">

          {categories.map((category) => (

            <button
              key={category.id}
              className={`smart-files-category ${
                activeCategory === category.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveCategory(category.id)
              }
            >
              <span>
                {category.icon}
              </span>

              {category.label}

            </button>

          ))}

        </div>

      </section>


      {/* =====================================
          FILE LIST
      ===================================== */}

      <section className="smart-files-list-section">

        <div className="smart-files-list-heading">

          <h2>
            {searchTerm
              ? "Search Results"
              : activeCategory === "all"
              ? "Recent Files"
              : categories.find(
                  (category) =>
                    category.id === activeCategory
                )?.label}
          </h2>

          <span>
            {filteredFiles.length} found
          </span>

        </div>


        {filteredFiles.length > 0 ? (

          <div className="smart-files-list">

            {filteredFiles.map((file) => (

              <div
                className="smart-file-card"
                key={file.id}
              >

                <div className="smart-file-icon">
                  {file.icon}
                </div>


                <div className="smart-file-info">

                  <h3>
                    {file.name}
                  </h3>

                  <p>
                    Sent by {file.sender}
                  </p>

                  <span>
                    {file.size} · {file.date}
                  </span>

                </div>


                <div className="smart-file-actions">

                  <button
                    onClick={() =>
                      handleFileOpen(file)
                    }
                    title="Open"
                  >
                    👁️
                  </button>

                  <button
                    onClick={() =>
                      handleFileShare(file)
                    }
                    title="Share"
                  >
                    ↗
                  </button>

                  <button
                    onClick={() =>
                      handleFileDownload(file)
                    }
                    title="Download"
                  >
                    ↓
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="smart-files-empty">

            <div className="smart-files-empty-icon">
              🔎
            </div>

            <h3>
              No files found
            </h3>

            <p>
              Try another search or choose a
              different category.
            </p>

          </div>

        )}

      </section>


      {/* =====================================
          AI FILE TOOLS
      ===================================== */}

      <section className="smart-files-ai-tools">

        <div className="smart-files-ai-tools-header">

          <span>
            ✨
          </span>

          <div>

            <h2>
              AI File Tools
            </h2>

            <p>
              Work with your files using Zenva AI
            </p>

          </div>

        </div>


        <div className="smart-files-ai-grid">

          <button
            onClick={() =>
              alert(
                "AI file summarization will be connected later."
              )
            }
          >
            <span>📝</span>

            <strong>
              Summarize
            </strong>

            <small>
              Get the important points from a document.
            </small>
          </button>


          <button
            onClick={() =>
              alert(
                "AI file translation will be connected later."
              )
            }
          >
            <span>🌐</span>

            <strong>
              Translate
            </strong>

            <small>
              Translate supported documents.
            </small>
          </button>


          <button
            onClick={() =>
              alert(
                "AI quiz generation will be connected to Student Mode later."
              )
            }
          >
            <span>🎓</span>

            <strong>
              Generate Quiz
            </strong>

            <small>
              Turn study documents into quizzes.
            </small>
          </button>


          <button
            onClick={() =>
              alert(
                "AI document analysis will be connected later."
              )
            }
          >
            <span>🤖</span>

            <strong>
              Analyze
            </strong>

            <small>
              Ask Zenva AI questions about a file.
            </small>
          </button>

        </div>

      </section>


      {/* =====================================
          STORAGE
      ===================================== */}

      <section className="smart-files-storage">

        <div className="smart-files-storage-header">

          <div>

            <span>
              ☁️
            </span>

            <div>

              <strong>
                Zenva Storage
              </strong>

              <p>
                Your shared files
              </p>

            </div>

          </div>

          <strong>
            1.2 GB / 5 GB
          </strong>

        </div>


        <div className="smart-files-storage-bar">

          <div
            className="smart-files-storage-fill"
            style={{
              width: "24%",
            }}
          />

        </div>

        <small>
          More storage will be available with Zenva Plus.
        </small>

      </section>

    </div>
  );
}

export default SmartFiles;