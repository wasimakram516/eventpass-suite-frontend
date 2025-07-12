"use client";

import { Box, Typography, Tooltip } from "@mui/material";
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
          // Inner + Outer Neumorphic Shadows
          boxShadow: `
            2px 2px 6px rgba(0, 0, 0, 0.15),
            -2px -2px 6px rgba(255, 255, 255, 0.5),
            inset 2px 2px 5px rgba(0, 0, 0, 0.2),
            inset -2px -2px 5px rgba(255, 255, 255, 0.7)
          `,
        }}
      >
        {/* Labels */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: !isArabic ? "#fff" : "text.secondary",
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
            color: isArabic ? "#fff" : "text.secondary",
            zIndex: 2,
            transition: "color 0.3s",
          }}
        >
          AR
        </Typography>

        {/* Animated Thumb */}
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
            backgroundColor: "#1976d2",
            zIndex: 1,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)", 
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default LanguageSelector;