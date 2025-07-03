"use client";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { Box, Typography, Divider, Button, Stack, Container } from "@mui/material";

export default function EventDuelCMSPage() {
  return (
    <Container>
      <BreadcrumbsNav/>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Event Duel</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage real-time 1v1 quiz battles and match settings.
          </Typography>
        </Box>
        <Button variant="contained" color="primary">Create Duel</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for Event Duel.
      </Typography>
    </Container>
  );
}
