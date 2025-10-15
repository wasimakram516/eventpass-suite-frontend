import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getAvailableFields = withApiHandler(async (slug) => {
    console.log("Inside insight fields getting..");
    return await api.get(`/eventreg/insights/${slug}/fields`);
});

export const getFieldDistribution = withApiHandler(async (slug, fieldName, topN = null) => {
    const params = new URLSearchParams({ fieldName });
    if (topN) params.append('topN', topN);
    return await api.get(`/eventreg/insights/${slug}/distribution?${params}`);
});

export const getTimeDistribution = withApiHandler(async (slug, fieldName, startDate, endDate, intervalMinutes = 60) => {
    const params = new URLSearchParams({
        fieldName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        intervalMinutes: intervalMinutes.toString()
    });
    return await api.get(`/eventreg/insights/${slug}/time-distribution?${params}`);
});

export const getInsightsSummary = withApiHandler(async (slug) => {
    return await api.get(`/eventreg/insights/${slug}/summary`);
});

export const getScannedByTypeDistribution = withApiHandler(async (slug) => {
    return await api.get(`/eventreg/insights/${slug}/scanned-by-type`);
});

export const getScannedByUserDistribution = withApiHandler(async (slug, staffType = null) => {
    const params = staffType ? new URLSearchParams({ staffType }) : '';
    return await api.get(`/eventreg/insights/${slug}/scanned-by-users${params ? `?${params}` : ''}`);
});