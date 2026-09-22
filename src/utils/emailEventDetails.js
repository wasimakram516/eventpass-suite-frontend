/**
 * Event details for the live email preview: how they are formatted, sample
 * values for anything the admin has not filled in yet, and readers that take the
 * details from a saved event or from the event modal's form.
 *
 * The formatting mirrors the backend
 * (eventpass-suite-backend/src/utils/emailTemplateBuilder/eventDetails.js).
 * Keep the two in sync.
 */
import { convertTimeFromLocal } from "./dateUtils.js";
import { EMAIL_TEMPLATE_RESERVED } from "./emailTemplatePlaceholders.js";

const R = EMAIL_TEMPLATE_RESERVED;
const DEFAULT_DATE_RANGE_JOINER = " – ";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

const SAMPLE_DETAILS = Object.freeze({
  startTime: "09:00",
  endTime: "17:00",
  venue: "Sample venue",
  description: "<p>Sample event description.</p>",
  organizerName: "Sample Organizer",
  organizerEmail: "organizer@example.com",
  organizerPhone: "+968 2400 0000",
  organizerAddress: "Sample address",
  organizerWebsite: "https://example.com",
  organizerOtherDetails: "Sample notes",
});

/**
 * Turn a form date ("2026-10-05") or a saved date into a Date. A plain form date
 * is read as a local day, so it never slips to the day before in western timezones.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const match = DATE_ONLY_PATTERN.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format one date the way registration emails show it.
 *
 * @param {Date|string|number|null|undefined} value - The date to format
 * @param {"en"|"ar"} language - The email language
 * @returns {string} A long date, or "" when there is none
 */
export function formatEventDate(value, language) {
  const date = toDate(value);
  if (!date) return "";
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return language === "ar"
    ? new Intl.DateTimeFormat("ar-EG", options).format(date)
    : date.toLocaleDateString("en-US", options);
}

/**
 * Format start and end as one text: a single date for a one day event.
 *
 * @param {{startDate?: *, endDate?: *}} info - The event's dates
 * @param {"en"|"ar"} language - The email language
 * @param {string} [joiner] - Text placed between the two dates
 * @returns {string}
 */
export function formatEventDateRange(info, language, joiner = DEFAULT_DATE_RANGE_JOINER) {
  const start = toDate(info.startDate);
  if (!start) return "";
  const end = toDate(info.endDate);
  const startText = formatEventDate(start, language);
  const endText = end && end.getTime() !== start.getTime() ? formatEventDate(end, language) : null;
  return endText ? `${startText}${joiner}${endText}` : startText;
}

/**
 * Format a stored "HH:mm" event time as a 12 hour clock.
 *
 * @param {string|null|undefined} time - "HH:mm"
 * @param {"en"|"ar"} language - The email language
 * @returns {string} e.g. "9:00 AM", or "" for a missing or invalid time
 */
export function formatEventTime(time, language) {
  const match = TIME_PATTERN.exec(time || "");
  if (!match) return "";
  const moment = new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])));
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(moment);
}

/**
 * The event details a preview fills in, with a sample wherever the admin has not
 * entered one yet. Times are only present for CheckIn events, like the event modal.
 *
 * @param {object} params
 * @param {object} [params.eventInfo] - From eventInfoFromEvent or eventInfoFromEventForm
 * @param {boolean} [params.isCheckIn] - Whether the event is a CheckIn event
 * @param {"en"|"ar"} [params.language] - The email language
 * @returns {Array<{name: string, value: string}>} One entry per plain text event detail placeholder
 */
export function getEventDetailSamples({ eventInfo, isCheckIn = false, language = "en" }) {
  const info = eventInfo || {};
  const start = toDate(info.startDate) || new Date();
  const end = toDate(info.endDate) || start;
  const pick = (key) => (info[key] || "").toString().trim() || SAMPLE_DETAILS[key];

  return [
    { name: R.EVENT_DATE, value: formatEventDateRange({ startDate: start, endDate: end }, language) },
    { name: R.START_DATE, value: formatEventDate(start, language) },
    { name: R.END_DATE, value: formatEventDate(end, language) },
    { name: R.START_TIME, value: isCheckIn ? formatEventTime(info.startTime || SAMPLE_DETAILS.startTime, language) : "" },
    { name: R.END_TIME, value: isCheckIn ? formatEventTime(info.endTime || SAMPLE_DETAILS.endTime, language) : "" },
    { name: R.VENUE, value: pick("venue") },
    { name: R.ORGANIZER_NAME, value: pick("organizerName") },
    { name: R.ORGANIZER_EMAIL, value: pick("organizerEmail") },
    { name: R.ORGANIZER_PHONE, value: pick("organizerPhone") },
    { name: R.ORGANIZER_ADDRESS, value: pick("organizerAddress") },
    { name: R.ORGANIZER_WEBSITE, value: pick("organizerWebsite") },
    { name: R.ORGANIZER_OTHER_DETAILS, value: pick("organizerOtherDetails") },
  ];
}

/**
 * The event description as HTML, or a sample until one is written.
 *
 * @param {{description?: string}} [eventInfo]
 * @returns {string}
 */
export function getSampleDescriptionHtml(eventInfo) {
  return (eventInfo?.description || "").trim() || SAMPLE_DETAILS.description;
}

/**
 * Read the details a preview needs from a saved event. Saved times are already
 * in the event's own timezone, which is how emails show them.
 *
 * @param {object|null|undefined} event - Event from the API
 * @returns {object} eventInfo
 */
export function eventInfoFromEvent(event) {
  return {
    startDate: event?.startDate,
    endDate: event?.endDate,
    startTime: event?.startTime,
    endTime: event?.endTime,
    venue: event?.venue,
    description: event?.description,
    organizerName: event?.organizerName,
    organizerEmail: event?.organizerEmail,
    organizerPhone: event?.organizerPhone,
    organizerAddress: event?.organizerAddress,
    organizerWebsite: event?.organizerWebsite,
    organizerOtherDetails: event?.organizerOtherDetails,
  };
}

/**
 * Read the details a preview needs from the event modal's form. The form holds
 * times in the admin's own timezone, so they are converted to the event's
 * timezone the same way saving does, and only for CheckIn, which alone has times.
 *
 * @param {object} formData - Event modal form state
 * @param {boolean} isCheckIn - Whether the event is a CheckIn event
 * @returns {object} eventInfo
 */
export function eventInfoFromEventForm(formData, isCheckIn) {
  const toEventTime = (time, date) =>
    isCheckIn && time ? convertTimeFromLocal(time, date, formData.timezone) : "";

  return {
    startDate: formData.startDate,
    endDate: formData.endDate,
    startTime: toEventTime(formData.startTime, formData.startDate),
    endTime: toEventTime(formData.endTime, formData.endDate || formData.startDate),
    venue: formData.venue,
    description: formData.description,
    organizerName: formData.organizerName,
    organizerEmail: formData.organizerEmail,
    organizerPhone: formData.organizerPhone,
    organizerAddress: formData.organizerAddress,
    organizerWebsite: formData.organizerWebsite,
    organizerOtherDetails: formData.organizerOtherDetails,
  };
}
