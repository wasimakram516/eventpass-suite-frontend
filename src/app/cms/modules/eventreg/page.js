"use client";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { Box, Typography, Divider, Button, Stack, Container } from "@mui/material";

export default function EventRegCMSPage() {
  return (
    <Container>
      <BreadcrumbsNav/>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Event Reg</Typography>
          <Typography variant="body2" color="text.secondary">
            Build and manage custom registration forms.
          </Typography>
        </Box>
        <Button variant="contained" color="primary">Add Form</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        This is the main CMS content area for Event Reg.
      </Typography>
    </Container>
  );
}
