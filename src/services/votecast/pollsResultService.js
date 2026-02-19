import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get results of all polls for an event
export const getResults = withApiHandler(
  async (eventId) => {
    const { data } = await api.get(
      `/votecast/polls/results?eventId=${eventId}`
    );
    return data.data || data;
  }
);
