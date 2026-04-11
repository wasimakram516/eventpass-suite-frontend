import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getSessionInsightsSummary = withApiHandler(async (slug) =>
  await api.get(`/stageq/sessions/insights/${slug}/summary`)
);

export const getSessionInsightsFields = withApiHandler(async (slug) =>
  await api.get(`/stageq/sessions/insights/${slug}/fields`)
);

export const getSessionInsightsDistribution = withApiHandler(async (slug, fieldName, topN = null) => {
  const params = new URLSearchParams({ fieldName });
  if (topN) params.append("topN", topN);
  return await api.get(`/stageq/sessions/insights/${slug}/distribution?${params}`);
});

export const getSessionInsightsTimeDistribution = withApiHandler(
  async (slug, startDate, endDate, intervalMinutes = 60) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      intervalMinutes: intervalMinutes.toString(),
    });
    return await api.get(`/stageq/sessions/insights/${slug}/time-distribution?${params}`);
  }
);
