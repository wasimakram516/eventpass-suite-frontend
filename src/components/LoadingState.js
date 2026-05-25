"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, CircularProgress, Skeleton, Typography } from "@mui/material";

const MotionBox = motion(Box);

export default function LoadingState({
  size,
  text = "Loading EventPass",
  description = "Preparing your experience...",
}) {
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
          bgcolor: "rgba(240, 245, 255, 0.6)",
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
            background:
              "radial-gradient(circle, rgba(0,200,255,0.08) 0%, transparent 72%)",
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
            background:
              "radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 74%)",
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
            bgcolor: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 24px 54px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
            animation: "ep-panel-in 0.3s ease-out",
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
                "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.5) 55%, rgba(0,200,255,0.1) 100%)",
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
                    "radial-gradient(circle, rgba(0,200,255,0.18) 0%, rgba(0,200,255,0.05) 62%, transparent 100%)",
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
                  border: "2px solid rgba(0,200,255,0.18)",
                  borderTopColor: "#00C8FF",
                  borderRightColor: "rgba(0,200,255,0.5)",
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
                  border: "1.5px dashed rgba(0,200,255,0.2)",
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
                  filter: "drop-shadow(0 8px 16px rgba(0,200,255,0.2))",
                }}
              />
            </Box>

            {/* Text */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.05rem", sm: "1.2rem" },
                  color: "rgba(10, 20, 50, 0.9)",
                  lineHeight: 1.3,
                }}
              >
                {text}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "rgba(10, 20, 50, 0.45)",
                  mt: 0.75,
                  lineHeight: 1.65,
                  maxWidth: 320,
                  mx: "auto",
                }}
              >
                {description}
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
                  border: "1px solid rgba(0,0,0,0.08)",
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 48%, rgba(0,0,0,0.04) 100%)",
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
                      "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(0,200,255,0.14) 50%, rgba(255,255,255,0.02) 100%)",
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
                    bgcolor: "rgba(0,0,0,0.07)",
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
