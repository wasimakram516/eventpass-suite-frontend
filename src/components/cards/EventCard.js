"use client";

import {
  Box,
  Chip,
  Typography,
  CardContent,
  CardActions,
  Tooltip,
  IconButton,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import InitialsPlaceholder from "@/components/InitialsPlaceholder";
import ICONS from "@/utils/iconUtil";
import { formatDate, formatDateWithTime, formatTime } from "@/utils/dateUtils";

export default function EventCardBase({
  event, // event object (works for public or closed)
  t,
  status, // eventStatus or computed status
  showRegistrations = true, // toggle for public vs closed
  onView,
  onViewWhatsAppLogs,
  onEdit,
  onDelete,
  onShare,
  onInsights,
}) {
  return (
    <AppCard sx={{ width: { xs: "100%", sm: 360 }, height: "100%" }}>
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
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0) 90%)",
            p: 2,
            color: "white",
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
                color: "white",
                fontWeight: "bold",
                textTransform: "uppercase",
                mb: 1,
                borderRadius: 1.5,
                px: 1,
                "& .MuiChip-icon": { color: "white", ml: 0.5 },
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
                    ? formatDateWithTime(event.startDate, event.startTime, "en-GB", eventTimezone)
                    : formatDate(event.startDate);
                  const endFormatted = event.endTime
                    ? formatDateWithTime(event.endDate, event.endTime, "en-GB", eventTimezone)
                    : formatDate(event.endDate);
                  return `${startFormatted} → ${endFormatted}`;
                } else {
                  const dateFormatted = event.startTime
                    ? formatDateWithTime(event.startDate, event.startTime, "en-GB", eventTimezone)
                    : formatDate(event.startDate);
                  if (event.startTime && event.endTime && event.startTime !== event.endTime) {
                    return `${dateFormatted} - ${formatTime(event.endTime, "en-GB", eventTimezone, event.startDate)}`;
                  }
                  return dateFormatted;
                }
              })()
            : "N/A"}
        </Typography>

        {/* Registrations (public only) */}
        {showRegistrations && (
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
            {event.registrations}
          </Typography>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions
        sx={{
          justifyContent: "space-around",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          p: 1,
          bgcolor: "rgba(0,0,0,0.02)",
        }}
      >
        {onView && (
          <Tooltip title={t.viewRegs}>
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
        {onViewWhatsAppLogs && (
        <Tooltip title={t.viewWhatsAppLogs || "View WhatsApp Logs"}>
          <IconButton
            onClick={onViewWhatsAppLogs}
            sx={{
              color: "#25D366", // WhatsApp green
              "&:hover": {
                transform: "scale(1.1)",
                backgroundColor: "rgba(37, 211, 102, 0.12)",
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
