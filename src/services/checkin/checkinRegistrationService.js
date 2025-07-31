import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Create public registration (no auth required)
export const createCheckInRegistration = withApiHandler(async (payload) => {
  const { data } = await api.post("/checkin/registrations", payload);
  return data;
});

// Get registrations for an event by slug (protected)
export const getCheckInRegistrationsByEvent = withApiHandler(
  async (slug, page = 1, limit = 10) => {
    const { data } = await api.get(
      `/checkin/registrations/event/${slug}?page=${page}&limit=${limit}`
    );
    return data;
  }
);

// Delete registration by ID (protected)
export const deleteCheckInRegistration = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/checkin/registrations/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Get all checkin registrations for export (no pagination)
export const getAllCheckInRegistrationsByEvent = withApiHandler(
  async (slug) => {
    const { data } = await api.get(`/checkin/registrations/event/${slug}/all`);
    return data;
  }
);
