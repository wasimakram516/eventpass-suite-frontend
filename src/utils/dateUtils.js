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
 * @param {"en" | "ar"} language - Language code to determine locale.
 * @returns {string} - Formatted date and time string.
 */
export const formatDateTimeWithLocale = (dateString) => {
  const date = new Date(dateString);
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
 * Determines the event status (Expired, Current, Upcoming) based on the event date.
 * @param {string} eventDate - The event date to evaluate.
 * @returns {string} - Status of the event.
 */
export const getEventStatus = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDateObj = new Date(eventDate);
  eventDateObj.setHours(0, 0, 0, 0);

  if (eventDateObj < today) {
    return "Expired";
  } else if (eventDateObj.getTime() === today.getTime()) {
    return "Current";
  } else {
    return "Upcoming";
  }
};
