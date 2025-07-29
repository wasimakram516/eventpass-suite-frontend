import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all events (protected)
export const getAllCheckInEvents = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/checkin/events`, {
    params: { businessSlug },
  });
  return data;
});

// Get event by slug (public use)
export const getCheckInEventBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/checkin/events/slug/${slug}`);
  return data;
});

// Get event by ID (CMS use)
export const getCheckInEventById = withApiHandler(async (id) => {
  const { data } = await api.get(`/checkin/events/${id}`);
  return data;
});

// Create event (supports logo upload via FormData)
export const createCheckInEvent = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/checkin/events", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update event by ID (supports logo upload via FormData)
export const updateCheckInEvent = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/checkin/events/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Delete event by ID
export const deleteCheckInEvent = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/checkin/events/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Download employee template (raw blob)
export const downloadEmployeeTemplate = withApiHandler(async () => {
  const response = await api.get("/checkin/events/download-template", {
    responseType: "blob",
  });
  return response.data;
});
