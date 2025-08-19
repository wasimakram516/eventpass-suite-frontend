"use client";

import { Container, Grid, Typography, Divider, Stack } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "SurveyGuru",
    subtitle:
      "Create survey forms, manage recipients, and review responses.",
    formTitle: "Survey Forms",
    formDesc: "Create and manage reusable survey forms.",
    formBtn: "Open Forms",
    recTitle: "Recipients",
    recDesc: "Import, segment, and manage recipient lists.",
    recBtn: "Open Recipients",
    respTitle: "Responses",
    respDesc: "View and analyze submitted survey responses.",
    respBtn: "View Responses",
  },
  ar: {
    title: "سيرفي جورو",
    subtitle:
      "أنشئ نماذج الاستبيان، وأدر المُستلمين، وراجع الردود.",
    formTitle: "نماذج الاستبيان",
    formDesc: "إنشاء وإدارة نماذج استبيان قابلة لإعادة الاستخدام.",
    formBtn: "فتح النماذج",
    recTitle: "المُستلمون",
    recDesc: "استيراد وتقسيم وإدارة قوائم المُستلمين.",
    recBtn: "فتح المُستلمين",
    respTitle: "الردود",
    respDesc: "عرض وتحليل الردود المُقدَّمة.",
    respBtn: "عرض الردود",
  },
};

export default function SurveyGuruDashboard() {
  const { t, dir } = useI18nLayout(translations);

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      {/* Header */}
      <Stack spacing={1} alignItems="flex-start" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.subtitle}
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>

      {/* Cards */}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <DashboardCard
            title={t.formTitle}
            description={t.formDesc}
            buttonLabel={t.formBtn}
            icon={<ICONS.description />}
            color="#1976d2"
            route="/cms/modules/surveyguru/surveys/forms"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3}>
          <DashboardCard
            title={t.recTitle}
            description={t.recDesc}
            buttonLabel={t.recBtn}
            icon={<ICONS.group />}
            color="#8e24aa"
            route="/cms/modules/surveyguru/surveys/recipients"
          />
        </Grid>
      </Grid>
    </Container>
  );
}
