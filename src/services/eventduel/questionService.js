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
    const formData = new FormData();

    formData.append('question', payload.question);
    formData.append('answers', JSON.stringify(payload.answers));
    formData.append('correctAnswerIndex', payload.correctAnswerIndex);
    if (payload.hint) formData.append('hint', payload.hint);

    if (payload.questionImage) {
      formData.append('questionImage', payload.questionImage);
    }

    if (payload.answerImages) {
      payload.answerImages.forEach((item) => {
        if (item.file) {
          formData.append('answerImages', item.file);
          formData.append('answerImageIndices', item.index);
        }
      });
    }

    const { data } = await api.post(`/eventduel/questions/${gameId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  { showSuccess: true }
);

// Update question
export const updateQuestion = withApiHandler(
  async (gameId, questionId, payload) => {
    const formData = new FormData();

    formData.append('question', payload.question);
    formData.append('answers', JSON.stringify(payload.answers));
    formData.append('correctAnswerIndex', payload.correctAnswerIndex);
    if (payload.hint !== undefined) formData.append('hint', payload.hint);

    if (payload.removeQuestionImage) {
      formData.append('removeQuestionImage', 'true');
    }

    if (payload.removeAnswerImages?.length > 0) {
      formData.append('removeAnswerImages', JSON.stringify(payload.removeAnswerImages));
    }

    if (payload.questionImage) {
      formData.append('questionImage', payload.questionImage);
    }

    if (payload.answerImages) {
      payload.answerImages.forEach((item) => {
        if (item.file) {
          formData.append('answerImages', item.file);
          formData.append('answerImageIndices', item.index);
        }
      });
    }

    const { data } = await api.put(
      `/eventduel/questions/${gameId}/${questionId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
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
