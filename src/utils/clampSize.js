/**
 * Clamp a pixel size to a range, falling back to a default for invalid input.
 * One implementation shared by the email template sizes (QR, logo) and the rich
 * text editor's font size, and the same rule as the backend's size sanitizers.
 *
 * @param {*} value - Candidate size (number or numeric string)
 * @param {{min: number, max: number, fallback: number}} range - Allowed range and the default for invalid input
 * @returns {number} Integer size between min and max, or the fallback for a missing, non numeric or non positive value
 */
export function clampSize(value, { min, max, fallback }) {
  const size = Math.round(Number(value));
  if (!Number.isFinite(size) || size <= 0) return fallback;
  return Math.min(max, Math.max(min, size));
}
