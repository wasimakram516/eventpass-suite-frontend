import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

const BASE = "/notifications/whatsapp-templates";

/* =========================
   TEMPLATE LIBRARY
========================= */

/** Every template in the library (any approval status). */
export const getWhatsAppTemplates = withApiHandler(async () => {
  const { data } = await api.get(BASE);
  return data;
});

/** Placeholder names offered for the given event types, e.g. ["closed"]. */
export const getWhatsAppPlaceholders = withApiHandler(async (eventTypes = []) => {
  const { data } = await api.get(`${BASE}/placeholders`, {
    params: eventTypes.length ? { eventType: eventTypes.join(",") } : {},
  });
  return data;
});

/** Templates on the Twilio account, flagged when already imported (superadmin). */
export const getTwilioWhatsAppTemplates = withApiHandler(async () => {
  const { data } = await api.get(`${BASE}/twilio`);
  return data;
});

/** Import one Twilio template into the library, optionally under an EventPass name (superadmin). */
export const importWhatsAppTemplate = withApiHandler(
  async (contentSid, displayName) => {
    const { data } = await api.post(`${BASE}/import`, { contentSid, displayName });
    return data;
  },
  { showSuccess: true }
);

/** Rename a library template in EventPass; empty restores the Twilio name (superadmin). */
export const renameWhatsAppTemplate = withApiHandler(
  async (id, displayName) => {
    const { data } = await api.patch(`${BASE}/${id}`, { displayName });
    return data;
  },
  { showSuccess: true }
);

/** Refresh a library template's details and approval status from Twilio (superadmin). */
export const syncWhatsAppTemplate = withApiHandler(
  async (id) => {
    const { data } = await api.post(`${BASE}/${id}/sync`);
    return data;
  },
  { showSuccess: true }
);

/** Remove a template from the library; refused while events or defaults use it (superadmin). */
export const deleteWhatsAppTemplate = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`${BASE}/${id}`);
    return data;
  },
  { showSuccess: true }
);

/* =========================
   PLATFORM DEFAULT MESSAGES
========================= */

export const getWhatsAppDefaultMessages = withApiHandler(async () => {
  const { data } = await api.get(`${BASE}/defaults`);
  return data;
});

export const createWhatsAppDefaultMessage = withApiHandler(
  async (payload) => {
    const { data } = await api.post(`${BASE}/defaults`, payload);
    return data;
  },
  { showSuccess: true }
);

export const updateWhatsAppDefaultMessage = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`${BASE}/defaults/${id}`, payload);
    return data;
  },
  { showSuccess: true }
);

export const deleteWhatsAppDefaultMessage = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`${BASE}/defaults/${id}`);
    return data;
  },
  { showSuccess: true }
);

/* =========================
   PER EVENT (SEND DIALOG)
========================= */

/**
 * Registration API base for a module, e.g. "/checkin/registrations".
 *
 * @param {"checkin"|"eventreg"|"checkout"} moduleKey
 * @returns {string}
 */
const registrationsBase = (moduleKey) => `/${moduleKey}/registrations`;

/** The messages an event can send: its own, or the platform defaults. */
export const getEventWhatsAppMessages = withApiHandler(async (moduleKey, slug) => {
  const { data } = await api.get(`${registrationsBase(moduleKey)}/event/${slug}/whatsapp-messages`);
  return data;
});

/** Render a message for one registration (the first one when none is given). */
export const previewEventWhatsAppMessage = withApiHandler(
  async (moduleKey, slug, { messageId, registrationId } = {}) => {
    const { data } = await api.post(`${registrationsBase(moduleKey)}/event/${slug}/whatsapp-preview`, {
      messageId,
      ...(registrationId ? { registrationId } : {}),
    });
    return data;
  }
);
