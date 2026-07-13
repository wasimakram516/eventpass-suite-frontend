"use client";

import { Box, Fade, Chip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useColorMode } from "@/contexts/ThemeContext";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
  },
  ar: {
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
  },
};

export default function ThemeSwitchOverlay() {
  const { mode, isTransitioning } = useColorMode();
  const { t, dir } = useI18nLayout(translations);

  return (
    <Fade in={isTransitioning} timeout={{ enter: 150, exit: 300 }}>
      <Box
        dir={dir}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          bgcolor: (theme) => theme.palette.themeSwitchOverlay.backdropBg,
          pointerEvents: "none",
        }}
      >
        <Chip
          icon={mode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
          label={mode === "dark" ? t.darkMode : t.lightMode}
          sx={(theme) => ({
            px: 2,
            py: 3,
            fontSize: "1rem",
            fontWeight: 600,
            bgcolor: theme.palette.themeSwitchOverlay.chipBg,
            color: theme.palette.themeSwitchOverlay.chipColor,
            "& .MuiChip-icon": {
              color:
                mode === "dark"
                  ? theme.palette.themeSwitchOverlay.iconDark
                  : theme.palette.themeSwitchOverlay.iconLight,
            },
            boxShadow: theme.palette.themeSwitchOverlay.chipShadow,
          })}
        />
      </Box>
    </Fade>
  );
}