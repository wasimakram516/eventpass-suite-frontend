/**
 * Pure helpers for the event "Custom Email Template" tab: which placeholders an
 * event offers, warnings shown on save, and the event modal tab layout.
 *
 * The classic field list and reserved names mirror the backend constants in
 * eventpass-suite-backend/src/constants/emailTemplate.js. Keep them in sync.
 */

import { clampSize } from "./clampSize.js";

export const EMAIL_TEMPLATE_RESERVED = Object.freeze({
  QR: "QR",
  TOKEN: "Token",
  EVENT_NAME: "Event Name",
  LOGO: "Logo",
  EVENT_DATE: "Event Start and End Date",
  START_DATE: "Start Date",
  END_DATE: "End Date",
  START_TIME: "Start Time",
  END_TIME: "End Time",
  VENUE: "Venue",
  EVENT_DESCRIPTION: "Event Description",
  ORGANIZER_NAME: "Organizer Name",
  ORGANIZER_EMAIL: "Organizer Email",
  ORGANIZER_PHONE: "Organizer Phone",
  ORGANIZER_ADDRESS: "Organizer Address",
  ORGANIZER_WEBSITE: "Organizer Website",
  ORGANIZER_OTHER_DETAILS: "Organizer Other Details",
  REGISTRATION_DETAILS: "Registration Details",
  CONFIRMATION_BUTTON: "Confirmation Button",
  PAYMENT_SUMMARY: "Payment Summary",
});

export const EMAIL_TEMPLATE_DEFAULTS = Object.freeze({
  ACCENT_COLOR: "#004aad",
  QR_SIZE: 180,
  QR_MIN_SIZE: 80,
  QR_MAX_SIZE: 400,
  LOGO_SIZE: 140,
  LOGO_MIN_SIZE: 40,
  LOGO_MAX_SIZE: 300,
});

/** Placeholders that cannot be filled in an email subject (they are visual or HTML blocks). */
const SUBJECT_UNSUPPORTED_KEYS = Object.freeze([
  EMAIL_TEMPLATE_RESERVED.QR,
  EMAIL_TEMPLATE_RESERVED.LOGO,
  EMAIL_TEMPLATE_RESERVED.PAYMENT_SUMMARY,
  EMAIL_TEMPLATE_RESERVED.EVENT_DESCRIPTION,
  EMAIL_TEMPLATE_RESERVED.REGISTRATION_DETAILS,
  EMAIL_TEMPLATE_RESERVED.CONFIRMATION_BUTTON,
]);

export const EMAIL_TEMPLATE_WARNINGS = Object.freeze({
  MISSING_QR: "MISSING_QR",
  UNKNOWN_PLACEHOLDER: "UNKNOWN_PLACEHOLDER",
  REMOVED_FIELD: "REMOVED_FIELD",
  SUBJECT_UNSUPPORTED: "SUBJECT_UNSUPPORTED",
});

const CLASSIC_FIELD_NAMES = Object.freeze(["Full Name", "Email", "Phone"]);
const PLACEHOLDER_REGEX = /\{([^{}]+)\}/g;

/**
 * Normalize placeholder text so "{First&nbsp;Name}" and "{first name}" match.
 * Must stay identical to the backend normalizePlaceholderKey.
 *
 * @param {string} raw - Text found between the braces
 * @returns {string} Lower case, single spaced, trimmed key
 */
