"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

// This page has been merged into /player — redirect immediately.
export default function CrossZeroPlayerDetailsRedirect() {
  const router = useRouter();
  const { gameSlug } = useParams();

  useEffect(() => {
    router.replace(`/crosszero/${gameSlug}/player`);
  }, [gameSlug, router]);

  return (
    <Box
      sx={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <CircularProgress />
    </Box>
  );
}
