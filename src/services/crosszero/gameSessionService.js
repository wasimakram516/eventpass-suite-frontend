import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getAllSessions = withApiHandler(async (gameSlug, page = 1, limit = 5) => {
  const { data } = await api.get("/crosszero/sessions", { params: { gameSlug, page, limit } });
  return data;
});

export const startGameSession = withApiHandler(
  async (gameSlug) => {
    const { data } = await api.post("/crosszero/sessions/start", { gameSlug });
    return data;
  },
  { showSuccess: true }
);

export const joinGameSession = withApiHandler(async (payload) => {
  const { data } = await api.post("/crosszero/sessions/join", payload);
  return data;
});

export const activateGameSession = withApiHandler(
  async (sessionId) => {
    const { data } = await api.put(`/crosszero/sessions/${sessionId}/activate`);
    return data;
  },
  { showSuccess: true }
);

export const endGameSession = withApiHandler(
  async (sessionId) => {
    const { data } = await api.put(`/crosszero/sessions/${sessionId}/end`);
    return data;
  },
  { showSuccess: true }
);

export const abandonGameSession = withApiHandler(
  async (sessionId) => {
    const { data } = await api.put(`/crosszero/sessions/${sessionId}/abandon`);
    return data;
  },
  { showSuccess: true }
);

export const resetSessions = withApiHandler(
  async (gameSlug) => {
    const { data } = await api.post("/crosszero/sessions/reset", { gameSlug });
    return data;
  },
  { showSuccess: true }
);

export const exportResults = async (gameSlug) => {
  try {
    const { data } = await api.get(`/crosszero/sessions/export/${gameSlug}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CrossZero-PvP-Results-${gameSlug}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err?.response?.data?.message || "Failed to export results");
  }
};
