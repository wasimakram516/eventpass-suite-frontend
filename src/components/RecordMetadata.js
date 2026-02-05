"use client";

import { Box } from "@mui/material";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";

const iconSx = { fontSize: "0.875rem", flexShrink: 0, opacity: 0.9 };
const rowSx = {
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: "2px 3px",
  minHeight: 20,
  whiteSpace: "nowrap",
};

function RecordMetadata({
  createdBy,
  updatedBy,
  createdAt,
  updatedAt,
  locale = "en-GB",
  createdByLabel = "Created:",
  updatedByLabel = "Updated:",
  createdAtLabel,
  updatedAtLabel,
  createdByDisplayName,
  updatedByDisplayName,
  updatedAtFallback,
  sx = {},
}) {
  const nameFromUser = (user) =>
    user && (typeof user === "object" ? user.name : user) ? (typeof user === "object" ? user.name : user) : null;
  const createdByName = nameFromUser(createdBy) ?? createdByDisplayName ?? "N/A";
  const rawUpdatedByName = nameFromUser(updatedBy) ?? updatedByDisplayName ?? "N/A";
  const dateStr = (d) => (d ? formatDateTimeWithLocale(d, locale) : "N/A");
  const updatedAtDisplay = updatedAt ?? updatedAtFallback;
  const eitherUpdatedNA = !updatedAtDisplay || rawUpdatedByName === "N/A";
  const updatedByName = eitherUpdatedNA ? "N/A" : rawUpdatedByName;
  const updatedAtForDisplay = eitherUpdatedNA ? undefined : updatedAtDisplay;

  const PersonIcon = ICONS.person ?? ICONS.personOutline;
  const TimeIcon = ICONS.time ?? ICONS.timeOutline;

  return (
    <Box
      sx={{
        mt: 1.5,
        pt: 1.5,
        pb: 1.5,
        pl: 1.5,
        pr: 2.5,
        borderTop: "1px solid",
        borderColor: "divider",
        fontStyle: "italic",
        fontSize: "0.75rem",
        lineHeight: 1.5,
        color: "text.secondary",
        ...sx,
      }}
    >
      <Box sx={{ ...rowSx, mb: 0.5 }}>
        <Box component="span" sx={{ fontWeight: 600 }}>{createdByLabel}</Box>
        {PersonIcon && <PersonIcon sx={iconSx} />}
        <Box component="span">{createdByName}</Box>
        {TimeIcon && <TimeIcon sx={iconSx} />}
        <Box component="span">{dateStr(createdAt)}</Box>
      </Box>
      <Box sx={rowSx}>
        <Box component="span" sx={{ fontWeight: 600 }}>{updatedByLabel}</Box>
        {PersonIcon && <PersonIcon sx={iconSx} />}
        <Box component="span">{updatedByName}</Box>
        {TimeIcon && <TimeIcon sx={iconSx} />}
        <Box component="span">{dateStr(updatedAtForDisplay)}</Box>
      </Box>
    </Box>
  );
}

export default RecordMetadata;
