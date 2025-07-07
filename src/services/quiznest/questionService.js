import api from "../api";
import withApiHandler from "@/utils/withApiHandler";

// Get all questions for a game
export const getQuestions = withApiHandler(async (gameId) => {
  const { data } = await api.get(`/quiznest/questions/${gameId}`);
  return data.data;
});

// Add a single question
export const addQuestion = withApiHandler(async (gameId, payload) => {
  const { data } = await api.post(`/quiznest/questions/${gameId}`, payload);
  return data.data;
});

// Update a question
export const updateQuestion = withApiHandler(async (gameId, questionId, payload) => {
  const { data } = await api.put(`/quiznest/questions/${gameId}/${questionId}`, payload);
  return data.data;
});

// Delete a question
export const deleteQuestion = withApiHandler(async (gameId, questionId) => {
  const { data } = await api.delete(`/quiznest/questions/${gameId}/${questionId}`);
  return data.data;
});

// Upload bulk Excel questions
export const uploadExcelQuestions = withApiHandler(async (gameId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(`/quiznest/questions/upload/${gameId}`, formData);
  return data.data;
});

// Download Excel template
export const downloadTemplate = withApiHandler(async (choicesCount, includeHint = false) => {
  const response = await api.get(
    `/quiznest/questions/sample/download/${choicesCount}?includeHint=${includeHint}`,
    { responseType: "blob" }
  );
  return response;
});
