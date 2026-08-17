const {
  translateText,
} = require("../services/translatorService");

// ==========================================
// TRANSLATE
// ==========================================

const translate = async (req, res) => {
  try {
    const {
      text,
      sourceLanguage,
      targetLanguage,
    } = req.body;

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Text to translate is required.",
      });
    }

    if (
      !sourceLanguage ||
      !targetLanguage
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source and target languages are required.",
      });
    }

    // ----------------------------------------
    // TRANSLATE
    // ----------------------------------------

    const translatedText =
      await translateText({
        text,
        sourceLanguage,
        targetLanguage,
      });

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(200).json({
      success: true,

      sourceLanguage,

      targetLanguage,

      originalText: text,

      translatedText,
    });
  } catch (error) {
    console.error(
      "Translation error:",
      error
    );

    // ----------------------------------------
    // API KEY ERROR
    // ----------------------------------------

    if (
      error.message?.includes(
        "OPENAI_API_KEY"
      )
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Translation service is not configured on the server.",
      });
    }

    // ----------------------------------------
    // GENERAL ERROR
    // ----------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Unable to translate the message right now.",
    });
  }
};

module.exports = {
  translate,
};