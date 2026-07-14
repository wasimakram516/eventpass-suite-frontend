"use client";

import { Box, Typography } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import { wrapTextBox } from "@/utils/wrapTextStyles";

// Stacked label/value row used across the registration-listing cards
// (EventReg, CheckIn, DigiPass) — small label caption on top, value below,
// instead of a side-by-side left-label/right-value split.
export default function RegistrationFieldRow({ label, value, dir = "ltr" }) {
  return (
    <Box
      sx={{
        py: 0.8,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          color: "text.secondary",
          fontWeight: 600,
          ...wrapTextBox,
        }}
      >
        <ICONS.personOutline fontSize="small" sx={{ opacity: 0.6, flexShrink: 0 }} />
        {label}
      </Typography>
      <Typography
        component="div"
        variant="body2"
        sx={{
          color: "text.primary",
          mt: 0.3,
          textAlign: dir === "rtl" ? "right" : "left",
          ...wrapTextBox,
        }}
      >
        {value ?? "—"}
      </Typography>
    </Box>
  );
}