export function normalizePlaceholderKey(raw) {
  return String(raw)
    .replace(/&nbsp;| /gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Format a field or reserved name as the text an admin pastes into the body.
 *
 * @param {string} name - Field name, e.g. "First Name"
 * @returns {string} e.g. "{First Name}"
 */
export function toPlaceholder(name) {
  return `{${name}}`;
}

/**
 * Whether rich text holds nothing visible. Empty editor markup such as
 * "<p><br></p>" counts as empty, while an image or any real text does not.
 * Mirrors the backend rule so both sides agree on "no header".
 *
 * @param {string|undefined|null} html - Editor output
 * @returns {boolean}
 */
export function isRichTextEmpty(html) {
  const source = String(html ?? "");
  if (/<img\b/i.test(source)) return false;
  return source.replace(/<[^>]*>/g, "").replace(/&nbsp;|\s|​/gi, "") === "";
}

/**
 * List the input fields an event collects, in the order shown in the tab.
 * Mirrors the backend rule: custom fields when enabled, else the classic set.
 *
 * @param {{useCustomFields?: boolean, formFields?: Array<{inputName?: string}>}} event
 * @returns {string[]} Unique, non empty field names
 */
export function getTemplateFieldNames({ useCustomFields, formFields }) {
  if (!useCustomFields) return [...CLASSIC_FIELD_NAMES];
  const names = (formFields || []).map((field) => (field.inputName || "").trim()).filter(Boolean);
  return [...new Set(names)];
}

/**
 * Names a template may still reference for the current fields: current names
 * plus every previous name, because the backend resolves renamed fields.
 *
 * @param {{useCustomFields?: boolean, formFields?: Array<{inputName?: string, previousNames?: string[]}>}} event
 * @returns {Set<string>} Normalized placeholder keys
 */
function getKnownFieldKeys({ useCustomFields, formFields }) {
  const keys = new Set(getTemplateFieldNames({ useCustomFields, formFields }).map(normalizePlaceholderKey));
  if (useCustomFields) {
    for (const field of formFields || []) {
      (field.previousNames || []).forEach((name) => keys.add(normalizePlaceholderKey(name)));
    }
  }
  return keys;
}

export const EMAIL_PLACEHOLDER_GROUPS = Object.freeze({
  EVENT_DETAILS: "eventDetails",
  ORGANIZER_DETAILS: "organizerDetails",
  QR_TOKEN: "qrToken",
  ATTENDEE_DETAILS: "attendeeDetails",
  PAYMENT: "payment",
  LINKS: "links",
});

/**
 * The built in placeholders of each group, in display order. This is the one
 * place they are listed, and the event details follow the event modal: the same
 * for every module, except start and end time, which the modal only collects for
 * CheckIn events, and the confirmation button, which only CheckIn has.
 *
 * @param {{isPaid: boolean, isCheckIn: boolean}} options
 * @returns {Record<string, string[]>} Built in names keyed by group id
 */
function getBuiltInGroups({ isPaid, isCheckIn }) {
  const R = EMAIL_TEMPLATE_RESERVED;
  const G = EMAIL_PLACEHOLDER_GROUPS;
  return {
    [G.EVENT_DETAILS]: [
      R.EVENT_NAME,
      R.LOGO,
      R.EVENT_DATE,
      R.START_DATE,
      R.END_DATE,
      ...(isCheckIn ? [R.START_TIME, R.END_TIME] : []),
      R.VENUE,
      R.EVENT_DESCRIPTION,
    ],
    [G.ORGANIZER_DETAILS]: [
      R.ORGANIZER_NAME,
      R.ORGANIZER_EMAIL,
      R.ORGANIZER_PHONE,
      R.ORGANIZER_ADDRESS,
      R.ORGANIZER_WEBSITE,
      R.ORGANIZER_OTHER_DETAILS,
    ],
    [G.QR_TOKEN]: [R.QR, R.TOKEN],
    [G.ATTENDEE_DETAILS]: [R.REGISTRATION_DETAILS],
    [G.PAYMENT]: isPaid ? [R.PAYMENT_SUMMARY] : [],
    [G.LINKS]: isCheckIn ? [R.CONFIRMATION_BUTTON] : [],
  };
}

/**
 * List the built in placeholders offered next to the field placeholders.
 *
 * @param {{isPaid?: boolean, isCheckIn?: boolean}} options
 * @returns {string[]} Reserved placeholder names available for this event
 */
export function getReservedPlaceholderNames({ isPaid = false, isCheckIn = false } = {}) {
  return Object.values(getBuiltInGroups({ isPaid, isCheckIn })).flat();
}

/**
 * Split every placeholder an event offers into the groups shown in the tab:
 * event details, organizer details, QR and token, attendee details (the input
 * fields plus the registration details table), payment for paid events, and
 * links for CheckIn events.
 *
 * @param {{useCustomFields?: boolean, formFields?: Array<{inputName?: string}>, isPaid?: boolean, isCheckIn?: boolean}} event
 * @returns {Array<{id: string, names: string[]}>} Non empty groups in display order
 */
export function getPlaceholderGroups({ useCustomFields, formFields, isPaid = false, isCheckIn = false }) {
  const builtIn = getBuiltInGroups({ isPaid, isCheckIn });
  const fieldNames = getTemplateFieldNames({ useCustomFields, formFields });
  return Object.values(EMAIL_PLACEHOLDER_GROUPS)
    .map((id) => ({
      id,
      names: id === EMAIL_PLACEHOLDER_GROUPS.ATTENDEE_DETAILS ? [...fieldNames, ...builtIn[id]] : builtIn[id],
    }))
    .filter((group) => group.names.length > 0);
}

/**
 * Find every placeholder written in a piece of text.
 *
 * @param {string|undefined|null} text - Subject or body
 * @returns {string[]} Raw names found between braces, in order
 */
export function findPlaceholders(text) {
  return [...String(text ?? "").matchAll(PLACEHOLDER_REGEX)].map((match) => match[1].trim());
}

/**
 * Whether a piece of text uses a given placeholder, ignoring case and spacing.
 *
 * @param {string|undefined|null} text - Subject or body
 * @param {string} name - Placeholder name without braces, e.g. "QR"
 * @returns {boolean}
 */
export function hasTemplatePlaceholder(text, name) {
  const target = normalizePlaceholderKey(name);
  return findPlaceholders(text).some((found) => normalizePlaceholderKey(found) === target);
}

/**
 * Work out the warnings shown when saving a template. Warnings never block a
 * save; they tell the admin what will not fill in.
 *
 * @param {object} params
 * @param {string} params.subject - Template subject
 * @param {string} params.body - Template body (rich text HTML)
 * @param {string} [params.header] - Optional header line
 * @param {boolean} params.useCustomFields - Whether the event uses custom fields
 * @param {Array<{inputName?: string, previousNames?: string[]}>} params.formFields - Custom fields
 * @param {string[]} params.selectedFields - Fields the admin ticked in the tab
 * @param {boolean} params.isPaid - Whether the event is paid
 * @param {boolean} [params.isCheckIn] - Whether the event is a CheckIn event
 * @returns {Array<{code: string, placeholders?: string[]}>}
 */
export function getTemplateWarnings({
  subject,
  body,
  header = "",
  useCustomFields,
  formFields,
  selectedFields = [],
  isPaid = false,
  isCheckIn = false,
}) {
  const warnings = [];
  const knownFieldKeys = getKnownFieldKeys({ useCustomFields, formFields });
  const reservedKeys = new Set(
    getReservedPlaceholderNames({ isPaid, isCheckIn }).map(normalizePlaceholderKey),
  );
  const bodyNames = findPlaceholders(body);
  const headerNames = findPlaceholders(header);
  const subjectNames = findPlaceholders(subject);

  if (!hasTemplatePlaceholder(body, EMAIL_TEMPLATE_RESERVED.QR) && !hasTemplatePlaceholder(header, EMAIL_TEMPLATE_RESERVED.QR)) {
    warnings.push({ code: EMAIL_TEMPLATE_WARNINGS.MISSING_QR });
  }

  const unknown = [...bodyNames, ...headerNames, ...subjectNames].filter((name) => {
    const key = normalizePlaceholderKey(name);
    return !knownFieldKeys.has(key) && !reservedKeys.has(key);
  });
  if (unknown.length) {
    warnings.push({ code: EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER, placeholders: [...new Set(unknown)] });
  }

  const subjectUnsupportedKeys = new Set(SUBJECT_UNSUPPORTED_KEYS.map(normalizePlaceholderKey));
  const subjectUnsupported = subjectNames.filter((name) => subjectUnsupportedKeys.has(normalizePlaceholderKey(name)));
  if (subjectUnsupported.length) {
    warnings.push({ code: EMAIL_TEMPLATE_WARNINGS.SUBJECT_UNSUPPORTED, placeholders: [...new Set(subjectUnsupported)] });
  }

  const removed = selectedFields.filter((name) => {
    const key = normalizePlaceholderKey(name);
    return !knownFieldKeys.has(key) && !reservedKeys.has(key);
  });
  if (removed.length) {
    warnings.push({ code: EMAIL_TEMPLATE_WARNINGS.REMOVED_FIELD, placeholders: removed });
  }

  return warnings;
}

/** Form state for a template that has never been saved: placeholder mode with default look, QR ticked. */
export const EMPTY_EMAIL_TEMPLATE_SETTINGS = Object.freeze({
  emailTemplateUsePlaceholders: true,
  emailTemplateSelectedFields: Object.freeze([EMAIL_TEMPLATE_RESERVED.QR]),
  emailTemplateQrSize: EMAIL_TEMPLATE_DEFAULTS.QR_SIZE,
  emailTemplateLogoSize: EMAIL_TEMPLATE_DEFAULTS.LOGO_SIZE,
  emailTemplateAccentColor: EMAIL_TEMPLATE_DEFAULTS.ACCENT_COLOR,
  emailTemplateHeader: "",
});

/**
 * Read the placeholder settings from a saved event's emailTemplate. A template
 * that already has a body but was saved without `usePlaceholders` stays in
 * legacy mode, so opening and re-saving an old event never changes its emails.
 * Only an event with no saved body starts in placeholder mode.
 *
 * @param {object|undefined|null} saved - event.emailTemplate from the API
 * @returns {typeof EMPTY_EMAIL_TEMPLATE_SETTINGS} Form state for the tab
 */
export function getEmailTemplateSettings(saved) {
  if (!saved?.body) return { ...EMPTY_EMAIL_TEMPLATE_SETTINGS };
  return {
    emailTemplateUsePlaceholders: saved.usePlaceholders === true,
    emailTemplateSelectedFields: Array.isArray(saved.selectedFields) ? saved.selectedFields : [],
    emailTemplateQrSize: saved.qrSize ?? EMAIL_TEMPLATE_DEFAULTS.QR_SIZE,
    emailTemplateLogoSize: saved.logoSize ?? EMAIL_TEMPLATE_DEFAULTS.LOGO_SIZE,
    emailTemplateAccentColor: saved.accentColor || EMAIL_TEMPLATE_DEFAULTS.ACCENT_COLOR,
    emailTemplateHeader: saved.header || "",
  };
}

/** Clamp the QR size to the supported range. */
export const clampQrSize = (value) =>
  clampSize(value, {
    min: EMAIL_TEMPLATE_DEFAULTS.QR_MIN_SIZE,
    max: EMAIL_TEMPLATE_DEFAULTS.QR_MAX_SIZE,
    fallback: EMAIL_TEMPLATE_DEFAULTS.QR_SIZE,
  });

/** Clamp the logo width to the supported range. */
export const clampLogoSize = (value) =>
  clampSize(value, {
    min: EMAIL_TEMPLATE_DEFAULTS.LOGO_MIN_SIZE,
    max: EMAIL_TEMPLATE_DEFAULTS.LOGO_MAX_SIZE,
    fallback: EMAIL_TEMPLATE_DEFAULTS.LOGO_SIZE,
  });

/**
 * Normalize the optional header, which is rich text and may contain
 * {Placeholders}. A blank editor means the email has no header and is sent as
 * "". Mirrors the backend sanitizeHeader.
 *
 * @param {*} value - Header HTML from the editor
 * @returns {string} Trimmed header HTML, "" when unset or blank
 */
export function normalizeHeader(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return isRichTextEmpty(trimmed) ? "" : trimmed;
}

/**
 * Build the emailTemplate object sent to the API from the modal form state.
 *
 * @param {object} formData - Event modal form state
 * @returns {{subject: string, body: string, usePlaceholders: boolean, selectedFields: string[],
 *   qrSize: number, logoSize: number, accentColor: string, header: string}}
 */
export function buildEmailTemplatePayload(formData) {
  return {
    subject: formData.emailTemplateSubject,
    body: formData.emailTemplateBody,
    usePlaceholders: formData.emailTemplateUsePlaceholders === true,
    selectedFields: [...(formData.emailTemplateSelectedFields || [])],
    qrSize: clampQrSize(formData.emailTemplateQrSize),
    logoSize: clampLogoSize(formData.emailTemplateLogoSize),
    accentColor: formData.emailTemplateAccentColor,
    header: normalizeHeader(formData.emailTemplateHeader),
  };
}

/**
 * Compute the event modal tab positions. The email template tab sits right
 * after the input fields tab (custom fields), or after Uploads when the event
 * uses classic fields, so the field set is settled before the template is
 * written.
 *
 * @param {{useCustomFields?: boolean, useCustomEmailTemplate?: boolean, useCustomQrCode?: boolean}} flags
 * @returns {{uploads: number, customFields: number, emailTemplate: number, badge: number, customQr: number, last: number}}
 *   Tab index of each tab, or -1 when that tab is not shown
 */
export function getEventModalTabIndices({ useCustomFields, useCustomEmailTemplate, useCustomQrCode }) {
  let next = 4;
  const customFields = useCustomFields ? next++ : -1;
  const emailTemplate = useCustomEmailTemplate ? next++ : -1;
  const badge = next++;
  const customQr = useCustomQrCode ? next++ : -1;
  return { uploads: 3, customFields, emailTemplate, badge, customQr, last: next - 1 };
}
