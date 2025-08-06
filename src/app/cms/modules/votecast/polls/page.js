"use client";
import { Container, Grid, Typography, Divider, Stack } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import useI18nLayout from "@/hooks/useI18nLayout";
const translations = {
  en: {
    title: "Polls Management",
    subtitle: "Create, manage, and view poll results for all businesses.",
    managePolls: "Manage Polls",
    managePollsDesc: "Create, edit, and manage polls for businesses.",
    openPolls: "Open Polls",
    pollResults: "Poll Results",
    pollResultsDesc: "View real-time poll results and insights.",
    viewResults: "View Results",
  },
  ar: {
    title: "إدارة الاستطلاعات",
    subtitle: "إنشاء وإدارة وعرض نتائج الاستطلاعات لجميع الشركات.",
    managePolls: "إدارة الاستطلاعات",
    managePollsDesc: "إنشاء وتحرير وإدارة الاستطلاعات للشركات.",
    openPolls: "فتح الاستطلاعات",
    pollResults: "نتائج الاستطلاعات",
    pollResultsDesc: "عرض نتائج الاستطلاعات والرؤى في الوقت الفعلي.",
    viewResults: "عرض النتائج",
  },
};
export default function PollsDashboard() {
  const { t, dir, align } = useI18nLayout(translations);
  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      {/* ✅ Heading + Subtitle + Divider */}
      <Stack spacing={1} alignItems="flex-start" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.subtitle}
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>

      {/* ✅ Cards Grid */}
      <Grid
        container
        spacing={3}
        justifyContent="center"
      >
        <Grid item xs={12} sm={6} md={6}>
          <DashboardCard
            title={t.managePolls}
            description={t.managePollsDesc}
            buttonLabel={t.openPolls}
            icon={<AssignmentIcon />}
            color="#009688"
            route="/cms/modules/votecast/polls/manage"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <DashboardCard
            title={t.pollResults}
            description={t.pollResultsDesc}
            buttonLabel={t.viewResults}
            icon={<BarChartIcon />}
            color="#4caf50"
            route="/cms/modules/votecast/polls/results"
          />
        </Grid>
      </Grid>
    </Container>
  );
}
