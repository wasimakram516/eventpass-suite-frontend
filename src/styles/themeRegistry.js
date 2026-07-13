"use client";

import { useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { ColorModeProvider, useColorMode } from "@/contexts/ThemeContext";
import ThemeSwitchOverlay from "@/components/ThemeSwitchOverlay";
function InnerThemeProvider({ children }) {
  const { theme } = useColorMode();

  useEffect(() => {
    if (theme?.palette?.mode) {
      document.documentElement.setAttribute("data-theme", theme.palette.mode);
    }
  }, [theme?.palette?.mode]);

  if (!theme) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeSwitchOverlay />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({ children }) {
  return (
    <ColorModeProvider>
      <InnerThemeProvider>{children}</InnerThemeProvider>
    </ColorModeProvider>
  );
}