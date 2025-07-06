"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function useI18nLayout(translations = {}) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const t = translations[language] || {};

  return { dir, align, isArabic, language, t };
}
