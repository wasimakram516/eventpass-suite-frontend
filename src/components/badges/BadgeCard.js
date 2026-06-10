import React from "react";
import { Box, Divider, Paper, Typography, alpha } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { formatDate } from "@/utils/dateUtils";

export const MODULE_EVENTREG = "eventreg";
export const MODULE_CHECKIN = "checkin";

export const BADGE_COLORS = {
  primary: "#128199",
  primaryDark: "#0a5e71",
  primaryDeep: "#083b4f",
  accent: "#ffcc00",
  ink: "#073642",
  inkSoft: "#58707a",
  line: "#dbe8ec",
  surface: "#f7fbfc",
  white: "#ffffff",
};

export function pickFullName(registration) {
  if (registration?.fullName) return registration.fullName;

  if (registration?.customFields) {
    const fields =
      registration.customFields instanceof Map
        ? Object.fromEntries(registration.customFields)
        : registration.customFields;

    for (const [key, value] of Object.entries(fields)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
      if (["fullname", "name"].includes(normalizedKey) && value) {
        return String(value);
      }
    }

    const firstName = Object.entries(fields).find(([key]) =>
      key.toLowerCase().includes("first")
    );
    const lastName = Object.entries(fields).find(([key]) =>
      key.toLowerCase().includes("last")
    );

    if (firstName || lastName) {
      return [firstName?.[1], lastName?.[1]].filter(Boolean).join(" ");
    }
  }

  return null;
}

export function pickRegistrationType(registration) {
  if (!registration?.customFields) return null;

  const fields =
    registration.customFields instanceof Map
      ? Object.fromEntries(registration.customFields)
      : registration.customFields;

  for (const [key, value] of Object.entries(fields)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (
      ["registrationtype", "tickettype", "passtype", "attendeetype"].includes(
        normalizedKey
      ) &&
      value
    ) {
      return String(value);
    }
  }

  return null;
}

export function getEventDateLabel(event) {
  if (!event?.startDate) return "";

  return `${formatDate(event.startDate)}${event.endDate && event.endDate !== event.startDate
      ? ` - ${formatDate(event.endDate)}`
      : ""
    }`;
}

export function getModuleLabel(module, t) {
  if (module === MODULE_CHECKIN) return t?.checkInFilter || "Check-In";
  if (module === MODULE_EVENTREG) return t?.eventRegFilter || "Event Reg";
  return t?.badgeTitle || "Your Badge";
}

export function getBadgeDetailRows(event, registration, t) {
  const ticketType = pickRegistrationType(registration) || registration?.ticketTypeName || (t?.noTicket || "Attendee");
  const dateLabel = getEventDateLabel(event);

  return [
    { label: t?.ticket || "Ticket", value: ticketType },
    ...(dateLabel ? [{ label: t?.date || "Date", value: dateLabel }] : []),
    ...(event?.venue ? [{ label: t?.venue || "Venue", value: event.venue }] : []),
  ];
}

export default function BadgeCard({ event, module, registration, qrRef, t, compact = false }) {
  const attendeeName = pickFullName(registration) || (t?.noName || "Attendee");
  const detailRows = getBadgeDetailRows(event, registration, t);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        maxWidth: 430,
        mx: "auto",
        overflow: "hidden",
        borderRadius: "30px",
        background: `linear-gradient(180deg, ${BADGE_COLORS.white} 0%, ${BADGE_COLORS.surface} 100%)`,
        border: `1px solid ${alpha(BADGE_COLORS.primary, 0.14)}`,
        boxShadow: `0 28px 70px ${alpha(BADGE_COLORS.primaryDeep, 0.24)}`,
      }}
    >
      <Box
        sx={{
          position: "relative",
          px: { xs: 2.5, sm: 3 },
          pt: compact ? 2 : 3,
          pb: compact ? 2 : 4.25,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${BADGE_COLORS.primaryDeep} 0%, ${BADGE_COLORS.primary} 56%, #40c0d5 100%)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            top: -72,
            right: -48,
            bgcolor: alpha(BADGE_COLORS.white, 0.08),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            bottom: -60,
            left: -28,
            bgcolor: alpha(BADGE_COLORS.white, 0.05),
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>
          <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
            <Typography
              variant="body2"
              sx={{ color: alpha(BADGE_COLORS.white, 0.78), mb: compact ? 0.5 : 0.75 }}
            >
              {t?.badgeTitle || "Your Badge"}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: BADGE_COLORS.white,
                lineHeight: 1.15,
                wordBreak: "break-word"
              }}>
              {event?.name}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 3, textAlign: "start" }}>
        <Typography
          variant="caption"
          sx={{
            color: BADGE_COLORS.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 1.4,
          }}
        >
          {t?.attendee || "Attendee"}
        </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: BADGE_COLORS.ink,
                lineHeight: 1.05,
                mt: 0.5,
                mb: compact ? 1 : 2.25,
                wordBreak: "break-word"
              }}>
          {attendeeName}
        </Typography>

        <Box
          sx={{
            mb: compact ? 1 : 2.25,
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: alpha(BADGE_COLORS.white, 0.88),
            border: `1px solid ${alpha(BADGE_COLORS.primary, 0.12)}`,
          }}
        >
          {detailRows.map((row, index) => (
            <Box
              key={row.label}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom:
                  index < detailRows.length - 1
                    ? `1px solid ${alpha(BADGE_COLORS.primary, 0.1)}`
                    : "none",
                bgcolor:
                  index % 2 === 0
                    ? alpha(BADGE_COLORS.primary, 0.03)
                    : "transparent",
                textAlign: "start"
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: BADGE_COLORS.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                }}
              >
                {row.label}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: BADGE_COLORS.ink,
                  lineHeight: 1.45,
                  mt: 0.45,
                  wordBreak: "break-word"
                }}>
                {row.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            p: compact ? 1.25 : 2,
            borderRadius: "26px",
            background: alpha(BADGE_COLORS.white, 0.92),
            border: `1px solid ${alpha(BADGE_COLORS.primary, 0.12)}`,
            boxShadow: `0 14px 30px ${alpha(BADGE_COLORS.primaryDeep, 0.08)}`,
            mb: compact ? 0.75 : 1.5,
          }}
        >
          <Box
            ref={qrRef}
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: registration?.token ? 1.5 : 0,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: BADGE_COLORS.white,
                border: "1px solid #e4eef1",
              }}
            >
              <QRCodeCanvas
                value={registration?.token || registration?._id || "preview-qr"}
                size={170}
                bgColor={BADGE_COLORS.white}
                fgColor={BADGE_COLORS.primaryDark}
                includeMargin={false}
              />
            </Box>
          </Box>

          {registration?.token && (
            <Box
              sx={{
                px: compact ? 1.25 : 1.75,
                py: compact ? 0.5 : 0.85,
                borderRadius: 999,
                bgcolor: alpha(BADGE_COLORS.primary, 0.08),
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: BADGE_COLORS.primaryDark,
                  letterSpacing: 0.8,
                  wordBreak: "break-all"
                }}>
                {t?.token || "Token"}: {registration.token}
              </Typography>
            </Box>
          )}
        </Box>
        <Divider sx={{ mb: compact ? 0.5 : 1.5 }} />

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            color: BADGE_COLORS.inkSoft
          }}>
          {t?.poweredBy || "Powered by"} eventPass
        </Typography>
      </Box>
    </Paper>
  );
}
