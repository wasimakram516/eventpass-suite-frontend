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
 * @returns {string} - Formatted date and time string.
 */
export const formatDateTimeWithLocale = (dateString, locale = "en") => {
  const date = new Date(dateString);

  if (locale === "ar") {
    return date.toLocaleString("ar-SA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
export const formatDateWithShortMonth = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
