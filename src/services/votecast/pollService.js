import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all polls (for admin or business user)
export const getPolls = withApiHandler(
  async (eventId = "") => {
    const params = new URLSearchParams();
    if (eventId) params.append("eventId", eventId);

    const { data } = await api.get(
      `/votecast/polls${params.toString() ? `?${params.toString()}` : ""}`
    );
    return data.data || data; // Handle both response formats
  }
);
// Get active polls for voting (public route) - by event slug
export const getActivePollsByEvent = withApiHandler(async (eventSlug) => {
  const { data } = await api.get(`/votecast/polls/public/${eventSlug}`);
  return data.data || data;
});

// Create Poll with images
export const createPoll = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/votecast/polls", payload);
    return data.data; 
  },
  { showSuccess: true }
);

// Update Poll with optional new images
export const updatePoll = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/votecast/polls/${id}`, payload);
    return data.data; 
  },
  { showSuccess: true }
);

// Clone a poll
export const clonePoll = withApiHandler(
  async (pollId) => {
    const { data } = await api.post(`/votecast/polls/${pollId}/clone`);
    return data.data || data; 
  },
  { showSuccess: true }
);

// Delete a poll
export const deletePoll = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/votecast/polls/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Vote on a poll (public)
export const voteOnPoll = withApiHandler(
  async (pollId, optionIndex) => {
    const { data } = await api.post(`/votecast/polls/${pollId}/vote`, {
      optionIndex,
    });
    return data;
  },
  { showSuccess: true }
);

// Reset votes for an event
export const resetVotes = withApiHandler(
  async (eventId) => {
    const { data } = await api.post(`/votecast/polls/reset`, {
      eventId,
    });
    return data;
  },
  { showSuccess: true }
);

// Export polls to Excel
export const exportPollsToExcel = 
  async (eventId) => {
    try {
      const response = await api.post(
        "/votecast/polls/export",
        { eventId },
        {
          responseType: "blob",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `polls-${Date.now()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export polls to Excel:", err);
    }
  };

export const getPollMeta = withApiHandler(async (id) => {
  const { data } = await api.get(`/votecast/polls/${id}/meta`);
  return data;
});
