"use client";

import { Box, useTheme } from "@mui/material";
import { Shift } from "ambient-cbg";

export default function Background({ type = "static" }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (type === "dynamic") {
    return <Shift />;
  }

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: isDark
          ? theme.palette.ambient.staticBackground.dark
          : theme.palette.ambient.staticBackground.light,

        filter: theme.palette.ambient.saturate,
        filter: "saturate(1.05)",
        // Forces its own GPU compositing layer — a fixed, filtered background
        // behind scrollable content otherwise fails to repaint newly
        // scrolled-into-view regions on some mobile browsers (iOS Safari,
        // some Android WebViews) until scrolling back up and down again.
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    />
  );
}