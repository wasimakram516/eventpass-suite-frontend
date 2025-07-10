import api from "../api";
import withApiHandler from "@/utils/withApiHandler";

// Get all polls (for admin or business user)
export const getPolls = withApiHandler(
  async (businessSlug = "", status = "") => {
    const params = new URLSearchParams();
    if (businessSlug) params.append("businessSlug", businessSlug);
    if (status) params.append("status", status);

    const { data } = await api.get(
      `/votecast/polls${params.toString() ? `?${params.toString()}` : ""}`
    );
    return data;
  }
);

// Get active polls for voting (public route)
export const getActivePollsByBusiness = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/votecast/polls/public/${businessSlug}`);
  return data;
});

// Create a new poll
export const createPoll = withApiHandler(
  async (pollData) => {
    const { data } = await api.post("/votecast/polls", pollData);
    return data;
  },
  { showSuccess: true }
);

// Clone a poll
export const clonePoll = withApiHandler(
  async (pollId) => {
    const { data } = await api.post(`/votecast/polls/${pollId}/clone`);
    return data;
  },
  { showSuccess: true }
);

// Update an existing poll
export const updatePoll = withApiHandler(
  async (id, updatedData) => {
    const { data } = await api.put(`/votecast/polls/${id}`, updatedData);
    return data;
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

// Reset votes for a business and optional status
export const resetVotes = withApiHandler(
  async (businessSlug, status = "") => {
    const { data } = await api.post(`/votecast/polls/reset`, {
      businessSlug,
      status,
    });
    return data;
  },
  { showSuccess: true }
);

// Export polls to Excel
export const exportPollsToExcel = async (businessSlug, status = "") => {
  try {
    const response = await api.post(
      "/votecast/polls/export",
      { businessSlug, status },
      {
        responseType: "blob",
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
      `${businessSlug}-polls-${status || "all"}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Failed to export polls to Excel:", err);
  }
};
