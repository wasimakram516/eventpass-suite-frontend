import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

/**
 * Fetch dashboard insights (auto-detects Admin or Business User scope).
 * Optional query params: from, to (ISO dates)
 *
 * @param {Object} params
 * @param {string} [params.from] - start date (YYYY-MM-DD)
 * @param {string} [params.to] - end date (YYYY-MM-DD)
 */
export const getDashboardInsights = withApiHandler(async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const { data } = await api.get(`/dashboard/insights${query ? `?${query}` : ""}`);
  return data;
});
