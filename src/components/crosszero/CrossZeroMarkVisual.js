"use client";

import { Box, Typography } from "@mui/material";

const MARK_STYLES = {
  X: {
    fallback: "✕",
    color: "#00e5ff",
    shadow: "0 0 16px rgba(0,229,255,0.75)",
  },
  O: {
    fallback: "○",
    color: "#ff6b6b",
    shadow: "0 0 16px rgba(255,107,107,0.75)",
  },
};

export default function CrossZeroMarkVisual({
  mark = "X",
  xImage,
  oImage,
  size = 28,
  fallbackSize,
  color,
  shadow,
  alt,
  sx,
}) {
  const resolvedMark = mark === "O" ? "O" : "X";
  const config = MARK_STYLES[resolvedMark];
  const imageSrc = resolvedMark === "X" ? xImage : oImage;

  if (imageSrc) {
    return (
      <Box
        component="img"
        src={imageSrc}
        alt={alt || resolvedMark}
        sx={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          userSelect: "none",
          ...sx,
        }}
      />
    );
  }

  return (
    <Typography
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        userSelect: "none",
        fontWeight: 900,
        fontSize: fallbackSize || size,
        color: color || config.color,
        textShadow: shadow || config.shadow,
        ...sx,
      }}
    >
      {config.fallback}
    </Typography>
  );
}
