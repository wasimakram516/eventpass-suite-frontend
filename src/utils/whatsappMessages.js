/**
 * Helpers for configurable WhatsApp template messages. The checks mirror the
 * backend (src/utils/whatsappTemplate/messageValidation.js) so the admin sees
 * problems before saving; the backend stays the authority.
 */

export const WHATSAPP_VARIABLE_SOURCES = Object.freeze({
  FIELD: "field",
  PLACEHOLDER: "placeholder",
  TEXT: "text",
});

export const WHATSAPP_EVENT_TYPES = Object.freeze(["closed", "public", "checkout"]);

export const WHATSAPP_APPROVED = "approved";

export const WHATSAPP_MESSAGE_LIMITS = Object.freeze({
  MAX_MESSAGES_PER_EVENT: 20,
  MAX_LABEL_LENGTH: 60,
  MAX_VALUE_LENGTH: 1024,
  MAX_TEMPLATE_NAME_LENGTH: 100,
});

/**
 * The name EventPass shows for a library template: its own name, else the Twilio name.
 *
 * @param {{displayName?: string, name?: string}|null|undefined} template
 * @returns {string}
 */
export function templateLabel(template) {
  return template?.displayName || template?.name || "";
}

/**
 * The event type an event modal is editing, as the WhatsApp placeholders see it.
 *
 * @param {{isClosed?: boolean, moduleKey?: string}} params
 * @returns {"closed"|"public"|"checkout"}
 */
export function whatsappEventTypeFor({ isClosed = false, moduleKey = "eventreg" }) {
  if (isClosed) return "closed";
  return moduleKey === "checkout" ? "checkout" : "public";
}

/**
 * The id of whatever a message's template field holds (id string or populated object).
 *
 * @param {*} template
 * @returns {string}
 */
export function templateIdOf(template) {
  return String(template?._id || template || "");
}

/**
 * One empty variable row per slot of a template, keeping rows that already exist.
 *
 * @param {{variables?: string[]}|null} template - Library template
 * @param {Array<object>} [existing] - Current rows
 * @returns {Array<{position: string, source: string, value: string, fallback: string}>}
 */
export function buildVariableRows(template, existing = []) {
  const byPosition = new Map(existing.map((row) => [String(row.position), row]));
  return (template?.variables || []).map((position) => ({
    position,
    source: WHATSAPP_VARIABLE_SOURCES.TEXT,
    value: "",
    fallback: "",
    ...(byPosition.get(position) || {}),
  }));
}

/**
 * A new, empty message.
 *
 * @returns {{label: string, template: string, variables: Array}}
 */
export function createEmptyMessage() {
  return { label: "", template: "", variables: [] };
}

/**
 * Turn saved messages (populated or not) into editable form state.
 *
 * @param {Array<object>|undefined} saved
 * @returns {Array<object>}
 */
export function toEditableMessages(saved) {
  return (saved || []).map((message) => ({
    ...(message._id ? { _id: String(message._id) } : {}),
    label: message.label || "",
    template: templateIdOf(message.template),
    variables: (message.variables || []).map((variable) => ({
      position: String(variable.position),
      source: variable.source,
      value: variable.value || "",
      fallback: variable.fallback || "",
    })),
  }));
}

/**
 * What to send to the API: trimmed values and only the template's slots.
 *
 * @param {Array<object>} messages - Editable messages
 * @param {Map<string, object>} templatesById - Library templates keyed by id
 * @returns {Array<object>}
 */
export function toMessagesPayload(messages, templatesById) {
  return messages.map((message) => {
    const template = templatesById.get(templateIdOf(message.template));
    const rows = buildVariableRows(template, message.variables);
    return {
      ...(message._id ? { _id: message._id } : {}),
      label: message.label.trim(),
      template: templateIdOf(message.template),
      variables: rows.map((row) => ({
        position: row.position,
        source: row.source,
        value: String(row.value || "").trim(),
        fallback: String(row.fallback || "").trim(),
      })),
    };
  });
}

/**
 * First problem with one message, or null.
 *
 * @param {object} message - Editable message
 * @param {object} options
 * @param {Map<string, object>} options.templatesById
 * @param {string[]} options.placeholders - Placeholder names allowed here
 * @param {string[]|null} options.fieldNames - Registration fields, or null when fields are not allowed
 * @returns {string|null}
 */
