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

// Create spin wheel — supports JSON payload (logoUrl + backgroundUrl)
export const createSpinWheel = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/eventwheel/wheels", payload);
    return data;
  },
  { showSuccess: true }
);

// Update spin wheel — supports JSON payload (logoUrl + backgroundUrl)
export const updateSpinWheel = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/eventwheel/wheels/${id}`, payload);
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
