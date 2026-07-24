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

// Fixed English->Arabic glossary for common registration-form terms (field
// labels + option values). Google Translate is called with no source language
// pinned, so it auto-detects per string and returns inconsistent/incorrect
// results for short standalone words ("Student", "Employed") — the same input
// can translate correctly on one page load and wrongly on the next. For any
// term in this glossary we use the fixed, correct Arabic instead of trusting
// the API, guaranteeing it's always right. Keys are matched case-insensitively
// against the trimmed English source text. Add terms as new events need them.
export const AR_TERM_GLOSSARY = {
  "full name": "الاسم الكامل",
  "first name": "الاسم الأول",
  "last name": "اسم العائلة",
  "name": "الاسم",
  "phone": "رقم الهاتف",
  "phone number": "رقم الهاتف",
  "mobile": "رقم الجوال",
  "mobile number": "رقم الجوال",
  "email": "البريد الإلكتروني",
  "email address": "البريد الإلكتروني",
  "company": "الشركة",
  "organization": "المؤسسة",
  "organisation": "المؤسسة",
  "department": "القسم",
  "job": "وظيفة",
  "job title": "المسمى الوظيفي",
  "designation": "المسمى الوظيفي",
  "occupation": "المهنة",
  "employed": "موظف",
  "employee": "موظف",
  "student": "طالب",
  "unemployed": "عاطل عن العمل",
  "nationality": "جنسية",
  "country": "الدولة",
  "city": "المدينة",
  "address": "العنوان",
  "gender": "الجنس",
  "male": "ذكر",
  "female": "أنثى",
  "age": "العمر",
  "date of birth": "تاريخ الميلاد",
  "yes": "نعم",
  "no": "لا",
};

/**
 * Returns the fixed Arabic translation for a known form term, or null if the
 * term isn't in the glossary (so the caller falls back to the API result).
 * Only applies when translating to Arabic.
 */
export function resolveGlossaryTerm(sourceText, targetLang) {
  if (targetLang !== "ar" || typeof sourceText !== "string") return null;
  return AR_TERM_GLOSSARY[sourceText.trim().toLowerCase()] || null;
}
