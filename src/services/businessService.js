import api from "./api";

// Get all businesses
export const getAllBusinesses = async () => {
  const { data } = await api.get("/businesses");
  return data.data;
};

// Fetch business by slug (public)
export const getBusinessBySlug = async (slug) => {
  const { data } = await api.get(`/businesses/slug/${slug}`);
  return data.data;
};

// Create a new business — supports FormData for logo upload
export const createBusiness = async (formData) => {
  const { data } = await api.post("/businesses", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};

// Update existing business — supports FormData for logo upload
export const updateBusiness = async (id, formData) => {
  const { data } = await api.put(`/businesses/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};

// Delete a business (admin only)
export const deleteBusiness = async (id) => {
  const { data } = await api.delete(`/businesses/${id}`);
  return data.data;
};
