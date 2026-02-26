import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all questions for a game
export const getQuestions = withApiHandler(async (gameId) => {
  const { data } = await api.get(`/eventduel/questions/${gameId}`);
  return data;
});

// Add new question
export const addQuestion = withApiHandler(
  async (gameId, payload) => {
    const { data } = await api.post(`/eventduel/questions/${gameId}`, payload);
    return data;
  },
  { showSuccess: true }
);

// Update question
export const updateQuestion = withApiHandler(
  async (gameId, questionId, payload) => {
    const { data } = await api.put(
      `/eventduel/questions/${gameId}/${questionId}`,
      payload
    );
    return data;
  },
  { showSuccess: true }
);

// Delete question
export const deleteQuestion = withApiHandler(
  async (gameId, questionId) => {
    const { data } = await api.delete(
      `/eventduel/questions/${gameId}/${questionId}`
    );
    return data;
  },
  { showSuccess: true }
);

// Upload Excel questions
export const uploadExcelQuestions = withApiHandler(
  async (gameId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/eventduel/questions/upload/${gameId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },
  { showSuccess: true }
);

// Download sample Excel template
export const downloadTemplate = async (choicesCount, includeHint = false) => {
  try {
    const { data } = await api.get(
      `/eventduel/questions/sample/download/${choicesCount}?includeHint=${includeHint}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `PvP-quiz-sample-${choicesCount}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error(
      err?.response?.data?.message ||
      err?.message ||
      "Failed to download template"
    );
  }
};

// Meta lookup for a question by its id
export const getQuestionMeta = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventduel/questions/meta/${id}`);
  return data;
});
