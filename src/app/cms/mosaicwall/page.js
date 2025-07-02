"use client";

import { Box, Typography, Divider, Button, Stack } from "@mui/material";

export default function MosaicWallCMSPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">MosaicWall</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and review real-time photo and text submissions.
          </Typography>
        </Box>
        <Button variant="contained" color="primary">View Submissions</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for MosaicWall.
      </Typography>
    </Box>
  );
}
