import api from "./api";

// Get results of all active polls for a business
export const getResults = async (businessSlug, status = "active") => {
  const { data } = await api.get(`/results?businessSlug=${businessSlug}${status ? `&status=${status}` : ""}`);
  return data.data;
};
