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
          bgcolor: (theme) => theme.palette.switchOverlay.backdropBg,
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
            borderRadius: "999px",
            bgcolor: theme.palette.switchOverlay.chipBg,
            border: `1px solid ${theme.palette.switchOverlay.chipBorder}`,
            color: theme.palette.switchOverlay.chipColor,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            "& .MuiChip-icon": {
              color:
                mode === "dark"
                  ? theme.palette.switchOverlay.iconDark
                  : theme.palette.switchOverlay.iconLight,
            },
            boxShadow: theme.palette.switchOverlay.chipShadow,
          })}
        />
      </Box>
    </Fade>
  );
}