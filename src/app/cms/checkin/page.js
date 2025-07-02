"use client";

import { Box, Typography, Divider, Button, Stack } from "@mui/material";

export default function CheckInCMSPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Check-In</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and control attendee check-in process.
          </Typography>
        </Box>
        <Button variant="contained" color="primary">Start Check-In</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for Check-In.
      </Typography>
    </Box>
  );
}
