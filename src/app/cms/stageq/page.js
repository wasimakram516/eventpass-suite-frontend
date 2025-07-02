"use client";

import { Box, Typography, Divider, Button, Stack } from "@mui/material";

export default function StageQCMSPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">StageQ</Typography>
          <Typography variant="body2" color="text.secondary">
            Review and moderate audience-submitted questions.
          </Typography>
        </Box>
        <Button variant="contained" color="primary">Moderate Queue</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for StageQ.
      </Typography>
    </Box>
  );
}
