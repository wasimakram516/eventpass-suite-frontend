import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getPollInsightsSummary = withApiHandler(async (slug) =>
    await api.get(`/votecast/polls/insights/${slug}/summary`)
);

export const getPollInsightsFields = withApiHandler(async (slug) =>
    await api.get(`/votecast/polls/insights/${slug}/fields`)
);

export const getPollInsightsDistribution = withApiHandler(async (slug, fieldName, topN = null) => {
    const params = new URLSearchParams({ fieldName });
    if (topN) params.append("topN", topN);
    return await api.get(`/votecast/polls/insights/${slug}/distribution?${params}`);
});

export const getPollInsightsTimeDistribution = withApiHandler(
    async (slug, startDate, endDate, intervalMinutes = 60) => {
        const params = new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            intervalMinutes: intervalMinutes.toString(),
        });
        return await api.get(`/votecast/polls/insights/${slug}/time-distribution?${params}`);
    }
);
