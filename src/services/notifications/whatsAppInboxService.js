import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

/* =========================
   WHATSAPP INBOX (ADMIN)
========================= */

/**
 * Get WhatsApp Inbox (grouped by phone)
 * Filters: eventId | businessId
 */
export const getWhatsAppInbox = withApiHandler(async (params = {}) => {
  const { data } = await api.get(
    "/notifications/whatsapp-inbox",
    { params }
  );
  return data;
});

/**
 * Get full conversation for a phone
 * Required: eventId, to
 */
export const getWhatsAppConversation = withApiHandler(
  async ({ eventId, to, limit = 50 }) => {
    const { data } = await api.get(
      "/notifications/whatsapp-inbox/conversation",
      {
        params: { eventId, to, limit },
      }
    );
    return data;
  }
);

/**
 * Send manual WhatsApp reply (admin → user)
 */
export const sendWhatsAppReply = withApiHandler(
  async (payload) => {
    const { data } = await api.post(
      "/notifications/whatsapp-inbox/reply",
      payload
    );
    return data;
  },
  { showSuccess: true }
);