export function validateWhatsAppMessage(message, { templatesById, placeholders, fieldNames }) {
  const label = (message.label || "").trim();
  if (!label) return "Every WhatsApp message needs a name.";
  if (label.length > WHATSAPP_MESSAGE_LIMITS.MAX_LABEL_LENGTH) return `WhatsApp message name "${label}" is too long.`;

  const template = templatesById.get(templateIdOf(message.template));
  if (!template) return `Message "${label}": choose a template from the library.`;

  for (const row of buildVariableRows(template, message.variables)) {
    const where = `Message "${label}" {{${row.position}}}`;
    const value = String(row.value || "").trim();
    if (!value) return `${where}: a value is required.`;
    if (value.length > WHATSAPP_MESSAGE_LIMITS.MAX_VALUE_LENGTH) return `${where}: the value is too long.`;
    if (String(row.fallback || "").length > WHATSAPP_MESSAGE_LIMITS.MAX_VALUE_LENGTH) return `${where}: the fallback is too long.`;
    if (row.source === WHATSAPP_VARIABLE_SOURCES.FIELD) {
      if (!fieldNames) return `${where}: registration fields are not available here.`;
      if (!fieldNames.includes(value)) return `${where}: "${value}" is not a registration field of this event.`;
    }
    if (row.source === WHATSAPP_VARIABLE_SOURCES.PLACEHOLDER && !placeholders.includes(value)) {
      return `${where}: "${value}" is not available for this event type.`;
    }
  }
  return null;
}

/**
 * First problem with a list of messages (per message checks plus unique names), or null.
 *
 * @param {Array<object>} messages
 * @param {object} options - See validateWhatsAppMessage
 * @returns {string|null}
 */
export function validateWhatsAppMessages(messages, options) {
  if (messages.length > WHATSAPP_MESSAGE_LIMITS.MAX_MESSAGES_PER_EVENT) {
    return `At most ${WHATSAPP_MESSAGE_LIMITS.MAX_MESSAGES_PER_EVENT} WhatsApp messages are allowed.`;
  }
  const labels = new Set();
  for (const message of messages) {
    const error = validateWhatsAppMessage(message, options);
    if (error) return error;
    const key = message.label.trim().toLowerCase();
    if (labels.has(key)) return `Two WhatsApp messages are named "${message.label.trim()}".`;
    labels.add(key);
  }
  return null;
}

/**
 * Show a template body with each {{n}} replaced by a readable description of
 * its mapping, e.g. "Hello [Full Name] ...", for the editor preview.
 *
 * @param {string} body - Template body
 * @param {Array<object>} rows - Variable rows
 * @returns {string}
 */
export function describeTemplateBody(body, rows) {
  const byPosition = new Map(rows.map((row) => [String(row.position), row]));
  return String(body || "").replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (match, slot) => {
    const row = byPosition.get(slot);
    const value = String(row?.value || "").trim();
    if (!value) return match;
    return row.source === WHATSAPP_VARIABLE_SOURCES.TEXT ? value : `[${value}]`;
  });
}

const MODULE_BY_EVENT_TYPE = Object.freeze({ closed: "checkin", public: "eventreg", checkout: "checkout" });

/**
 * The registrations API module of an event type, for the send dialog endpoints.
 *
 * @param {string} eventType
 * @returns {"checkin"|"eventreg"|"checkout"|null}
 */
export function moduleKeyForEventType(eventType) {
  return MODULE_BY_EVENT_TYPE[eventType] || null;
}

/**
 * The message a send dialog preselects: the one named "Default", else the first one.
 *
 * @param {Array<{_id: string, label: string}>} messages
 * @returns {string} Message id, or "" when there are none
 */
export function pickDefaultMessageId(messages) {
  if (!messages.length) return "";
  const match = messages.find((message) => message.label.trim().toLowerCase() === "default");
  return String((match || messages[0])._id);
}

/**
 * Whether any of the given texts contains the search query (case insensitive).
 * An empty query matches everything.
 *
 * @param {Array<string|null|undefined>} texts
 * @param {string} query
 * @returns {boolean}
 */
export function matchesSearch(texts, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;
  return texts.some((text) => String(text || "").toLowerCase().includes(needle));
}

/**
 * Split a template body into plain text and {{n}} slot parts, for highlighting.
 *
 * @param {string} body
 * @returns {Array<{text: string, slot: boolean}>}
 */
export function splitTemplateBody(body) {
  return String(body || "")
    .split(/(\{\{\s*[A-Za-z0-9_]+\s*\}\})/g)
    .filter(Boolean)
    .map((text) => ({ text, slot: /^\{\{\s*[A-Za-z0-9_]+\s*\}\}$/.test(text) }));
}
