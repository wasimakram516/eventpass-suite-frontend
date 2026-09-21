/**
 * Client side preview of an event's custom email, shown next to the settings so
 * a designer sees each change immediately. It mirrors the backend builder
 * (eventpass-suite-backend/src/utils/emailTemplateBuilder/placeholderEmailBuilder.js):
 * same placeholder rules, escaping, header band and accent color. Keep the two
 * in sync. Attendee values here are samples, never real registrations.
 */
import {
  EMAIL_TEMPLATE_DEFAULTS,
  EMAIL_TEMPLATE_RESERVED,
  clampLogoSize,
  clampQrSize,
  getTemplateFieldNames,
  hasTemplatePlaceholder,
  normalizeHeader,
  normalizePlaceholderKey,
} from "./emailTemplatePlaceholders.js";
import { getEventDetailSamples, getSampleDescriptionHtml } from "./emailEventDetails.js";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const PLACEHOLDER_REGEX = /\{([^{}]+)\}/g;
const SAMPLE_TOKEN = "A1B2C3D4E5";
const DARK_TEXT = "#111111";
const LIGHT_TEXT = "#ffffff";
const LUMINANCE_THRESHOLD = 0.6;
const SAMPLE_EVENT_NAME = "Your Event";

const HTML_ESCAPES = Object.freeze({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" });

const CLASSIC_SAMPLE_VALUES = Object.freeze({
  "full name": "Sara Al Balushi",
  email: "sara@example.com",
  phone: "+968 9123 4567",
});

/**
 * Escape a value for safe insertion into HTML.
 *
 * @param {*} value - Any value; null and undefined become ""
 * @returns {string} HTML safe string
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Pick black or white text so it stays readable on a background color.
 *
 * @param {string} hexColor - "#rrggbb" background color
 * @returns {string} "#ffffff" for dark backgrounds, "#111111" for light ones
 */
export function getReadableTextColor(hexColor) {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > LUMINANCE_THRESHOLD ? DARK_TEXT : LIGHT_TEXT;
}

/**
 * Replace {Placeholder} tokens in one pass; unknown ones are left as typed.
 *
 * @param {string} template - Subject or rich text HTML
 * @param {Map<string, {value: string, html?: boolean}>} entries - normalized key -> replacement
 * @param {{escape?: boolean}} [options] - escape plain values as HTML (default true)
 * @returns {string} The template with known placeholders replaced
 */
export function renderPlaceholders(template, entries, { escape = true } = {}) {
  return String(template ?? "").replace(PLACEHOLDER_REGEX, (match, raw) => {
    const entry = entries.get(normalizePlaceholderKey(raw));
    if (!entry) return match;
    return entry.html || !escape ? entry.value : escapeHtml(entry.value);
  });
}

/**
 * Register a replacement under a placeholder name, using the same key
 * normalization the renderer uses to look it up. Mirrors the backend helper.
 *
 * @param {Map<string, {value: string, html?: boolean}>} entries - Replacements keyed by normalized name
 * @param {string} name - Placeholder name without braces, e.g. "QR"
 * @param {{value: string, html?: boolean}} entry - What replaces the placeholder
 * @returns {void}
 */
function setPlaceholderEntry(entries, name, entry) {
  entries.set(normalizePlaceholderKey(name), entry);
}

/**
 * Sample answer shown for an attendee field in the preview.
 *
 * @param {string} fieldName - Field label, e.g. "Full Name" or "Company"
 * @returns {string} A believable sample value
 */
export function getSampleFieldValue(fieldName) {
  return CLASSIC_SAMPLE_VALUES[normalizePlaceholderKey(fieldName)] ?? `Sample ${fieldName}`;
}

/**
 * Sample payment summary for paid events, colored with the accent color.
 *
 * @param {string} accentColor - Sanitized hex color
 * @returns {string} HTML table
 */
function buildSamplePaymentHtml(accentColor) {
  return `
        <h3 style="margin-top:24px;font-size:17px;color:${accentColor};">Payment Summary:</h3>
        <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
          <tr><td style="padding:4px 0;">Standard ticket</td><td style="padding:4px 0;text-align:end;">10.000 OMR</td></tr>
          <tr><td style="padding:4px 0;color:#555;">VAT (5%)</td><td style="padding:4px 0;text-align:end;">0.500 OMR</td></tr>
          <tr><td style="padding:8px 0;border-top:2px solid ${accentColor};font-weight:700;">Total Paid</td><td style="padding:8px 0;border-top:2px solid ${accentColor};text-align:end;font-weight:700;">10.500 OMR</td></tr>
        </table>`;
}

/**
 * Sample table for {Registration Details}: one row per attendee field.
 *
 * @param {string[]} fieldNames - Attendee field labels
 * @returns {string} HTML table
 */
function buildSampleRegistrationDetailsHtml(fieldNames) {
  const rows = fieldNames
    .map((label) => `<tr><td style="padding:4px 0;"><strong>${escapeHtml(label)}:</strong></td><td style="padding:4px 0;">${escapeHtml(getSampleFieldValue(label))}</td></tr>`)
    .join("");
  return `<table style="width:100%;font-size:14px;color:#333;">${rows}</table>`;
}

/**
 * Sample confirmation button for CheckIn events, in the accent color.
 *
 * @param {string} accentColor - Sanitized hex color
 * @returns {string} HTML button
 */
function buildSampleConfirmationButtonHtml(accentColor) {
  return `<div style="padding:16px 0;text-align:center;"><a href="#" style="display:inline-block;background:${accentColor};color:${getReadableTextColor(accentColor)};text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:10px;">Confirm your attendance</a></div>`;
}

/**
 * A dashed box standing in for an image that is not available yet, so the
 * designer still sees where the placeholder sits and how big it will be.
 *
 * @param {string} label - Text inside the box
 * @param {number} size - Width in pixels
 * @returns {string} HTML for the box
 */
function buildImageStandIn(label, size) {
  return `<span style="display:inline-block;box-sizing:border-box;width:${size}px;max-width:100%;padding:14px 0;border:1px dashed #999;border-radius:6px;text-align:center;font-size:12px;color:#666;">${escapeHtml(label)}</span>`;
}

/**
 * Build the preview of a placeholder mode email from the current form values.
 *
 * @param {object} params
 * @param {{subject?: string, body?: string, header?: string, accentColor?: string,
 *   qrSize?: number|string, logoSize?: number|string}} params.template - Current template settings
 * @param {boolean} params.useCustomFields - Whether the event uses custom fields
 * @param {Array<{inputName?: string}>} params.formFields - Custom fields
 * @param {string} [params.eventName] - Event name typed so far
 * @param {string} [params.logoUrl] - Logo image URL or preview URL, if any
 * @param {string} [params.qrDataUrl] - Sample QR image as a data URL, once generated
 * @param {boolean} [params.isPaid] - Whether the event is paid
 * @param {boolean} [params.isCheckIn] - Whether the event is a CheckIn event (times and the confirmation button)
 * @param {object} [params.eventInfo] - Event details from emailEventDetails (dates, venue, organizer, description)
 * @param {"en"|"ar"} [params.language] - Email language, sets the text direction
 * @returns {{subject: string, html: string}} Rendered subject and a full HTML document
 */
export function buildEmailPreview({
  template,
  useCustomFields,
  formFields,
  eventName,
  logoUrl,
  qrDataUrl,
  isPaid = false,
  isCheckIn = false,
  eventInfo,
  language = "en",
}) {
  const accentColor = HEX_COLOR_REGEX.test(template.accentColor || "")
    ? template.accentColor
    : EMAIL_TEMPLATE_DEFAULTS.ACCENT_COLOR;
  const header = normalizeHeader(template.header);
  const qrSize = clampQrSize(template.qrSize);
  const logoSize = clampLogoSize(template.logoSize);
  const name = (eventName || "").trim() || SAMPLE_EVENT_NAME;
  const usedInBodyOrHeader = (placeholder) =>
    hasTemplatePlaceholder(template.body, placeholder) || hasTemplatePlaceholder(header, placeholder);

  const paymentHtml = isPaid ? buildSamplePaymentHtml(accentColor) : "";

  const fieldEntries = new Map();
  for (const fieldName of getTemplateFieldNames({ useCustomFields, formFields })) {
    setPlaceholderEntry(fieldEntries, fieldName, { value: getSampleFieldValue(fieldName) });
  }
  setPlaceholderEntry(fieldEntries, EMAIL_TEMPLATE_RESERVED.TOKEN, { value: SAMPLE_TOKEN });
  setPlaceholderEntry(fieldEntries, EMAIL_TEMPLATE_RESERVED.EVENT_NAME, { value: name });
  for (const detail of getEventDetailSamples({ eventInfo, isCheckIn, language })) {
    setPlaceholderEntry(fieldEntries, detail.name, { value: detail.value });
  }

  const visualEntries = new Map(fieldEntries);
  setPlaceholderEntry(visualEntries, EMAIL_TEMPLATE_RESERVED.LOGO, {
    value: logoUrl
      ? `<img src="${escapeHtml(logoUrl)}" alt="Event Logo" width="${logoSize}" style="width:${logoSize}px;max-width:100%;height:auto;" />`
      : buildImageStandIn("Event logo", logoSize),
    html: true,
  });
  setPlaceholderEntry(visualEntries, EMAIL_TEMPLATE_RESERVED.QR, {
    value: qrDataUrl
      ? `<img src="${qrDataUrl}" alt="QR Code" width="${qrSize}" style="width:${qrSize}px;max-width:100%;height:auto;" />`
      : buildImageStandIn("QR code", qrSize),
    html: true,
  });
  setPlaceholderEntry(visualEntries, EMAIL_TEMPLATE_RESERVED.PAYMENT_SUMMARY, {
    value: paymentHtml,
    html: true,
  });

  setPlaceholderEntry(visualEntries, EMAIL_TEMPLATE_RESERVED.EVENT_DESCRIPTION, {
    value: getSampleDescriptionHtml(eventInfo),
    html: true,
  });
  setPlaceholderEntry(visualEntries, EMAIL_TEMPLATE_RESERVED.REGISTRATION_DETAILS, {
    value: buildSampleRegistrationDetailsHtml(getTemplateFieldNames({ useCustomFields, formFields })),
    html: true,
  });
  setPlaceholderEntry(visualEntries, EMAIL_TEMPLATE_RESERVED.CONFIRMATION_BUTTON, {
    value: isCheckIn ? buildSampleConfirmationButtonHtml(accentColor) : "",
    html: true,
  });

  // Visual blocks mean nothing in a subject.
  const subjectEntries = new Map(fieldEntries);
  for (const blockName of [
    EMAIL_TEMPLATE_RESERVED.QR,
    EMAIL_TEMPLATE_RESERVED.LOGO,
    EMAIL_TEMPLATE_RESERVED.PAYMENT_SUMMARY,
    EMAIL_TEMPLATE_RESERVED.EVENT_DESCRIPTION,
    EMAIL_TEMPLATE_RESERVED.REGISTRATION_DETAILS,
    EMAIL_TEMPLATE_RESERVED.CONFIRMATION_BUTTON,
  ]) {
    setPlaceholderEntry(subjectEntries, blockName, { value: "" });
  }

  const body = renderPlaceholders(template.body, visualEntries);
  const paymentAppend = usedInBodyOrHeader(EMAIL_TEMPLATE_RESERVED.PAYMENT_SUMMARY) ? "" : paymentHtml;
  const headerHtml = header
    ? `<div style="background:${accentColor};padding:24px;color:${getReadableTextColor(accentColor)};line-height:1.3;">${renderPlaceholders(header, visualEntries)}</div>`
    : "";
  const subject = renderPlaceholders(template.subject, subjectEntries, { escape: false })
    .replace(/[\r\n]+/g, " ")
    .trim();

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;">
  <div dir="${language === "ar" ? "rtl" : "ltr"}" style="font-family:'Segoe UI',Arial,sans-serif;background:#f6f8fa;padding:20px;">
    <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      ${headerHtml}
      <div style="padding:24px 28px 28px;">
        ${body}
        ${paymentAppend}
      </div>
    </div>
  </div>
</body></html>`;

  return { subject, html };
}
