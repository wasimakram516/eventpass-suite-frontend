"use client";
import { Container, Grid, Typography, Divider, Stack } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

export default function PollsDashboard() {
  return (
    <Container maxWidth="lg">
      <BreadcrumbsNav />

      {/* ✅ Heading + Subtitle + Divider */}
      <Stack spacing={1} alignItems="flex-start" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Polls Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create, manage, and view poll results for all businesses.
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>

      {/* ✅ Cards Grid */}
      <Grid
        container
        spacing={3}
        justifyContent={{ xs: "center", sm: "flex-start" }}
      >
        <Grid item xs={12} sm={6} md={6}>
          <DashboardCard
            title="Manage Polls"
            description="Create, edit, and manage polls for businesses."
            buttonLabel="Open Polls"
            icon={<AssignmentIcon />}
            color="#009688"
            route="/cms/modules/votecast/polls/manage"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <DashboardCard
            title="Poll Results"
            description="View real-time poll results and insights."
            buttonLabel="View Results"
            icon={<BarChartIcon />}
            color="#4caf50"
            route="/cms/modules/votecast/polls/results"
          />
        </Grid>
      </Grid>
    </Container>
  );
}
