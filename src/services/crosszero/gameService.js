import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getGamesByBusiness = withApiHandler(async (slug) => {
  const { data } = await api.get(`/crosszero/games/business/${slug}`);
  return data;
});

export const getGameById = withApiHandler(async (id) => {
  const { data } = await api.get(`/crosszero/games/${id}`);
  return data;
});

export const getGameBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/crosszero/games/slug/${slug}`);
  return data;
});

export const createGame = withApiHandler(
  async (businessSlug, payload) => {
    const { data } = await api.post("/crosszero/games", { ...payload, businessSlug });
    return data;
  },
  { showSuccess: true }
);

export const updateGame = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/crosszero/games/${id}`, payload);
    return data;
  },
  { showSuccess: true }
);

export const deleteGame = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/crosszero/games/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Restore/permanent-delete for crosszero games go exclusively through the
// generic Recycle Bin API (src/services/trashService.js) — same as every
// other module — so no module-specific functions live here.
