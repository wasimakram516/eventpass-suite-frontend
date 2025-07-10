import api from "../api";
import withApiHandler from "@/utils/withApiHandler";

// Join a game
export const joinGame = withApiHandler(
  async (gameId, payload) => {
    const { data } = await api.post(`/quiznest/players/${gameId}`, payload);
    return data;
  },
  { showSuccess: true }
);

// Submit player result
export const submitResult = withApiHandler(
  async (playerId, payload) => {
    const { data } = await api.patch(`/quiznest/players/${playerId}`, payload);
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
