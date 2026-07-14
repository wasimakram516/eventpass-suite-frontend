"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

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
  const theme = useTheme();

  const MARK_STYLES = {
    X: {
      fallback: "✕",
      color: theme.palette.crosszero.markX,
      shadow: theme.palette.crosszero.markXFallbackGlow,
    },
    O: {
      fallback: "○",
      color: theme.palette.crosszero.markO,
      shadow: theme.palette.crosszero.markOFallbackGlow,
    },
  };

  const resolvedMark = mark === "O" ? "O" : "X";
  const config = MARK_STYLES[resolvedMark];
  const imageSrc = resolvedMark === "X" ? xImage : oImage;
  const resolvedColor = color || config.color;
  const resolvedShadow = shadow || config.shadow;

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
        color: resolvedColor,
        textShadow: resolvedShadow,
        ...sx,
      }}
    >
      {config.fallback}
    </Typography>
  );
}