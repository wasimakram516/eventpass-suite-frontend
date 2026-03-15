import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all wall configs
export const getWallConfigs = withApiHandler(async () => {
  const response = await api.get("/memorywall/wall-configs");
  return response.data;
});

// Get a wall config by slug
export const getWallConfigBySlug = withApiHandler(async (slug) => {
  const response = await api.get(`/memorywall/wall-configs/slug/${slug}`);
  return response.data;
});

// Create new wall config
export const createWallConfig = withApiHandler(
  async (payload) => {
    
    const response = await api.post("/memorywall/wall-configs", payload);
    return response.data;
  },
  { showSuccess: true }
);

// Update wall config
export const updateWallConfig = withApiHandler(
  async (id, payload) => {
    const response = await api.put(`/memorywall/wall-configs/${id}`, payload);
    return response.data;
  },
  { showSuccess: true }
);

// Delete wall config
export const deleteWallConfig = withApiHandler(
  async (id) => {
    const response = await api.delete(`/memorywall/wall-configs/${id}`);
    return response.data;
  },
  { showSuccess: true }
);
