import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all polls by businessSlug (CMS)
export const getPolls = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/votecast/polls?businessSlug=${businessSlug}`);
  return data.data || data;
});

// Get questions for a poll (CMS)
export const getPollQuestions = withApiHandler(async (pollId) => {
  const { data } = await api.get(`/votecast/polls/${pollId}/questions`);
  return data.data || data;
});

// Get poll by slug (public)
export const getPublicPollBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/votecast/polls/slug/${slug}`);
  return data.data || data;
});

// Get single poll by ID (public)
export const getPublicPollById = withApiHandler(async (pollId) => {
  const { data } = await api.get(`/votecast/polls/public/poll/${pollId}`);
  return data.data || data;
});

// Create poll
export const createPoll = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/votecast/polls", payload);
    return data.data;
  },
  { showSuccess: true }
);

// Update poll metadata
export const updatePoll = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/votecast/polls/${id}`, payload);
    return data.data;
  },
  { showSuccess: true }
);

// Delete poll
export const deletePoll = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/votecast/polls/${id}`);
    return data;
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

// Add question to poll
export const addQuestion = withApiHandler(
  async (pollId, payload) => {
    const { data } = await api.post(`/votecast/polls/${pollId}/questions`, payload);
    return data.data || data;
  },
  { showSuccess: true }
);

// Update question in poll
export const updateQuestion = withApiHandler(
  async (pollId, questionId, payload) => {
    const { data } = await api.put(`/votecast/polls/${pollId}/questions/${questionId}`, payload);
    return data.data || data;
  },
  { showSuccess: true }
);

// Delete question from poll
export const deleteQuestion = withApiHandler(
  async (pollId, questionId) => {
    const { data } = await api.delete(`/votecast/polls/${pollId}/questions/${questionId}`);
    return data;
  },
  { showSuccess: true }
);

// Get results for a single poll by ID (CMS)
export const getPollResults = withApiHandler(async (pollId) => {
  const { data } = await api.get(`/votecast/polls/${pollId}/results`);
  return data.data || data;
});

// Export questions for a poll as XLSX
export const exportQuestionsToExcel = async (pollId, pollSlug) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, headers } = await api.get(`/votecast/polls/${pollId}/questions/export`, {
    responseType: "blob",
    params: { timezone },
  });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  let filename = `${pollSlug || pollId}_questions.xlsx`;
  const disposition = headers?.["content-disposition"];
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Clone question in poll
export const cloneQuestion = withApiHandler(
  async (pollId, questionId) => {
    const { data } = await api.post(`/votecast/polls/${pollId}/questions/${questionId}/clone`);
    return data.data || data;
  },
  { showSuccess: true }
);

// Verify attendee by poll ID (public)
export const verifyAttendeeByPoll = withApiHandler(async (pollId, fieldValue) => {
  const { data } = await api.post("/votecast/polls/verify-by-poll", { pollId, fieldValue });
  return data;
});

// Verify attendee via VoteCast event slug (legacy public)
export const verifyAttendee = withApiHandler(async (eventSlug, fieldValue) => {
  const { data } = await api.post("/votecast/polls/verify", { eventSlug, fieldValue });
  return data;
});

// Vote on a question within a poll (public)
export const voteOnPoll = withApiHandler(
  async (pollId, questionId, optionIndex, registrationId = null) => {
    const payload = { questionId, optionIndex };
    if (registrationId) payload.registrationId = registrationId;
    const { data } = await api.post(`/votecast/polls/${pollId}/vote`, payload);
    return data;
  },
  { showSuccess: true }
);

// Reset votes for a poll
export const resetVotes = withApiHandler(
  async (pollId) => {
    const { data } = await api.post(`/votecast/polls/reset`, { pollId });
    return data;
  },
  { showSuccess: true }
);

export const getPollMeta = withApiHandler(async (id) => {
  const { data } = await api.get(`/votecast/polls/${id}/meta`);
  return data;
});
