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

const createDateInTimezone = (dateString, timeString, timezone) => {
  const dateOnly = new Date(dateString).toISOString().split("T")[0];
  const [hours, minutes] = timeString.split(":");

  const dateTimeStr = `${dateOnly}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  let testDate = new Date(dateTimeStr);
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    const parts = formatter.formatToParts(testDate);
    const formattedHour = parts.find(p => p.type === "hour").value;
    const formattedMinute = parts.find(p => p.type === "minute").value;

    const hourDiff = parseInt(hours, 10) - parseInt(formattedHour, 10);
    const minuteDiff = parseInt(minutes, 10) - parseInt(formattedMinute, 10);

    if (hourDiff === 0 && minuteDiff === 0) {
      break;
    }

    testDate = new Date(testDate.getTime() + (hourDiff * 60 + minuteDiff) * 60 * 1000);
    iterations++;
  }

  return testDate;
};

export const formatTime = (timeString, locale = "en-GB", eventTimezone = null, dateString = null) => {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);

  if (eventTimezone && dateString) {
    const eventDate = createDateInTimezone(dateString, timeString, eventTimezone);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formatted = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: userTimezone,
    }).format(eventDate);

    if (locale === "ar-SA") {
      return formatted
        .replace(/\bAM\b/gi, "ص").replace(/\bPM\b/gi, "م")
        .replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0x0630));
    }
    return formatted;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  const formatted = date.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (locale === "ar-SA") {
    return formatted
      .replace(/\bAM\b/gi, "ص").replace(/\bPM\b/gi, "م")
      .replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0x0630));
  }
  return formatted;
};

export const formatDateWithTime = (dateString, timeString, locale = "en-GB", eventTimezone = null) => {
  if (!timeString) {
    return formatDateWithShortMonth(dateString, locale);
  }

  if (eventTimezone) {
    const eventDate = createDateInTimezone(dateString, timeString, eventTimezone);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const timeFormatted = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: userTimezone,
    }).format(eventDate);

    const dateFormattedLocal = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: userTimezone,
    }).format(eventDate);

    let finalDate = dateFormattedLocal;
    let finalTime = timeFormatted;

    if (locale === "ar-SA") {
      finalDate = dateFormattedLocal.replace(
        /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/,
        (match) => monthTranslations[match]
      ).replace(/\d/g, (digit) =>
        String.fromCharCode(digit.charCodeAt(0) + 0x0630)
      );
      finalTime = timeFormatted
        .replace(/\bAM\b/gi, "ص").replace(/\bPM\b/gi, "م")
        .replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0x0630));
    }

    return `${finalDate} ${finalTime}`;
  }

  const dateFormatted = formatDateWithShortMonth(dateString, locale);
  const timeFormatted = formatTime(timeString, locale);
  return `${dateFormatted} ${timeFormatted}`;
};

export const convertTimeToLocal = (timeString, dateString, eventTimezone) => {
  if (!timeString || !eventTimezone) return timeString;

  const eventDate = createDateInTimezone(dateString, timeString, eventTimezone);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(eventDate);
  const hour = parts.find(p => p.type === "hour").value.padStart(2, "0");
  const minute = parts.find(p => p.type === "minute").value.padStart(2, "0");

  return `${hour}:${minute}`;
};

export const convertTimeFromLocal = (timeString, dateString, eventTimezone) => {
  if (!timeString || !eventTimezone) return timeString;

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (userTimezone === eventTimezone) {
    return timeString;
  }

  const [hours, minutes] = timeString.split(":");
  const dateOnly = new Date(dateString).toISOString().split("T")[0];
  const dateTimeStr = `${dateOnly}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
  const localDate = new Date(dateTimeStr);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: eventTimezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  let testDate = localDate;
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    const parts = formatter.formatToParts(testDate);
    const formattedHour = parts.find(p => p.type === "hour").value;
    const formattedMinute = parts.find(p => p.type === "minute").value;

    const hourDiff = parseInt(hours, 10) - parseInt(formattedHour, 10);
    const minuteDiff = parseInt(minutes, 10) - parseInt(formattedMinute, 10);

    if (hourDiff === 0 && minuteDiff === 0) {
      break;
    }

    testDate = new Date(testDate.getTime() + (hourDiff * 60 + minuteDiff) * 60 * 1000);
    iterations++;
  }

  const resultFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: eventTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const resultParts = resultFormatter.formatToParts(testDate);
  const resultHour = resultParts.find(p => p.type === "hour").value.padStart(2, "0");
  const resultMinute = resultParts.find(p => p.type === "minute").value.padStart(2, "0");

  return `${resultHour}:${resultMinute}`;
};