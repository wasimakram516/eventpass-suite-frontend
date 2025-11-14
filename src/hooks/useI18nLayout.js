"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function useI18nLayout(translations = {}, forcedLanguage = null) {
  const { language: globalLanguage } = useLanguage();

  // URL language overrides global context
  const lang = forcedLanguage || globalLanguage || "en";

  const isArabic = lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const t = translations[lang] || {};

  return { dir, align, isArabic, language: lang, t };
}
