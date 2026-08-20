import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get games by business slug
export const getGamesByBusiness = withApiHandler(async (slug) => {
  const { data } = await api.get(`/tapmatch/games/business/${slug}`);
  return data;
});

// Get all games
export const getAllGames = withApiHandler(async () => {
  const { data } = await api.get("/tapmatch/games");
  return data;
});

// Get game by ID
export const getGameById = withApiHandler(async (id) => {
  const { data } = await api.get(`/tapmatch/games/${id}`);
  return data;
});

// Get game by slug
export const getGameBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/tapmatch/games/slug/${slug}`);
  return data;
});

// Create new TapMatch game
export const createGame = withApiHandler(
  async (businessSlug, payload) => {
    const { data } = await api.post("/tapmatch/games", {
      ...payload,
      businessSlug,
    });
    return data;
  },
  { showSuccess: true }
);

// Update TapMatch game
export const updateGame = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/tapmatch/games/${id}`, payload);
    return data;
  },
  { showSuccess: true }
);

// Soft delete TapMatch game
export const deleteGame = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/tapmatch/games/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Restore/permanent-delete for tapmatch games go exclusively through the
// generic Recycle Bin API (src/services/trashService.js) — same as every
// other module — so no module-specific functions live here.
