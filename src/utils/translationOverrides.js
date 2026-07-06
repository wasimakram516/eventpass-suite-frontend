// Word/phrase-level corrections applied on top of Google Translate's output.
// Some terms have an official/branded Arabic wording that differs from the
// literal machine translation (e.g. "Royal Hospital" is officially referred
// to with "السلطاني", not the literal "الملكي"). Add more entries as needed —
// each is a plain substring replacement applied to the translated text.
export const AR_TRANSLATION_OVERRIDES = [
  { from: "الملكي", to: "السلطاني" },
];

/** Apply the Arabic override list to a single translated string. No-op for other languages. */
export function applyTranslationOverrides(text, targetLang) {
  if (targetLang !== "ar" || typeof text !== "string" || !text) return text;
  return AR_TRANSLATION_OVERRIDES.reduce(
    (result, { from, to }) => result.split(from).join(to),
    text
  );
}

/** Apply the override list to an array of translated strings (e.g. a translateTexts() result). */
export function applyTranslationOverridesToArray(texts, targetLang) {
  if (!Array.isArray(texts)) return texts;
  return texts.map((text) => applyTranslationOverrides(text, targetLang));
}
