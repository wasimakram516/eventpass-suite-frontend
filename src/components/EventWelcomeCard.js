"use client";

import { Typography, Stack, Button, Box } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateWithShortMonth } from "@/utils/dateUtils";
import AppCard from "@/components/cards/AppCard";

export default function EventWelcomeCard({
  t,
  name,
  venue,
  startDate,
  endDate,
  router,
  dir,
  actionLabel,
  actionIcon,
  actionRoute,
}) {
  return (
    <AppCard
      dir={dir}
      sx={{
        width: "100%",
        maxWidth: 800,
        textAlign: "center",
        p: 4,
      }}
    >
      {/* Title */}
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{
          fontSize: { xs: 28, md: 36 },
          color: "primary.main",
          letterSpacing: "1.5px",
          mb: 2,
        }}
      >
        {t.welcome} {name}
      </Typography>

      {/* Venue */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        <ICONS.location color="primary" />
        <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
          {venue || t.dateNotAvailable}
        </Typography>
      </Stack>

      {/* Dates */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        sx={{ my: 2 }}
      >
        <ICONS.event color="primary" />
        {startDate && endDate ? (
          startDate === endDate ? (
            <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
              {formatDateWithShortMonth(startDate)}
            </Typography>
          ) : (
            <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
              {`${formatDateWithShortMonth(startDate)} ${t.to} ${formatDateWithShortMonth(endDate)}`}
            </Typography>
          )
        ) : (
          <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
            {t.dateNotAvailable}
          </Typography>
        )}
      </Stack>

      {/* Thank you message */}
      <Typography
        variant="body2"
        sx={{
          fontSize: { xs: 14, md: 16 },
          color: "text.secondary",
          mb: 4,
        }}
      >
        {t.thankYou}
      </Typography>

      {/* Action button (centered) */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.replace(actionRoute)}
          startIcon={actionIcon}
          sx={{
            width: "100%",
            maxWidth: 300,
            fontSize: { xs: 16, md: 18 },
            p: "12px",
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            background: "primary.main",
            transition: "0.3s",
            "&:hover": {
              background: "secondary.main",
              transform: "scale(1.05)",
            },
            ...getStartIconSpacing(dir),
          }}
        >
          {actionLabel}
        </Button>
      </Box>

      {/* Footer note */}
      <Stack
        direction="row"
        spacing={dir === "ltr" ? 1 : 0}
        justifyContent="center"
        alignItems="center"
        mt={3}
      >
        <ICONS.time fontSize="small" color="primary" />
        <Typography variant="caption" fontSize={14}>
          {t.takesSeconds}
        </Typography>
      </Stack>
    </AppCard>
  );
}
