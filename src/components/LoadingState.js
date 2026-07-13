"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, CircularProgress, Skeleton, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useLanguage } from "@/contexts/LanguageContext";
const MotionBox = motion(Box);

const translations = {
  ar: {
    text: "جاري تحميل إيفنت باس",
    description: "جارٍ تجهيز تجربتك...",
  },
};

export default function LoadingState({
  size,
  text,
  description,
}) {
  const langCtx = useLanguage();
  const lang = langCtx?.language || "en";
  const t = translations[lang] || {};
  const displayText = text ?? t.text ?? "Loading EventPass";
  const displayDescription = description ?? t.description ?? "Preparing your experience...";
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (size) {
    return <CircularProgress size={size} color="inherit" />;
  }

  return (
    <AnimatePresence>
      <MotionBox
        key="ep-loader"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: theme.palette.loader.overlay,
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
          "@keyframes ep-spin": {
            from: { transform: "rotate(0deg)" },
            to: { transform: "rotate(360deg)" },
          },
          "@keyframes ep-spin-reverse": {
            from: { transform: "rotate(360deg)" },
            to: { transform: "rotate(0deg)" },
          },
          "@keyframes ep-float": {
            "0%, 100%": { transform: "translateY(0px) scale(1)" },
            "50%": { transform: "translateY(-6px) scale(1.02)" },
          },
          "@keyframes ep-pulse": {
            "0%, 100%": { opacity: 0.5, transform: "scale(0.94)" },
            "50%": { opacity: 0.85, transform: "scale(1)" },
          },
          "@keyframes ep-sweep": {
            "0%": { left: "-35%" },
            "100%": { left: "105%" },
          },
          "@keyframes ep-shimmer": {
            "0%": { backgroundPosition: "220% 0" },
            "100%": { backgroundPosition: "-35% 0" },
          },
          "@keyframes ep-bar-run": {
            "0%": { left: "-34%" },
            "100%": { left: "104%" },
          },
          "@keyframes ep-panel-in": {
            from: { opacity: 0, transform: "translateY(8px) scale(0.985)" },
            to: { opacity: 1, transform: "translateY(0) scale(1)" },
          },
        }}
      >
        {/* Ambient glow blobs */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            width: { xs: 180, sm: 240 },
            height: { xs: 180, sm: 240 },
            borderRadius: "50%",
            top: { xs: "8%", sm: "12%" },
            left: { xs: "-10%", sm: "6%" },
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 72%)`,
            filter: "blur(12px)",
            pointerEvents: "none",
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            width: { xs: 220, sm: 280 },
            height: { xs: 220, sm: 280 },
            borderRadius: "50%",
            right: { xs: "-18%", sm: "4%" },
            bottom: { xs: "-4%", sm: "8%" },
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 74%)`,
            filter: "blur(18px)",
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: 440, sm: 520 },
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 3, sm: 3.5 },
            position: "relative",
            overflow: "hidden",
            borderRadius: "20px",
            bgcolor: theme.palette.loader.card,
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            border: "1px solid",
            borderColor: "transparent",
            boxShadow: theme.palette.shadow.elevated,
          }}
        >
          {/* Sweep bar at top */}
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: "-35%",
              top: 0,
              width: "40%",
              height: 3,
              background:
                `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.55)} 55%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
              animation: "ep-sweep 2.6s linear infinite",
              pointerEvents: "none",
            }}
          />

          {/* Logo + rings */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: { xs: 144, sm: 150 },
                height: { xs: 144, sm: 150 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 18,
                  borderRadius: "999px",
                  background:
                    `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 62%, transparent 100%)`,
                  animation: "ep-pulse 2.6s ease-in-out infinite",
                },
              }}
            >
              {/* Outer spinning ring */}
              <Box
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderTopColor: theme.palette.primary.main,
                  borderRightColor: alpha(theme.palette.primary.main, 0.55),
                  animation: "ep-spin 1.1s linear infinite",
                  zIndex: 0,
                }}
              />
              {/* Inner counter-spinning dashed ring */}
              <Box
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  inset: 12,
                  borderRadius: "50%",
                  border: `1.5px dashed ${alpha(theme.palette.primary.main, 0.22)}`,
                  animation: "ep-spin-reverse 1.65s linear infinite",
                  zIndex: 0,
                }}
              />

              {/* Logo */}
              <Box
                component="img"
                src="/WW.png"
                alt="EventPass"
                sx={{
                  width: "auto",
                  height: "auto",
                  maxWidth: { xs: 78, sm: 82 },
                  maxHeight: { xs: 78, sm: 82 },
                  objectFit: "contain",
                  position: "relative",
                  zIndex: 2,
                  animation: "ep-float 2.8s ease-in-out infinite",
                  filter: `drop-shadow(0 8px 16px ${alpha(theme.palette.primary.main, 0.22)})`,
                }}
              />
            </Box>

            {/* Text */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.05rem", sm: "1.2rem" },
                  color: "text.primary",
                  lineHeight: 1.3,
                }}
              >
                {displayText}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  mt: 0.75,
                  lineHeight: 1.65,
                  maxWidth: 320,
                  mx: "auto",
                }}
              >
                {displayDescription}
              </Typography>
            </Box>

            {/* Shimmer bar + skeletons */}
            <Box
              sx={{
                width: "100%",
                px: { xs: 0.5, sm: 1 },
                display: "flex",
                flexDirection: "column",
                gap: 1.2,
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  height: 10,
                  borderRadius: "999px",
                  background: isDark
                    ? `linear-gradient(90deg, ${alpha(theme.palette.common.white, 0.05)} 0%, ${alpha(theme.palette.common.white, 0.02)} 48%, ${alpha(theme.palette.common.white, 0.05)} 100%)`
                    : `linear-gradient(90deg, ${alpha(theme.palette.common.black, 0.04)} 0%, ${alpha(theme.palette.common.black, 0.02)} 48%, ${alpha(theme.palette.common.black, 0.04)} 100%)`,
                  backgroundSize: "220% 100%",
                  animation: "ep-shimmer 1.9s linear infinite",
                  position: "relative",
                  overflow: "hidden",
                  mb: 0.2,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: 1,
                    left: "-34%",
                    width: "34%",
                    height: "calc(100% - 2px)",
                    borderRadius: "inherit",
                    background:
                      `linear-gradient(90deg, ${alpha(theme.palette.common.white, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.14)} 50%, ${alpha(theme.palette.common.white, 0.02)} 100%)`,
                    animation: "ep-bar-run 1.9s ease-in-out infinite",
                  },
                }}
              />
              {[88, 100, 56].map((width, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  animation="wave"
                  height={i === 0 ? 12 : 10}
                  width={`${width}%`}
                  sx={{
                    mx: "auto",
                    borderRadius: "999px",
                    bgcolor: isDark ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.07),
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </MotionBox>
    </AnimatePresence>
  );
}