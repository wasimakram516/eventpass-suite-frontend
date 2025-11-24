import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getAvailableQuestions = withApiHandler(async (slug) => {
    return await api.get(`/surveyguru/forms/${slug}/questions`);
});

export const getQuestionDistribution = withApiHandler(async (slug, questionId) => {
    const params = new URLSearchParams({ questionId });
    return await api.get(`/surveyguru/forms/${slug}/distribution?${params}`);
});

export const getTimeDistribution = withApiHandler(async (slug, startDate, endDate, intervalMinutes = 60) => {
    const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        intervalMinutes: intervalMinutes.toString()
    });
    return await api.get(`/surveyguru/forms/${slug}/time-distribution?${params}`);
});

export const getInsightsSummary = withApiHandler(async (slug) => {
    return await api.get(`/surveyguru/forms/${slug}/summary`);
});

