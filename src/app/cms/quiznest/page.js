"use client";

import { Box, Typography, Divider, Button, Stack } from "@mui/material";

export default function QuiznestCMSPage() {
  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Quiznest
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage single-player quizzes, questions, and timers.
          </Typography>
        </Box>

        <Button variant="contained" color="primary">
          Create Quiz
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Main Content Here */}
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for Quiznest.
      </Typography>
    </Box>
  );
}
