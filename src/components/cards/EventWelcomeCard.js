"use client";

import { Typography, Stack, Button, Box } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateWithShortMonth } from "@/utils/dateUtils";
import AppCard from "@/components/cards/AppCard";

export default function EventWelcomeCard({
  t,
  name,
  description,
  venue,
  startDate,
  endDate,
  router,
  dir,
  actionLabel,
  actionIcon,
  actionRoute,
  isArabic,
  hideActionButton = false,
  organizerName,
  organizerEmail,
  organizerPhone,
  contactOrganizer,
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
        {name}
      </Typography>

      {/* Description */}
      {description && (
        <Box
          sx={{
            fontSize: { xs: 16, md: 18 },
            color: "text.secondary",
            mb: 3,
            "& h1": { fontSize: "2em", fontWeight: "bold", margin: "0.67em 0" },
            "& h2": { fontSize: "1.5em", fontWeight: "bold", margin: "0.75em 0" },
            "& h3": { fontSize: "1.17em", fontWeight: "bold", margin: "0.83em 0" },
            "& ul, & ol": { margin: "1em 0", paddingLeft: "2.5em" },
            "& ul": { listStyleType: "disc" },
            "& ol": { listStyleType: "decimal" },
            "& li": { margin: "0.5em 0" },
            "& p": { margin: "1em 0" },
            "& strong, & b": { fontWeight: "bold" },
            "& em, & i": { fontStyle: "italic" },
            "& u": { textDecoration: "underline" },
            "& s, & strike": { textDecoration: "line-through" },
          }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {/* Venue */}
      <Stack
        direction="row"
        spacing={dir === "ltr" ? 1 : 0}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        <ICONS.location
          color="primary"
          sx={{
            ...(dir === "rtl" ? { ml: 1 } : { ml: 0 }),
          }}
        />
        <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
          {venue || t.dateNotAvailable}
        </Typography>
      </Stack>

      {/* Dates */}
      <Stack
        direction="row"
        spacing={dir === "ltr" ? 1 : 0}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        sx={{ my: 2 }}
      >
        <ICONS.event
          color="primary"
          sx={{
            ...(dir === "rtl" ? { ml: 1 } : { ml: 0 }),
          }}
        />
        {startDate && endDate ? (
          startDate === endDate ? (
            <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
              {formatDateWithShortMonth(
                startDate,
                isArabic ? "ar-SA" : "en-GB"
              )}
            </Typography>
          ) : (
            <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
              {`${formatDateWithShortMonth(
                startDate,
                isArabic ? "ar-SA" : "en-GB"
              )} ${t.to} ${formatDateWithShortMonth(
                endDate,
                isArabic ? "ar-SA" : "en-GB"
              )}`}
            </Typography>
          )
        ) : (
          <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
            {t.dateNotAvailable}
          </Typography>
        )}
      </Stack>

      {/* Organizer Contact Details */}
      {(organizerName || organizerEmail || organizerPhone) && (
        <Box
          sx={{
            width: "100%",
            mt: 3,
            mb: 2,
            p: 2,
            backgroundColor: "rgba(0, 74, 173, 0.05)",
            borderRadius: 2,
            border: "1px solid rgba(0, 74, 173, 0.1)",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 1.5,
              textAlign: "center",
              color: "text.secondary",
              fontSize: { xs: 14, md: 15 },
            }}
          >
            {contactOrganizer}
          </Typography>
          <Stack spacing={1.5} alignItems="center">
            {organizerName && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  fontSize: { xs: 16, md: 18 },
                  fontWeight: 600,
                  color: "primary.main",
                }}
              >
                <ICONS.person fontSize="small" color="primary" />
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: 16, md: 18 },
                    fontWeight: 600,
                    color: "primary.main",
                  }}
                >
                  {organizerName}
                </Typography>
              </Stack>
            )}
            {organizerEmail && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  fontSize: { xs: 14, md: 16 },
                  color: "text.primary",
                }}
              >
                <ICONS.email fontSize="small" color="primary" />
                <Typography
                  sx={{
                    color: "primary.main",
                  }}
                >
                  {organizerEmail}
                </Typography>
              </Stack>
            )}
            {organizerPhone && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  fontSize: { xs: 14, md: 16 },
                  color: "text.primary",
                }}
              >
                <ICONS.phone fontSize="small" color="primary" />
                <Typography
                  sx={{
                    color: "primary.main",
                  }}
                >
                  {organizerPhone}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      )}

      {/* Thank you message */}
      {/* <Typography
        variant="body2"
        sx={{
          fontSize: { xs: 14, md: 16 },
          color: "text.secondary",
          mb: 4,
        }}
      >
        {t.thankYou}
      </Typography> */}

      {/* Action button (centered) */}
      {!hideActionButton && (
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
              },
              ...getStartIconSpacing(dir),
            }}
          >
            {actionLabel}
          </Button>
        </Box>
      )}

      {/* Footer note */}
      {/* <Stack
        direction="row"
        spacing={dir === "ltr" ? 1 : 0}
        justifyContent="center"
        alignItems="center"
        mt={3}
      >
        <ICONS.time fontSize="small" color="primary" sx={{
          ...(dir === "rtl" ? { ml: 1 } : { ml: 0 })
        }} />
        <Typography variant="caption" fontSize={14}>
          {t.takesSeconds}
        </Typography>
      </Stack> */}
    </AppCard>
  );
}
