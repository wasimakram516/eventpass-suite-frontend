import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get games by business slug
export const getGamesByBusiness = withApiHandler(async (slug) => {
  const { data } = await api.get(`/quiznest/games/business/${slug}`);
  return data;
});

// Get all games
export const getAllGames = withApiHandler(async () => {
  const { data } = await api.get("/quiznest/games");
  return data;
});

// Get game by ID
export const getGameById = withApiHandler(async (id) => {
  const { data } = await api.get(`/quiznest/games/${id}`);
  return data;
});

// Get game by slug
export const getGameBySlug = withApiHandler(async (gameSlug) => {
  const { data } = await api.get(`/quiznest/games/slug/${gameSlug}`);
  return data;
});

// Create new game
export const createGame = withApiHandler(
  async (businessSlug, formData) => {
    formData.append("businessSlug", businessSlug);
    const { data } = await api.post("/quiznest/games", formData);
    return data;
  },
  { showSuccess: true }
);

// Update game
export const updateGame = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/quiznest/games/${id}`, formData);
    return data;
  },
  { showSuccess: true }
);

// Delete game
export const deleteGame = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/quiznest/games/${id}`);
    return data;
  },
  { showSuccess: true }
);
