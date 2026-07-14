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
      }}
    />
  );
}