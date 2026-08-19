import { useState } from "react";

import "./translator.css";

function Translator({ onBack }) {
  // ==========================================
  // LANGUAGES
  // ==========================================

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
      name: "Cameroonian Pidgin English",
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

  // ==========================================
  // STATE
  // ==========================================

  const [sourceLanguage, setSourceLanguage] =
    useState("english");

  const [targetLanguage, setTargetLanguage] =
    useState("french");

  const [message, setMessage] =
    useState("");

  const [translatedText, setTranslatedText] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [isTranslating, setIsTranslating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================
  // API URL
  // ==========================================

  const API_URL = (
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com"
  ).replace(/\/+$/, "");

  // ==========================================
  // TRANSLATE
  // ==========================================

  const handleTranslate = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setTranslatedText(trimmedMessage);
      setErrorMessage("");
      setCopied(false);
      return;
    }

    setIsTranslating(true);
    setErrorMessage("");
    setTranslatedText("");
    setCopied(false);

    try {
      const endpoint =
        `${API_URL}/api/translator/translate`;

      console.log(
        "ZenvaZapp translation request:",
        endpoint
      );

      const response = await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            text: trimmedMessage,

            sourceLanguage:
              sourceLanguage,

            targetLanguage:
              targetLanguage,
          }),
        }
      );

      // ======================================
      // READ RESPONSE SAFELY
      // ======================================

      const responseText =
        await response.text();

      let data = null;

      try {
        data =
          responseText
            ? JSON.parse(responseText)
            : null;
      } catch (parseError) {
        console.error(
          "Translation response was not valid JSON:",
          responseText
        );
      }

      // ======================================
      // HTTP ERROR
      // ======================================

      if (!response.ok) {
        const backendMessage =
          data?.message ||
          data?.error ||
          `Translation request failed with status ${response.status}.`;

        throw new Error(
          backendMessage
        );
      }

      // ======================================
      // SUCCESS RESPONSE VALIDATION
      // ======================================

      if (!data) {
        throw new Error(
          "The translation server returned an empty response."
        );
      }

      if (
        data.success === false
      ) {
        throw new Error(
          data.message ||
          "The translation server rejected the request."
        );
      }

      if (
        !data.translatedText ||
        !String(
          data.translatedText
        ).trim()
      ) {
        throw new Error(
          "The translation server did not return translated text."
        );
      }

      // ======================================
      // DISPLAY TRANSLATION
      // ======================================

      setTranslatedText(
        String(
          data.translatedText
        ).trim()
      );

      setErrorMessage("");
      setCopied(false);

    } catch (error) {
      console.error(
        "ZenvaZapp translation request failed:",
        error
      );

      // ======================================
      // FRIENDLY ERROR MESSAGE
      // ======================================

      let messageToShow =
        error?.message ||
        "Unable to translate the message right now.";

      if (
        error?.name ===
        "TypeError"
      ) {
        messageToShow =
          "Unable to connect to the ZenvaZapp translation server. Please check that the backend is running and deployed.";
      }

      setErrorMessage(
        messageToShow
      );

    } finally {
      setIsTranslating(false);
    }
  };

  // ==========================================
  // SWAP LANGUAGES
  // ==========================================

  const handleSwapLanguages = () => {
    setSourceLanguage(
      targetLanguage
    );

    setTargetLanguage(
      sourceLanguage
    );

    setTranslatedText("");
    setErrorMessage("");
    setCopied(false);
  };

  // ==========================================
  // CLEAR
  // ==========================================

  const handleClear = () => {
    setMessage("");
    setTranslatedText("");
    setErrorMessage("");
    setCopied(false);
  };

  // ==========================================
  // COPY
  // ==========================================

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
      console.error(
        "Unable to copy translation:",
        error
      );
    }
  };

  // ==========================================
  // GET LANGUAGE NAME
  // ==========================================

  const getLanguageName = (
    languageId
  ) => {
    return (
      languages.find(
        (language) =>
          language.id === languageId
      )?.name ||
      languageId
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="translator-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="translator-header">

        <button
          className="translator-back-button"
          onClick={onBack}
          type="button"
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

        {/* ===================================
            INTRO
        =================================== */}

        <section className="translator-intro">

          <div className="translator-icon">
            🌐
          </div>

          <h2>
            Understand every message
          </h2>

          <p>
            Translate conversations into
            the language that works best
            for you.
          </p>

        </section>


        {/* ===================================
            LANGUAGE SELECTOR
        =================================== */}

        <section className="language-selector">

          <div className="language-box">

            <label>
              From
            </label>

            <select
              value={sourceLanguage}
              onChange={(event) => {
                setSourceLanguage(
                  event.target.value
                );

                setTranslatedText("");
                setErrorMessage("");
              }}
            >

              {languages.map(
                (language) => (
                  <option
                    key={language.id}
                    value={language.id}
                  >
                    {language.flag}{" "}
                    {language.name}
                  </option>
                )
              )}

            </select>

          </div>


          <button
            className="swap-languages"
            onClick={
              handleSwapLanguages
            }
            aria-label="Swap languages"
            type="button"
          >
            ⇄
          </button>


          <div className="language-box">

            <label>
              To
            </label>

            <select
              value={targetLanguage}
              onChange={(event) => {
                setTargetLanguage(
                  event.target.value
                );

                setTranslatedText("");
                setErrorMessage("");
              }}
            >

              {languages.map(
                (language) => (
                  <option
                    key={language.id}
                    value={language.id}
                  >
                    {language.flag}{" "}
                    {language.name}
                  </option>
                )
              )}

            </select>

          </div>

        </section>


        {/* ===================================
            MESSAGE INPUT
        =================================== */}

        <section className="translation-card">

          <div className="translation-card-header">

            <span>
              Your message
            </span>

            <button
              onClick={handleClear}
              disabled={
                !message &&
                !translatedText
              }
              type="button"
            >
              Clear
            </button>

          </div>


          <textarea
            value={message}
            onChange={(event) => {
              setMessage(
                event.target.value
              );

              setErrorMessage("");
            }}
            placeholder="Type or paste a message..."
            rows="6"
          />


          <div className="translation-actions">

            <span>
              {message.length} characters
            </span>

            <button
              className="translate-button"
              onClick={
                handleTranslate
              }
              disabled={
                !message.trim() ||
                isTranslating
              }
              type="button"
            >
              {isTranslating
                ? "Translating..."
                : "Translate →"}
            </button>

          </div>

        </section>


        {/* ===================================
            ERROR
        =================================== */}

        {errorMessage && (
          <section
            className="translation-error"
          >

            <span>
              ⚠️
            </span>

            <p>
              {errorMessage}
            </p>

          </section>
        )}


        {/* ===================================
            TRANSLATION RESULT
        =================================== */}

        {translatedText && (
          <section
            className="translation-result"
          >

            <div
              className=
                "translation-result-header"
            >

              <div>

                <span>
                  Translation
                </span>

                <strong>
                  {getLanguageName(
                    targetLanguage
                  )}
                </strong>

              </div>


              <button
                onClick={handleCopy}
                type="button"
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


        {/* ===================================
            CHAT TRANSLATION INFO
        =================================== */}

        <section
          className=
            "message-translation-info"
        >

          <div className="info-icon">
            A
          </div>

          <div>

            <h3>
              Translate directly from chats
            </h3>

            <p>
              Later, tap the{" "}
              <strong>A</strong>{" "}
              beside a message to translate
              that message without leaving
              your conversation.
            </p>

          </div>

        </section>


        {/* ===================================
            SUPPORTED LANGUAGES
        =================================== */}

        <section
          className="supported-languages"
        >

          <h3>
            Supported languages
          </h3>

          <div className="language-pills">

            {languages.map(
              (language) => (

                <span
                  key={language.id}
                  className="language-pill"
                >
                  {language.flag}{" "}
                  {language.name}
                </span>

              )
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Translator;