"use client";

import { Box, Typography } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    selectBusiness: "Please select a business to continue",
  },
  ar: {
    selectBusiness: "يرجى اختيار نشاط تجاري للمتابعة",
  },
};

export default function EmptyBusinessState() {
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
      <ICONS.business sx={{ fontSize: 72, mb: 2, color: "#ccc" }} />
      <Typography variant="h6">{t.selectBusiness}</Typography>
    </Box>
  );
}
