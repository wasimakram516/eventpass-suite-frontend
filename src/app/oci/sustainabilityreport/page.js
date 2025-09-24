"use client";
import { useEffect } from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

export default function DownloadPage() {
  useEffect(() => {
    const link = document.createElement("a");
    link.href = "/api/download/oci/sustainabilityreport";
    link.click();
  }, []);

  return (
    <Box
      sx={{
        height: "calc(100vh - 40px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f9f9f9",
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CloudDownloadIcon sx={{ fontSize: 60, color: "primary.main" }} />
        <Typography variant="h6" color="textPrimary">
          Downloading Sustainability Report...
        </Typography>
        <CircularProgress size={32} />
      </Stack>
    </Box>
  );
}
