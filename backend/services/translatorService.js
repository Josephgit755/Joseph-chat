const OpenAI = require("openai");

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  return new OpenAI({
    apiKey,
  });
};

// ==========================================
// SUPPORTED LANGUAGES
// ==========================================

const languageNames = {
  english: "English",
  french: "French",
  pidgin: "Cameroonian Pidgin English",
  spanish: "Spanish",
  arabic: "Arabic",
};

// ==========================================
// TRANSLATE TEXT
// ==========================================

const translateText = async ({
  text,
  sourceLanguage,
  targetLanguage,
}) => {
  if (!text || !text.trim()) {
    throw new Error(
      "Text to translate is required."
    );
  }

  const sourceName =
    languageNames[sourceLanguage];

  const targetName =
    languageNames[targetLanguage];

  if (!sourceName) {
    throw new Error(
      "Unsupported source language."
    );
  }

  if (!targetName) {
    throw new Error(
      "Unsupported target language."
    );
  }

  // ----------------------------------------
  // SAME LANGUAGE
  // ----------------------------------------

  if (
    sourceLanguage === targetLanguage
  ) {
    return text.trim();
  }

  const client = getOpenAIClient();

  // ----------------------------------------
  // TRANSLATION INSTRUCTION
  // ----------------------------------------

  const instructions = `
You are the official ZenvaZapp translation engine.

Translate the user's text accurately from ${sourceName}
to ${targetName}.

Important rules:

1. Return ONLY the translated text.
2. Do not explain the translation.
3. Do not add quotation marks unless they exist
   in the original text.
4. Preserve the original meaning.
5. Preserve the original tone.
6. Preserve emojis.
7. Preserve line breaks where possible.
8. Do not summarize.
9. Do not add extra commentary.

If the target language is Cameroonian Pidgin English,
translate naturally into commonly understood
Cameroonian Pidgin English.

Do not translate Cameroonian Pidgin English into
Nigerian Pidgin unless the user specifically requests it.

If names, usernames, URLs, email addresses, numbers,
or special symbols appear in the text, preserve them
appropriately.

Source language:
${sourceName}

Target language:
${targetName}
`;

  const response =
    await client.responses.create({
      model:
        process.env.OPENAI_TRANSLATOR_MODEL ||
        "gpt-5.6",

      instructions,

      input: text.trim(),
    });

  const translatedText =
    response.output_text?.trim();

  if (!translatedText) {
    throw new Error(
      "The translation service returned an empty response."
    );
  }

  return translatedText;
};

module.exports = {
  translateText,
};