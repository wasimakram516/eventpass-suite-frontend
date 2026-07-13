"use client";

import {
  Box,
  Chip,
  Typography,
  CardContent,
  CardActions,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import InitialsPlaceholder from "@/components/InitialsPlaceholder";
import RecordMetadata from "@/components/RecordMetadata";
import ICONS from "@/utils/iconUtil";
import { formatDate, formatDateWithTime, formatTime } from "@/utils/dateUtils";
import { toArabicDigits } from "@/utils/arabicDigits";

export default function EventCardBase({
  event, // event object (works for public or closed)
  t,
  status, // eventStatus or computed status
  showRegistrations = true, // toggle for public vs closed
  showPollCount = false, // toggle for showing poll count instead of registrations
  hideVenue = false, // hide venue field
  hideDates = false, // hide dates field
  showAudit = false, // show created/updated metadata
  locale = "en-GB",
  onView,
  onViewWhatsAppLogs,
  onEdit,
  onDelete,
  onShare,
  onClone,
  onInsights,
  onViewResults,
  onViewFullScreen,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const language = locale === "ar-SA" ? "ar" : "en";
  return (
    <AppCard sx={{ width: { xs: "100%", sm: 360 } }}>
      {/* Cover Image + Overlay */}
      <Box sx={{ position: "relative", height: 200 }}>
        {event.logoUrl ? (
          <Box
            component="img"
            src={event.logoUrl}
            alt={event.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <InitialsPlaceholder name={event.name} size={200} variant="rounded" />
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            background: (theme) => theme.palette.overlay.cardImageOverlayGradient,
            p: 2,
            color: "common.white",
          }}
        >
          {status && (
            <Chip
              icon={
                status === "Expired" ? (
                  <ICONS.errorOutline fontSize="small" />
                ) : status === "Current" ? (
                  <ICONS.checkCircle fontSize="small" />
                ) : (
                  <ICONS.info fontSize="small" />
                )
              }
              label={status}
              size="small"
              sx={{
                bgcolor:
                  status === "Expired"
                    ? "error.main"
                    : status === "Current"
                      ? "primary.main"
                      : "success.main",
                color: "primary.contrastText",
                fontWeight: "bold",
                textTransform: "uppercase",
                mb: 1,
                borderRadius: 1.5,
                px: 1,
                "& .MuiChip-icon": { color: "primary.contrastText", ml: 0.5 },
              }}
            />
          )}

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.name}
          </Typography>
        </Box>
      </Box>

      {/* Info Section */}
      <CardContent sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {/* Venue */}
        {!hideVenue && (
          <Typography
            variant="body2"
            sx={{
              mb: 0.7,
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
            }}
          >
            <ICONS.location fontSize="small" sx={{ opacity: 0.7 }} />
            {event.venue || "N/A"}
          </Typography>
        )}

        {/* Slug */}
        <Typography
          variant="body2"
          sx={{
            mb: 0.7,
            color: "text.secondary",
            display: "flex",
            alignItems: "center",
            gap: 0.8,
          }}
        >
          <ICONS.qrcode fontSize="small" sx={{ opacity: 0.7 }} />
          <strong>{t.slugLabel}</strong>&nbsp;{event.slug}
        </Typography>

        {/* Dates */}
        {!hideDates && (
          <Typography
            variant="body2"
            sx={{
              mb: 0.7,
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              flexWrap: "wrap",
            }}
          >
            <ICONS.event fontSize="small" sx={{ opacity: 0.7 }} />
            <strong>{t.dateRange}:</strong>&nbsp;
            {event?.startDate
              ? (() => {
                const eventTimezone = event.timezone || null;
                if (event?.endDate && event.endDate !== event.startDate) {
                  const startFormatted = event.startTime
                    ? formatDateWithTime(event.startDate, event.startTime, locale, eventTimezone)
                    : formatDate(event.startDate, locale);
                  const endFormatted = event.endTime
                    ? formatDateWithTime(event.endDate, event.endTime, locale, eventTimezone)
                    : formatDate(event.endDate, locale);
                  return `${startFormatted} → ${endFormatted}`;
                } else {
                  const dateFormatted = event.startTime
                    ? formatDateWithTime(event.startDate, event.startTime, locale, eventTimezone)
                    : formatDate(event.startDate, locale);
                  if (event.startTime && event.endTime && event.startTime !== event.endTime) {
                    return `${dateFormatted} - ${formatTime(event.endTime, locale, eventTimezone, event.startDate)}`;
                  }
                  return dateFormatted;
                }
              })()
              : "N/A"}
          </Typography>
        )}

        {/* Registrations (public only) */}
        {showRegistrations && !showPollCount && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
            }}
          >
            <ICONS.people fontSize="small" sx={{ opacity: 0.7 }} />
            <strong>{t.registrations}:</strong>&nbsp;
            {toArabicDigits(event.registrations, language)}
          </Typography>
        )}
        {/* Poll Count (votecast only) */}
        {showPollCount && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
            }}
          >
            <ICONS.poll fontSize="small" sx={{ opacity: 0.7 }} />
            <strong>{t.polls || "Polls"}:</strong>&nbsp;
            {toArabicDigits(event.pollCount || 0, language)}
          </Typography>
        )}
      </CardContent>

      {showAudit && (
        <RecordMetadata
          createdByName={event.createdBy}
          updatedByName={event.updatedBy}
          createdAt={event.createdAt}
          updatedAt={event.updatedAt}
          locale={locale}
        />
      )}

      {/* Actions */}
      <CardActions
        sx={{
          justifyContent: "space-around",
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: "action.hover",
          p: 1,
        }}
      >
        {onView && (
          <Tooltip title={t.viewPolls || t.viewRegs || "View Polls"}>
            <IconButton
              color="primary"
              onClick={onView}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.view />
            </IconButton>
          </Tooltip>
        )}
        {onViewResults && (
          <Tooltip title={t.viewResults || "View Results"}>
            <IconButton
              color="secondary"
              onClick={onViewResults}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.results />
            </IconButton>
          </Tooltip>
        )}
        {onViewWhatsAppLogs && (
          <Tooltip title={t.viewWhatsAppLogs || "View WhatsApp Logs"}>
            <IconButton
              onClick={onViewWhatsAppLogs}
              sx={{
                color: "success.main",
                "&:hover": {
                  transform: "scale(1.1)",
                  backgroundColor: "action.hover",
                },
                transition: "0.2s",
              }}
            >
              <ICONS.whatsapp />
            </IconButton>
          </Tooltip>
        )}
        {onInsights && (
          <Tooltip title={t.insights || "Insights"}>
            <IconButton
              color="info"
              onClick={onInsights}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.insights />
            </IconButton>
          </Tooltip>
        )}
        {onViewFullScreen && (
          <Tooltip title={t.viewFullScreen || "Full Screen"}>
            <IconButton
              color="success"
              onClick={onViewFullScreen}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.fullscreen />
            </IconButton>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip title={t.edit}>
            <IconButton
              color="warning"
              onClick={onEdit}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.edit />
            </IconButton>
          </Tooltip>
        )}
        {onClone && (
          <Tooltip title={t.clone || "Clone"}>
            <IconButton
              color="info"
              onClick={onClone}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.copy />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title={t.delete}>
            <IconButton
              color="error"
              onClick={onDelete}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.delete />
            </IconButton>
          </Tooltip>
        )}
        {onShare && (
          <Tooltip title={t.shareTitle || "Share"}>
            <IconButton
              color="primary"
              onClick={onShare}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "0.2s",
              }}
            >
              <ICONS.share />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </AppCard>
  );
}
