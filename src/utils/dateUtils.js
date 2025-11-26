/**
 * Formats a date string to a human-readable format.
 * @param {string} dateString - The date string to format.
 * @returns {string} - Formatted date string.
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

/**
 * Formats a date with time in a locale-aware way, including hour and minute.
 * @param {string} dateString - The date string to format.
 * @param {string} locale - The locale to use (e.g., "en-GB" or "ar-SA"). Defaults to "en-GB".
 * @returns {string} - Formatted date and time string.
 */
export const formatDateTimeWithLocale = (dateString, locale = "en-GB") => {
  const date = new Date(dateString);

  const formatted = date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (locale === "ar-SA") {
    let translatedDate = formatted.replace(
      /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/,
      (match) => monthTranslations[match]
    );

    translatedDate = translatedDate.replace(/\bAM\b/gi, "ص");
    translatedDate = translatedDate.replace(/\bPM\b/gi, "م");

    return translatedDate.replace(/\d/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) + 0x0630)
    );
  }

  return formatted;
};

/**
 * Determines the event status (Expired, Current, Upcoming) based on the event date range.
 * @param {string|Date} startDate - The start date of the event.
 * @param {string|Date} endDate - The end date of the event.
 * @returns {string} - Status of the event.
 */
export const getEventStatus = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today < start) return "Upcoming";
  if (today > end) return "Expired";
  return "Current";
};

/**
 * Formats a date string to a human-readable format with a short month name.
 * @param {string} dateString - The date string to format.
 * @returns {string} - Formatted date string with short month.
 */
const monthTranslations = {
  Jan: "يناير",
  Feb: "فبراير",
  Mar: "مارس",
  Apr: "أبريل",
  May: "مايو",
  Jun: "يونيو",
  Jul: "يوليو",
  Aug: "أغسطس",
  Sep: "سبتمبر",
  Oct: "أكتوبر",
  Nov: "نوفمبر",
  Dec: "ديسمبر"
};

export const formatDateWithShortMonth = (dateString, locale = "en-GB") => {
  const date = new Date(dateString);
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  if (locale === "ar-SA") {
    const translatedDate = formatted.replace(
      /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/,
      (match) => monthTranslations[match]
    );

    // Convert digits to Arabic numerals
    return translatedDate.replace(/\d/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) + 0x0630)
    );
  }

  return formatted;
};
