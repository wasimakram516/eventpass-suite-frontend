import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

/**
 * Fetch dashboard insights (auto-detects Admin or Business User scope).
 */
export const getDashboardInsights = withApiHandler(async () => {
  const { data } = await api.get("/dashboard");
  return data;
});

/**
 * Force recalc dashboard insights (superadmin or business scope).
 */
export const refreshDashboardInsights = withApiHandler(
  async () => {
    const { data } = await api.get("/dashboard/recalc");
    return data;
  },
  { showSuccess: true }
);
