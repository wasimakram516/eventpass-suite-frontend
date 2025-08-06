"use client";

import { Container, Grid, Typography, Stack, Divider } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Event Queries Management",
    description:
      "Share QR code links, manage submitted questions, and track visitor activity during live events.",
    shareLinksTitle: "Share Business Links",
    shareLinksDescription:
      "Copy public-facing QR code links for each business.",
    shareLinksButton: "Open Links",
    visitorsTitle: "Manage Visitors",
    visitorsDescription: "View all visitors who submitted questions.",
    visitorsButton: "View Visitors",
    questionsTitle: "Manage Questions",
    questionsDescription: "Review, filter, and mark submitted questions.",
    questionsButton: "View Questions",
  },
  ar: {
    title: "إدارة استفسارات الأحداث",
    description:
      "شارك روابط رمز الاستجابة السريعة، وإدارة الأسئلة المرسلة، وتتبع نشاط الزوار أثناء الأحداث المباشرة.",
    shareLinksTitle: "مشاركة روابط الأعمال",
    shareLinksDescription: "نسخ روابط رمز الاستجابة السريعة العامة لكل عمل.",
    shareLinksButton: "فتح الروابط",
    visitorsTitle: "إدارة الزوار",
    visitorsDescription: "عرض جميع الزوار الذين أرسلوا أسئلة.",
    visitorsButton: "عرض الزوار",
    questionsTitle: "إدارة الأسئلة",
    questionsDescription: "مراجعة وتصفية وتمييز الأسئلة المرسلة.",
    questionsButton: "عرض الأسئلة",
  },
};

export default function QueriesDashboard() {
  const { t, dir } = useI18nLayout(translations);
  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack spacing={1} alignItems="flex-start" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>

      {/* Cards Grid */}
      <Grid
        container
        spacing={3}
        justifyContent={"center"}
      >
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title={t.shareLinksTitle}
            description={t.shareLinksDescription}
            buttonLabel={t.shareLinksButton}
            icon={<ICONS.share />}
            color="#42a5f5" // soft primary blue
            route="/cms/modules/stageq/queries/share-link"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title={t.visitorsTitle}
            description={t.visitorsDescription}
            buttonLabel={t.visitorsButton}
            icon={<ICONS.people />}
            color="#66bb6a" // pleasant green
            route="/cms/modules/stageq/queries/visitors"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title={t.questionsTitle}
            description={t.questionsDescription}
            buttonLabel={t.questionsButton}
            icon={<ICONS.forum />}
            color="#ab47bc" // calm purple
            route="/cms/modules/stageq/queries/questions"
          />
        </Grid>
      </Grid>
    </Container>
  );
}
