import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Start a solo game session
export const joinGame = withApiHandler(
  async (gameId, payload) => {
    const { data } = await api.post(`/quiznest/players/${gameId}/start-solo`, payload);
    return data; // { playerId, sessionId }
  },
  { showSuccess: true }
);

// Submit result for a solo session
export const submitResult = withApiHandler(
  async (sessionId, playerId, payload) => {
    const { data } = await api.patch(`/quiznest/players/${sessionId}/${playerId}/submit`, payload);
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
export const exportResults = withApiHandler(async (gameId) => {
  const { data } = await api.get(`/quiznest/players/export/${gameId}`, {
    responseType: "blob",
  });
  return data;
});
