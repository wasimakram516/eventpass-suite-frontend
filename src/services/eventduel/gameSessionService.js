import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all sessions
export const getAllSessions = withApiHandler(async (gameSlug) => {
  const { data } = await api.get("/eventduel/sessions", {
    params: { gameSlug },
  });
  return data;
});

// Start new session
export const startGameSession = withApiHandler(
  async (gameSlug) => {
    const { data } = await api.post("/eventduel/sessions/start", { gameSlug });
    return data;
  },
  { showSuccess: true }
);

// Join session
export const joinGameSession = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/eventduel/sessions/join", formData);
    return data;
  }
);

// Activate session
export const activateGameSession = withApiHandler(
  async (sessionId) => {
    const { data } = await api.put(`/eventduel/sessions/${sessionId}/activate`);
    return data;
  },
  { showSuccess: true }
);

// End session
export const endGameSession = withApiHandler(
  async (sessionId) => {
    const { data } = await api.put(`/eventduel/sessions/${sessionId}/end`);
    return data;
  },
  { showSuccess: true }
);

export const resetPvPSessions = withApiHandler(
  async (gameSlug) => {
    const { data } = await api.post(
      `/eventduel/sessions/reset`,
      { gameSlug }
    );
    return data;
  },
  { showSuccess: true }
);


// Submit final player result
export const submitPvPResult = withApiHandler(
  async ({ sessionId, playerId, payload }) => {
    const { data } = await api.patch(
      `/eventduel/sessions/${sessionId}/${playerId}/submit`,
      payload
    );
    return data;
  },
);

// Get leaderboard for a game
export const getLeaderboard = withApiHandler(async (gameSlug) => {
  const { data } = await api.get(`/eventduel/sessions/leaderboard/${gameSlug}`);
  return data;
});

// Export player results (blob response)
export const exportResults = withApiHandler(async (gameSlug) => {
  const { data } = await api.get(`/eventduel/sessions/export/${gameSlug}`, {
    responseType: "blob",
  });
  return data;
});
