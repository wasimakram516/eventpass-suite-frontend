"use client";

import { Box, Typography, Tooltip, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import useI18nLayout from "@/hooks/useI18nLayout";

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

const LanguageSelector = ({ top, right }) => {
  const { language, toggleLanguage } = useLanguage();
  const isArabic = language === "ar";
  const isFloating = typeof top !== "undefined" && typeof right !== "undefined";
  const theme = useTheme();

  const { t } = useI18nLayout({
    en: {
      switchToArabic: "Switch to Arabic",
      switchToEnglish: "Switch to English"
    },
    ar: {
      switchToArabic: "التبديل إلى العربية",
      switchToEnglish: "التبديل إلى الإنجليزية"
    }
  });

  return (
    <Tooltip title={isArabic ? t.switchToEnglish : t.switchToArabic}>
      <Box
        onClick={toggleLanguage}
        sx={{
          position: isFloating ? "absolute" : "relative",
          top: isFloating ? top : "auto",
          right: isFloating ? right : "auto",
          width: 64,
          height: 32,
          borderRadius: 32,
          backgroundColor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          cursor: "pointer",
          overflow: "hidden",
          zIndex: 999,
          boxShadow: (theme) => theme.palette.shadow.neumorphicToggle,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: !isArabic ? "primary.contrastText" : "text.secondary",
            zIndex: 2,
            transition: "color 0.3s",
          }}
        >
          EN
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: isArabic ? "primary.contrastText" : "text.secondary",
            zIndex: 2,
            transition: "color 0.3s",
          }}
        >
          AR
        </Typography>

        <motion.div
          layout
          transition={spring}
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: 999,
            top: 2,
            left: isArabic ? 34 : 2,
            backgroundColor: theme.palette.primary.main,
            zIndex: 1,
            boxShadow: theme.palette.shadow.toggleKnob,
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default LanguageSelector;