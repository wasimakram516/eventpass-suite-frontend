import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Start a solo game session with localStorage setup and navigation
export const joinGame = withApiHandler(
  async (gameId, payload) => {
    const { data } = await api.post(
      `/quiznest/players/${gameId}/start-solo`,
      payload
    );

    return data; 
  },
  { showSuccess: true }
);

// Submit result for a solo session
export const submitResult = withApiHandler(
  async (sessionId, playerId, payload) => {
    const { data } = await api.patch(
      `/quiznest/players/${sessionId}/${playerId}/submit`,
      payload
    );
    return data;
  },
  { showSuccess: true }
);

// Get all players for a game
export const getPlayersByGame = withApiHandler(async (gameId) => {
  const { data } = await api.get(`/quiznest/players/${gameId}`);
  return data;
});

// Get leaderboard for a game
export const getLeaderboard = withApiHandler(async (gameId) => {
  const { data } = await api.get(`/quiznest/players/leaderboard/${gameId}`);
  return data;
});

// Export player results (blob response)
export const exportResults = async (gameId) => {
  try {
    const { data } = await api.get(`/quiznest/players/export/${gameId}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Game results.xlsx`);
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
