import api from "./api";

// ✅ Get all polls (for admin or business user)
export const getPolls = async (businessSlug = "", status = "") => {
  const params = new URLSearchParams();
  if (businessSlug) params.append("businessSlug", businessSlug);
  if (status) params.append("status", status);

  const { data } = await api.get(
    `/polls${params.toString() ? `?${params.toString()}` : ""}`
  );
  return data.data;
};

// ✅ Get active polls for voting
export const getActivePollsByBusiness = async (businessSlug) => {
  const { data } = await api.get(`/public/polls/${businessSlug}`);
  return data.data;
};

// ✅ Create a new poll
export const createPoll = async (pollData) => {
  const { data } = await api.post("/polls", pollData);
  return data.data;
};

// ✅ Clone a poll
export const clonePoll = async (pollId) => {
  const { data } = await api.post(`/polls/${pollId}/clone`);
  return data.data;
};

// ✅ Update an existing poll
export const updatePoll = async (id, updatedData) => {
  const { data } = await api.put(`/polls/${id}`, updatedData);
  return data.data;
};

// ✅ Delete a poll
export const deletePoll = async (id) => {
  const { data } = await api.delete(`/polls/${id}`);
  return data.data;
};

// ✅ Vote on a poll (public)
export const voteOnPoll = async (pollId, optionIndex) => {
  const { data } = await api.post(`/polls/${pollId}/vote`, { optionIndex });
  return data.data;
};

// ✅ Reset votes for a business and optional status
export const resetVotes = async (businessSlug, status = "") => {
  const { data } = await api.post(`/polls/reset`, { businessSlug, status });
  return data;
};

// ✅ Export polls to Excel
export const exportPollsToExcel = async (businessSlug, status = "") => {
  const response = await api.post(
    "/polls/export",
    { businessSlug, status },
    {
      responseType: "blob", 
    }
  );

  // Trigger download
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
};
