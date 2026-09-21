/**
 * Helpers for the notification modals (bulk and single). They keep the email
 * hierarchy on the client aligned with the backend:
 * one off custom template > the event's own custom template > system default.
 */
import {
  EMPTY_EMAIL_TEMPLATE_SETTINGS,
  getEmailTemplateSettings,
  isRichTextEmpty,
} from "./emailTemplatePlaceholders.js";

/**
 * Whether the event has its own custom email template, which then is what a
 * "Default" notification sends.
 *
 * @param {object|null|undefined} event - Event from the API
 * @returns {boolean}
 */
export function hasEventEmailTemplate(event) {
  return !!(event?.useCustomEmailTemplate && event.emailTemplate?.subject && event.emailTemplate?.body);
}

/**
 * Whether the event is paid, so the composer offers {Payment Summary}.
 *
 * @param {object|null|undefined} event - Event from the API
 * @returns {boolean}
 */
export function isEventPaid(event) {
  return Boolean(event?.isPaid || event?.eventType === "checkout");
}

/**
 * Build the starting form for the "Custom" notification: the same shape the
 * event setup tab edits, pre-filled from the event's own template when that
 * template uses placeholders. A template saved in the older layout is not
 * copied, because without placeholders it would send no QR code.
 *
 * @param {object|null|undefined} event - Event from the API
 * @returns {object} Form state for EmailTemplateTab and EmailPreviewPane
 */
export function buildCustomTemplateForm(event) {
  const saved = event?.emailTemplate;
  const canPrefill = hasEventEmailTemplate(event) && saved.usePlaceholders === true;
  const settings = canPrefill ? getEmailTemplateSettings(saved) : { ...EMPTY_EMAIL_TEMPLATE_SETTINGS };
  const formFields = Array.isArray(event?.formFields) ? event.formFields : [];

  return {
    ...settings,
    emailTemplateUsePlaceholders: true,
    emailTemplateSubject: canPrefill ? saved.subject : "",
    emailTemplateBody: canPrefill ? saved.body : "",
    useCustomFields: event?.useCustomFields ?? formFields.length > 0,
    formFields,
    name: event?.name || "",
    logoPreview: event?.logoUrl || "",
    organizerLogoPreview: event?.organizerLogoUrl || "",
    defaultLanguage: event?.defaultLanguage || "en",
  };
}

/**
 * Check the required parts of a custom notification.
 *
 * @param {object} form - Form state from buildCustomTemplateForm
 * @returns {{subject: boolean, body: boolean}} true for each part that is missing
 */
export function validateCustomTemplateForm(form) {
  return {
    subject: !String(form.emailTemplateSubject ?? "").trim(),
    body: isRichTextEmpty(form.emailTemplateBody),
  };
}

/**
 * Build the request fields for sending an email notification. A default send
 * carries only the recipient filters; the backend then uses the event's own
 * template (or the system default). A custom send adds the one off template.
 *
 * @param {{type?: string, customTemplate?: object, statusFilter?: string,
 *   emailSentFilter?: string, whatsappSentFilter?: string}} data - What the modal reports
 * @returns {object} Fields for the bulk email service (values are strings)
 */
export function buildEmailSendFields(data) {
  const fields = {
    statusFilter: data.statusFilter || "all",
    emailSentFilter: data.emailSentFilter || "all",
    whatsappSentFilter: data.whatsappSentFilter || "all",
  };
  if (data.type === "custom" && data.customTemplate) {
    fields.customTemplate = JSON.stringify(data.customTemplate);
  }
  return fields;
}
