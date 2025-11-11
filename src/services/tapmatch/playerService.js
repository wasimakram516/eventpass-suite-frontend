import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Join (start) a TapMatch game
export const joinGame = withApiHandler(
  async (gameId, payload) => {
    const { data } = await api.post(`/tapmatch/player/${gameId}/start`, payload);
    return data;
  },
  { showSuccess: true }
);

// Submit TapMatch result
export const submitResult = withApiHandler(
  async (sessionId, playerId, payload) => {
    const { data } = await api.patch(
      `/tapmatch/player/${sessionId}/${playerId}/submit`,
      payload
    );
    return data;
  },
  { showSuccess: true }
);

// Get all TapMatch players for a game
export const getPlayersByGame = withApiHandler(async (gameId) => {
  const { data } = await api.get(`/tapmatch/player/${gameId}`);
  return data;
});

// Get paginated TapMatch leaderboard
export const getLeaderboard = withApiHandler(async (gameId, page = 1, limit = 10) => {
  const { data } = await api.get(
    `/tapmatch/player/leaderboard/${gameId}?page=${page}&limit=${limit}`
  );
  return data;
});

// Export TapMatch results (Excel download)
export const exportResults = async (gameId) => {
  try {
    const { data } = await api.get(`/tapmatch/player/export/${gameId}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TapMatch-results.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.log(
      err?.response?.data?.message || err?.message || "Failed to export results"
    );
  }
};
