import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all spin wheels
export const getAllSpinWheels = withApiHandler(async () => {
  const { data } = await api.get("/eventwheel/wheels");
  return data;
});

// Get spin wheel by ID
export const getSpinWheelById = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventwheel/wheels/${id}`);
  return data;
});

// Get spin wheel by slug
export const getSpinWheelBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventwheel/wheels/slug/${slug}`);
  return data;
});

// Create spin wheel — supports FormData (logo + background)
export const createSpinWheel = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/eventwheel/wheels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update spin wheel — supports FormData (logo + background)
export const updateSpinWheel = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/eventwheel/wheels/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Delete spin wheel
export const deleteSpinWheel = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/eventwheel/wheels/${id}`);
    return data;
  },
  { showSuccess: true }
);
