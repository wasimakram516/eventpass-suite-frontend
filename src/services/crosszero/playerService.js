import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const joinGame = withApiHandler(async (gameId, payload) => {
  const { data } = await api.post(`/crosszero/player/${gameId}`, payload);
  return data;
});

export const submitResult = withApiHandler(async (sessionId, playerId, payload) => {
  const { data } = await api.patch(`/crosszero/player/${sessionId}/${playerId}/submit`, payload);
  return data;
});

export const getSessionHistory = withApiHandler(async (gameId, page = 1, limit = 10) => {
  const { data } = await api.get(`/crosszero/player/history/${gameId}`, { params: { page, limit } });
  return data;
});

export const exportResults = async (gameId) => {
  try {
    const { data } = await api.get(`/crosszero/player/export/${gameId}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CrossZero-AI-Results-${gameId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err?.response?.data?.message || "Failed to export results");
  }
};
