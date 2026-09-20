import createEventService from "@/services/eventServiceFactory";
import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const {
  getAllEventsByBusiness: getAllCheckoutEventsByBusiness,
  getEventBySlug: getCheckoutEventBySlug,
  getEventById: getCheckoutEventById,
  createEvent: createCheckoutEvent,
  updateEvent: updateCheckoutEvent,
  deleteEvent: deleteCheckoutEvent,
  cloneEvent: cloneCheckoutEvent,
} = createEventService("/checkout/events");

// Checkout owns the custom QR wrapper for ticketed events. The multipart
// contract is shared with EventReg and CheckIn, but the namespace keeps the
// event-type and permission boundary intact.
export const updateCheckoutEventCustomQrWrapper = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/checkout/events/${id}/custom-qr-wrapper`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true },
);
