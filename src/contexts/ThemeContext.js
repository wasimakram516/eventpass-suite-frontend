"use client";

import { createContext, useContext, useMemo, useState, useEffect, useRef } from "react";
import { getTheme } from "@/styles/theme";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "eventpass-theme";
const TRANSITION_DURATION = 500; // ms

const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
  theme: null,
  isTransitioning: false,
});

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        setMode(saved);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const toggleColorMode = () => {
    setIsTransitioning(true);

    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
      return next;
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  };

  const direction = language === "ar" ? "rtl" : "ltr";

  const theme = useMemo(() => getTheme(mode, direction), [mode, direction]);

  const value = useMemo(
    () => ({ mode, toggleColorMode, theme, isTransitioning }),
    [mode, theme, isTransitioning]
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);