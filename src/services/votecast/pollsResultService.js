import api from "../api";
import withApiHandler from "@/utils/withApiHandler";

// Get results of all active polls for a business
export const getResults = withApiHandler(async (businessSlug, status = "active") => {
  const { data } = await api.get(
    `/votecast/polls/results?businessSlug=${businessSlug}${status ? `&status=${status}` : ""}`
  );
  return data.data;
});
