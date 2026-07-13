"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const LanguageContext = createContext();
const TRANSITION_DURATION = 500; // ms — matches ThemeContext's overlay timing

export const LanguageProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState("en");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Load initial language (from URL or localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("language");
      const langFromUrl = pathname.match(/\/(en|ar)(\/|$)/)?.[1];

      if (langFromUrl) {
        setLanguage(langFromUrl);
        localStorage.setItem("language", langFromUrl);
      } else if (stored) {
        setLanguage(stored);
      }
    }
  }, [pathname]);

  const switchLanguageInUrl = (newLang) => {
    if (typeof window === "undefined") return;

    // Check if URL contains "en" or "ar" anywhere in the path
    const urlPattern = /(\/)(en|ar)(?=\/|$)/;
    if (urlPattern.test(window.location.pathname)) {
      // Replace existing language code with the new one
      const newPath = window.location.pathname.replace(urlPattern, `/${newLang}`);
      const newUrl = `${newPath}${window.location.search}${window.location.hash}`;
      router.push(newUrl);
    } else {
      // No language code in URL — just update context (no reload)
      setLanguage(newLang);
      localStorage.setItem("language", newLang);
    }
  };

  const toggleLanguage = () => {
    setIsTransitioning(true);

    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
    switchLanguageInUrl(newLang);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, isTransitioning }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
