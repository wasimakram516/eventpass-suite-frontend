import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all questions for a business (protected)
export const getQuestionsByBusiness = withApiHandler(async (slug) => {
  const { data } = await api.get(`/stageq/questions/${slug}`);
  return data;
});

// Submit a public question (no auth)
export const submitQuestion = withApiHandler(async (slug, payload) => {
  const { data } = await api.post(`/stageq/questions/${slug}`, payload);
  return data;
}, { showSuccess: true });

// Update a question’s text or answered flag (protected)
export const updateQuestion = withApiHandler(async (questionId, payload) => {
  const { data } = await api.put(`/stageq/questions/${questionId}`, payload);
  return data;
}, { showSuccess: true });

// Delete a question (protected)
export const deleteQuestion = withApiHandler(async (questionId) => {
  const { data } = await api.delete(`/stageq/questions/${questionId}`);
  return data;
}, { showSuccess: true });

// Add/remove a vote (no auth)
export const voteQuestion = withApiHandler(async (questionId, action) => {
  const { data } = await api.put(`/stageq/questions/vote/${questionId}`, { action });
  return data;
});
