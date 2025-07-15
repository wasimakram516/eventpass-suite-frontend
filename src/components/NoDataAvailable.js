"use client";

import { Box, Typography } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    noData: "No data available to display.",
  },
  ar: {
    noData: "لا توجد بيانات لعرضها.",
  },
};

export default function NoDataAvailable() {
  const { t } = useI18nLayout(translations);

  return (
    <Box
      sx={{
        mt: 8,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "text.secondary",
      }}
    >
      <ICONS.empty sx={{ fontSize: 72, mb: 2, color: "#ccc" }} />
      <Typography variant="h6">{t.noData}</Typography>
    </Box>
  );
}
