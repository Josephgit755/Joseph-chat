import { useState } from "react";

import "./translator.css";

function Translator({ onBack }) {
  const languages = [
    {
      id: "english",
      name: "English",
      flag: "🇬🇧",
    },
    {
      id: "french",
      name: "French",
      flag: "🇫🇷",
    },
    {
      id: "pidgin",
      name: "Pidgin English",
      flag: "🇨🇲",
    },
    {
      id: "spanish",
      name: "Spanish",
      flag: "🇪🇸",
    },
    {
      id: "arabic",
      name: "Arabic",
      flag: "🇸🇦",
    },
  ];

  const [sourceLanguage, setSourceLanguage] =
    useState("english");

  const [targetLanguage, setTargetLanguage] =
    useState("french");

  const [message, setMessage] = useState("");

  const [translatedText, setTranslatedText] =
    useState("");

  const [copied, setCopied] = useState(false);

  const handleTranslate = () => {
    if (!message.trim()) {
      return;
    }

    /*
      Temporary frontend demonstration.

      Real AI translation will be connected
      to the ZenvaZapp backend later.
    */

    const target = languages.find(
      (language) =>
        language.id === targetLanguage
    );

    setTranslatedText(
      `[${target?.name || "Translation"}] ${message}`
    );

    setCopied(false);
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);

    setTranslatedText("");
    setCopied(false);
  };

  const handleClear = () => {
    setMessage("");
    setTranslatedText("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!translatedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        translatedText
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.log(
        "Unable to copy translation:",
        error
      );
    }
  };

  return (
    <div className="translator-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="translator-header">

        <button
          className="translator-back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <h1>Translator</h1>

          <p>
            Translate messages with Zenva
          </p>
        </div>

      </header>


      {/* =====================================
          CONTENT
      ===================================== */}

      <main className="translator-content">

        <section className="translator-intro">

          <div className="translator-icon">
            🌐
          </div>

          <h2>
            Understand every message
          </h2>

          <p>
            Translate conversations into the
            language that works best for you.
          </p>

        </section>


        {/* =====================================
            LANGUAGE SELECTOR
        ===================================== */}

        <section className="language-selector">

          <div className="language-box">

            <label>
              From
            </label>

            <select
              value={sourceLanguage}
              onChange={(event) =>
                setSourceLanguage(
                  event.target.value
                )
              }
            >
              {languages.map((language) => (
                <option
                  key={language.id}
                  value={language.id}
                >
                  {language.flag}{" "}
                  {language.name}
                </option>
              ))}
            </select>

          </div>


          <button
            className="swap-languages"
            onClick={handleSwapLanguages}
            aria-label="Swap languages"
          >
            ⇄
          </button>


          <div className="language-box">

            <label>
              To
            </label>

            <select
              value={targetLanguage}
              onChange={(event) =>
                setTargetLanguage(
                  event.target.value
                )
              }
            >
              {languages.map((language) => (
                <option
                  key={language.id}
                  value={language.id}
                >
                  {language.flag}{" "}
                  {language.name}
                </option>
              ))}
            </select>

          </div>

        </section>


        {/* =====================================
            MESSAGE INPUT
        ===================================== */}

        <section className="translation-card">

          <div className="translation-card-header">

            <span>
              Your message
            </span>

            <button
              onClick={handleClear}
              disabled={!message && !translatedText}
            >
              Clear
            </button>

          </div>

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Type or paste a message..."
            rows="6"
          />

          <div className="translation-actions">

            <span>
              {message.length} characters
            </span>

            <button
              className="translate-button"
              onClick={handleTranslate}
              disabled={!message.trim()}
            >
              Translate →
            </button>

          </div>

        </section>


        {/* =====================================
            TRANSLATION RESULT
        ===================================== */}

        {translatedText && (
          <section className="translation-result">

            <div className="translation-result-header">

              <div>

                <span>
                  Translation
                </span>

                <strong>
                  {
                    languages.find(
                      (language) =>
                        language.id ===
                        targetLanguage
                    )?.name
                  }
                </strong>

              </div>

              <button
                onClick={handleCopy}
              >
                {copied
                  ? "✓ Copied"
                  : "Copy"}
              </button>

            </div>

            <p>
              {translatedText}
            </p>

          </section>
        )}


        {/* =====================================
            CHAT TRANSLATION INFO
        ===================================== */}

        <section className="message-translation-info">

          <div className="info-icon">
            A
          </div>

          <div>

            <h3>
              Translate directly from chats
            </h3>

            <p>
              Later, tap the <strong>A</strong> beside
              a message to translate that message
              without leaving your conversation.
            </p>

          </div>

        </section>


        {/* =====================================
            SUPPORTED LANGUAGES
        ===================================== */}

        <section className="supported-languages">

          <h3>
            Supported languages
          </h3>

          <div className="language-pills">

            {languages.map((language) => (

              <span
                key={language.id}
                className="language-pill"
              >
                {language.flag}
                {" "}
                {language.name}
              </span>

            ))}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Translator;