"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Stack,
  Divider,
} from "@mui/material";

import DashboardCard from "@/components/DashboardCard";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    welcomeTitle: "Welcome to Mosaic Wall CMS",
    welcomeDescription: "You have full access to manage walls and uploads.",
    wallsTitle: "Walls",
    wallsDescription: "View and manage your walls.",
    wallsButton: "Manage Walls",
    uploadsTitle: "Uploads",
    uploadsDescription: "View and manage your Uploads.",
    uploadsButton: "Manage Uploads",
  },
  ar: {
    welcomeTitle: "مرحباً بك في نظام إدارة محتوى جدار الفسيفساء",
    welcomeDescription: "لديك وصول كامل لإدارة الجدران والتحميلات.",
    wallsTitle: "الجدران",
    wallsDescription: "عرض وإدارة جدرانك.",
    wallsButton: "إدارة الجدران",
    uploadsTitle: "التحميلات",
    uploadsDescription: "عرض وإدارة تحميلاتك.",
    uploadsButton: "إدارة التحميلات",
  },
};
export default function CmsDashboard() {
  const { t, dir } = useI18nLayout(translations);
  return (
    <Container maxWidth="lg" dir={dir} sx={{ mb: 6 }}>
      {/* Heading Section */}
      <Box sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ my: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t.welcomeTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t.welcomeDescription}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mt: 1 }} />
      </Box>

      {/* CMS Navigation Cards */}
      <Grid container spacing={3} justifyContent={"center"} sx={{ mt: 1 }}>
        <DashboardCard
          title={t.wallsTitle}
          description={t.wallsDescription}
          buttonLabel={t.wallsButton}
          icon={<ICONS.wallpaper />}
          color="primary.main"
          route="/cms/modules/mosaicwall/walls-setup/walls"
        />
        <DashboardCard
          title={t.uploadsTitle}
          description={t.uploadsDescription}
          buttonLabel={t.uploadsButton}
          icon={<ICONS.uploadIcon />}
          color="#ff7043"
          route="/cms/modules/mosaicwall/walls-setup/uploads"
        />
      </Grid>
    </Container>
  );
}
