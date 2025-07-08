"use client";

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSelector = ({ top, right }) => {
  const { language, toggleLanguage } = useLanguage();
  const isArabic = language === "ar";

  const isFloating = typeof top !== "undefined" && typeof right !== "undefined";

  return (
    <Box
      onClick={toggleLanguage}
      sx={{
        position: isFloating ? "absolute" : "relative",
        top: isFloating ? top : "auto",
        right: isFloating ? right : "auto",
        display: "inline-block",
        width: 70,
        height: 32,
        borderRadius: 16,
        backgroundColor: "background.default",
        cursor: "pointer",
        px: 0.5,
        py: 0.5,
        boxShadow: 1,
        zIndex:999
      }}
    >
      <Box
        sx={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        >
          EN
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        >
          AR
        </Typography>
      </Box>

      {/* Sliding Thumb */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          position: "absolute",
          top: 2,
          left: isArabic ? 36 : 2,
          width: 32,
          height: 28,
          backgroundColor: "#0077B6",
          borderRadius: 14,
          zIndex: 1000,
        }}
      />
    </Box>
  );
};

export default LanguageSelector;
