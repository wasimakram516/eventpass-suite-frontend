"use client";

import { Box, Stack, Typography } from "@mui/material";

/** Shared title, description, and action layout for CMS module working pages. */
export default function ModuleWorkingHeader({ title, description, actions }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        gap: 2,
        mt: 2,
        mb: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Box>
  );
}
