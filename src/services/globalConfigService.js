import api from "./api";
import withApiHandler from "@/utils/withApiHandler";

// Get global configuration (admin only)
export const getGlobalConfig = withApiHandler(async () => {
  const { data } = await api.get("/global-config");
  return data;
});

// Create global configuration (admin only)
export const createGlobalConfig = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/global-config", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update global configuration (admin only)
export const updateGlobalConfig = withApiHandler(
  async (formData) => {
    const { data } = await api.put("/global-config", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Delete global configuration (admin only)
export const deleteGlobalConfig = withApiHandler(
  async () => {
    const { data } = await api.delete("/global-config");
    return data;
  },
  { showSuccess: true }
);
