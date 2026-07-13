"use client";

import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LanguageSelector from "@/components/LanguageSelector";
import { useColorMode } from "@/contexts/ThemeContext";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    switchToDark: "Switch to dark mode",
    switchToLight: "Switch to light mode",
  },
  ar: {
    switchToDark: "التبديل إلى الوضع الداكن",
    switchToLight: "التبديل إلى الوضع الفاتح",
  },
};

export default function CrossZeroFloatingControls({ top = 20, right = 20 }) {
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const { t } = useI18nLayout(translations);

  return (
    <Box
      sx={{
        position: "fixed",
        top,
        right,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Tooltip title={mode === "dark" ? t.switchToLight : t.switchToDark}>
        <IconButton
          aria-label={mode === "dark" ? t.switchToLight : t.switchToDark}
          onClick={toggleColorMode}
          sx={{
            width: 32,
            height: 32,
            bgcolor: "background.paper",
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: theme.palette.shadow.floatingButton,
            "&:hover": {
              bgcolor: "background.paper",
            },
          }}
        >
          {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <LanguageSelector />
    </Box>
  );
}