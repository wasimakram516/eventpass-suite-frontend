import api from "./api";

// Get global configuration (admin only)
export const getGlobalConfig = async () => {
  const { data } = await api.get("/global-config");
  return data.data;
};

// Create global configuration (admin only)
export const createGlobalConfig = async (formData) => {
  const { data } = await api.post("/global-config", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};

// Update global configuration (admin only)
export const updateGlobalConfig = async (formData) => {
  const { data } = await api.put("/global-config", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};

// Delete global configuration (admin only)
export const deleteGlobalConfig = async () => {
  const { data } = await api.delete("/global-config");
  return data.data;
};
