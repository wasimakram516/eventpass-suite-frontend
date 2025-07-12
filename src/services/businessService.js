import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all businesses
export const getAllBusinesses = withApiHandler(async () => {
  const { data } = await api.get("/businesses");
  return data;
});

// Fetch business by slug (public)
export const getBusinessBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/businesses/slug/${slug}`);
  return data;
});

// Create a new business — supports FormData for logo upload
export const createBusiness = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/businesses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update existing business — supports FormData for logo upload
export const updateBusiness = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/businesses/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Delete a business (admin only)
export const deleteBusiness = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/businesses/${id}`);
    return data;
  },
  { showSuccess: true }
);
