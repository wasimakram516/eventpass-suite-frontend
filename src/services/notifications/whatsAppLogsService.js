import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

/* =========================
   WHATSAPP LOGS (ADMIN)
========================= */

/**
 * Get WhatsApp logs (paginated + filters)
 *
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} params.registrationId
 * @param {string} params.businessId
 * @param {string} params.token
 * @param {string} params.to
 * @param {string} params.status
 * @param {string} params.direction
 * @param {number} params.page
 * @param {number} params.limit
 */
export const getWhatsAppLogs = withApiHandler(async (params = {}) => {
  const { data } = await api.get("/notifications/whatsapp-logs", {
    params,
  });

  // data = { data, pagination }
  return data;
});

/**
 * Get WhatsApp logs by registration (paginated)
 *
 * @param {string} registrationId
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 */
export const getWhatsAppLogsByRegistration = withApiHandler(
  async (registrationId, params = {}) => {
    const { data } = await api.get(
      `/notifications/whatsapp-logs/registration/${registrationId}`,
      { params }
    );

    // data = { data, pagination }
    return data;
  }
);

/**
 * Get single WhatsApp log by ID
 *
 * @param {string} id
 */
export const getWhatsAppLogById = withApiHandler(async (id) => {
  const { data } = await api.get(`/notifications/whatsapp-logs/${id}`);
  return data;
});
