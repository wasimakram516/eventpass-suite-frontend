export const DEFAULT_RECIPIENT_FILTER = "all";
export const SURVEY_DEFAULT_RECIPIENT_FILTER = "not_responded";

export const REGISTRATION_RECIPIENT_FILTER_PAYLOADS = Object.freeze({
  all: Object.freeze({ statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "all" }),
  approved: Object.freeze({ statusFilter: "approved", emailSentFilter: "all", whatsappSentFilter: "all" }),
  rejected: Object.freeze({ statusFilter: "rejected", emailSentFilter: "all", whatsappSentFilter: "all" }),
  confirmed: Object.freeze({ statusFilter: "confirmed", emailSentFilter: "all", whatsappSentFilter: "all" }),
  notConfirmed: Object.freeze({ statusFilter: "notConfirmed", emailSentFilter: "all", whatsappSentFilter: "all" }),
  pending: Object.freeze({ statusFilter: "pending", emailSentFilter: "all", whatsappSentFilter: "all" }),
  emailSent: Object.freeze({ statusFilter: "all", emailSentFilter: "sent", whatsappSentFilter: "all" }),
  emailNotSent: Object.freeze({ statusFilter: "all", emailSentFilter: "notSent", whatsappSentFilter: "all" }),
  whatsappSent: Object.freeze({ statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "sent" }),
  whatsappNotSent: Object.freeze({ statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "notSent" }),
});

export const SURVEY_RECIPIENT_FILTER_PAYLOADS = Object.freeze({
  all: Object.freeze({ recipientScope: "all" }),
  not_responded: Object.freeze({ recipientScope: "not_responded" }),
  never_notified: Object.freeze({ recipientScope: "never_notified" }),
  never_whatsapp: Object.freeze({ recipientScope: "never_whatsapp" }),
});

/**
 * Resolve a selected notification-recipient filter into its API payload.
 *
 * @param {string} selectedFilter - Selected dropdown value
 * @param {Record<string, object>} filterPayloads - Payload indexed by dropdown value
 * @param {string} fallbackFilter - Value used when the selection is unknown
 * @returns {object} A copy of the resolved filter payload
 */
export function getNotificationRecipientFilterPayload(
  selectedFilter,
  filterPayloads = REGISTRATION_RECIPIENT_FILTER_PAYLOADS,
  fallbackFilter = DEFAULT_RECIPIENT_FILTER,
) {
  const payload = filterPayloads[selectedFilter] ?? filterPayloads[fallbackFilter] ?? {};
  return { ...payload };
}
