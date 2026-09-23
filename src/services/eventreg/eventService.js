import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";
import createEventService from "@/services/eventServiceFactory";

export const {
  getAllEventsByBusiness: getAllPublicEventsByBusiness,
  getEventBySlug: getPublicEventBySlug,
  getEventBySlugForCms: getPublicEventBySlugForCms,
  getEventById: getPublicEventById,
  createEvent: createPublicEvent,
  updateEvent: updatePublicEvent,
  deleteEvent: deletePublicEvent,
  cloneEvent: clonePublicEvent,
} = createEventService("/eventreg/events");

export const getEventsByBusinessId = withApiHandler(async (businessId) => {
  const { data } = await api.get(`/eventreg/events/business/${businessId}`);
  return data;
});

export const getEventsByBusinessSlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/events/business/slug/${slug}`);
  return data.data?.events;
});

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
