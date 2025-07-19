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

export default function NoDataAvailable({color = "#ccc"}) {
  const { t } = useI18nLayout(translations);

  return (
    <Box
      sx={{
        mt: 8,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <ICONS.empty sx={{ fontSize: 72, mb: 2, color }} />
      <Typography sx={{ color }} variant="h6">
        {t.noData}
      </Typography>
    </Box>
  );
}
