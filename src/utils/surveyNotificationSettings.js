import {
  buildEmailTemplatePayload,
  getEmailTemplateSettings,
  isRichTextEmpty,
} from "./emailTemplatePlaceholders.js";
import { toEditableMessages, toMessagesPayload, validateWhatsAppMessages } from "./whatsappMessages.js";

/**
 * Build editable notification state from a SurveyGuru form and linked event.
 *
 * @param {object|null} form - Saved survey form
 * @param {object|null} event - Linked event
 * @returns {object} Notification editor state
 */
export function createSurveyNotificationSettings(form = null, event = null) {
  return {
    useCustomEmailTemplate: Boolean(form?.useCustomEmailTemplate),
    emailTemplateSubject: form?.emailTemplate?.subject || "",
    emailTemplateBody: form?.emailTemplate?.body || "",
    ...getEmailTemplateSettings(form?.emailTemplate),
    useCustomWhatsAppMessages: Boolean(form?.useCustomWhatsAppMessages),
    whatsappMessages: toEditableMessages(form?.whatsappMessages),
    name: event?.name || "Survey",
    logoPreview: event?.logoUrl || "",
    organizerLogoPreview: event?.organizerLogoUrl || "",
    useCustomFields: Boolean(event?.useCustomFields),
    formFields: event?.formFields || [],
    defaultLanguage: form?.defaultLanguage || "en",
  };
}

/**
 * Validate the enabled SurveyGuru notification editors before save.
 *
 * @param {object} settings - Editable notification state
 * @param {object} whatsappCatalog - Loaded template/placeholder catalog
 * @param {boolean} isAnonymous - Whether registration fields are forbidden
 * @returns {string|null} First validation error
 */
export function validateSurveyNotificationSettings(settings, whatsappCatalog, isAnonymous) {
  if (
    settings.useCustomEmailTemplate &&
    (!settings.emailTemplateSubject.trim() || isRichTextEmpty(settings.emailTemplateBody))
  ) {
    return "Custom email subject and body are required.";
  }
  if (!settings.useCustomWhatsAppMessages) return null;
  return validateWhatsAppMessages(settings.whatsappMessages, {
    templatesById: whatsappCatalog.templatesById,
    placeholders: whatsappCatalog.placeholders,
    fieldNames: isAnonymous
      ? null
      : settings.useCustomFields
        ? settings.formFields.map((field) => field.inputName).filter(Boolean)
        : ["Full Name", "Email", "Phone"],
  });
}

/**
 * Convert notification editor state to the SurveyForm API contract.
 *
 * @param {object} settings - Editable notification state
 * @param {object} whatsappCatalog - Loaded WhatsApp catalog
 * @returns {object} Survey notification fields
 */
export function buildSurveyNotificationPayload(settings, whatsappCatalog) {
  const payload = {
    useCustomEmailTemplate: settings.useCustomEmailTemplate,
    emailTemplate: buildEmailTemplatePayload(settings),
    useCustomWhatsAppMessages: settings.useCustomWhatsAppMessages,
  };
  if (whatsappCatalog.templatesById.size > 0 || settings.whatsappMessages.length === 0) {
    payload.whatsappMessages = toMessagesPayload(settings.whatsappMessages, whatsappCatalog.templatesById);
  }
  return payload;
}
