"use client";

import { Box, CircularProgress } from "@mui/material";

/**
 * Displays a fullscreen loading spinner.
 * Can be used as a loading state placeholder for full-page content.
 */
export default function LoadingState() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        textAlign: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
