"use client";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ArabicFontSync() {
  const { language } = useLanguage();

  useEffect(() => {
    document.body.classList.toggle("lang-ar", language === "ar");
  }, [language]);

  return null;
}
