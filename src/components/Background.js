"use client";

import { Box } from "@mui/material";
import { Shift } from "ambient-cbg";

export default function Background({ type = "static" }) {
  if (type === "dynamic") {
    return (
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Shift />
      </Box>
    );
  }

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: `
          radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
          radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
          radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
          radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
          linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
        `,
        filter: "saturate(1.05)",
      }}
    />
  );
}
