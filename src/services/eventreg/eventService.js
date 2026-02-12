import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all events (CMS use, protected)
export const getAllPublicEventsByBusiness = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/eventreg/events`, {
    params: { businessSlug },
  });
  return data;
});

// Get event by slug (public use)
export const getPublicEventBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/events/slug/${slug}`);
  return data;
});

// Get event by ID (CMS use)
export const getPublicEventById = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventreg/events/${id}`);
  return data;
});

export const getEventsByBusinessId = withApiHandler(async (businessId) => {
  const { data } = await api.get(`/eventreg/events/business/${businessId}`);
  return data;
});

export const getEventsByBusinessSlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/events/business/slug/${slug}`);
  return data.events;
});

// Create a new event (JSON with media URLs)
export const createPublicEvent = withApiHandler(
  async (eventData) => {
    const { data } = await api.post("/eventreg/events", eventData);
    return data;
  },
  { showSuccess: true }
);

// Update an event by ID (JSON with media URLs)
export const updatePublicEvent = withApiHandler(
  async (id, eventData) => {
    const { data } = await api.put(`/eventreg/events/${id}`, eventData);
    return data;
  },
  { showSuccess: true }
);

// Update event custom QR wrapper (multipart: customQrWrapper JSON + optional files)
export const updatePublicEventCustomQrWrapper = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/eventreg/events/${id}/custom-qr-wrapper`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Delete an event by ID
export const deletePublicEvent = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/eventreg/events/${id}`);
    return data;
  },
  { showSuccess: true }
);
