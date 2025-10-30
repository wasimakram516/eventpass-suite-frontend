"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState("en");

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
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
    switchLanguageInUrl(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
