import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all visitors with event history (protected)
export const getAllVisitors = withApiHandler(async () => {
  const { data } = await api.get("/stageq/visitors");
  return data;
});
