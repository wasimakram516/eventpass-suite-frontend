/**
 * Capitalizes the first letter of a given string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Fills a template string with values.
 * @param {string} template - Template with {key} placeholders.
 * @param {Record<string, string>} values - Values to substitute.
 * @returns {string} - Filled template.
 */
export const fillTemplate = (template, values) =>
  template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? template);
