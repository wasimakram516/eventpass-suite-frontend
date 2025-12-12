import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all PvP games for a business
export const getGamesByBusiness = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventduel/games/business/${slug}`);
  return data;
});

// Get PvP game by ID
export const getGameById = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventduel/games/${id}`);
  return data;
});

// Get PvP game by Slug
export const getGameBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventduel/games/slug/${slug}`);
  return data;
});

// Create PvP game for a business 
export const createGame = withApiHandler(
  async (businessSlug, payload) => {
    const { data } = await api.post("/eventduel/games", {
      ...payload,
      businessSlug,
    });
    return data;
  },
  { showSuccess: true }
);

// Update game
export const updateGame = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/eventduel/games/${id}`, payload);
    return data;
  },
  { showSuccess: true }
);

// Delete game
export const deleteGame = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/eventduel/games/${id}`);
    return data;
  },
  { showSuccess: true }
);
