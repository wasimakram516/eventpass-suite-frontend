"use client";

import { Box, Typography, Divider, Button, Stack } from "@mui/material";

export default function EventWheelCMSPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Event Wheel</Typography>
          <Typography variant="body2" color="text.secondary">
            Customize and trigger spin-to-win prize wheels.
          </Typography>
        </Box>
        <Button variant="contained" color="primary">Spin Settings</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for Event Wheel.
      </Typography>
    </Box>
  );
}
