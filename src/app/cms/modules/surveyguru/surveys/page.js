"use client";

import { Box, Container, Typography, Divider, Stack } from "@mui/material";
import DashboardCard from "@/components/cards/DashboardCard";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { NEUTRAL_ACCENT } from "@/styles/theme";

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
    <Container dir={dir} maxWidth={false} disableGutters>
      <BreadcrumbsNav />
      {/* Header */}
      <Stack
        spacing={1}
        sx={{
          alignItems: "flex-start",
          mb: 4
        }}>
        <Typography variant="h4" sx={{
          fontWeight: "bold"
        }}>
          {t.title}
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          {t.subtitle}
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>
      {/* Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
          <DashboardCard
            title={t.formTitle}
            description={t.formDesc}
            buttonLabel={t.formBtn}
            icon={<ICONS.description />}
            color={NEUTRAL_ACCENT}
            route="/cms/modules/surveyguru/surveys/forms"
          />
          <DashboardCard
            title={t.recTitle}
            description={t.recDesc}
            buttonLabel={t.recBtn}
            icon={<ICONS.group />}
            color={NEUTRAL_ACCENT}
            route="/cms/modules/surveyguru/surveys/recipients"
          />
      </Box>
    </Container>
  );
}
