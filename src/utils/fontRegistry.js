import registeredFonts from "@/config/fontRegistry.json";

/** Immutable canonical font definitions used by UI and PDF consumers. */
export const FONT_REGISTRY = Object.freeze(registeredFonts);

/** Returns the fonts intentionally exposed in customization selectors. */
export function getSelectableFonts() {
  return FONT_REGISTRY.filter((font) => font.selectable);
}

/** Finds a registered font by its display name or family, ignoring case. */
export function findRegisteredFont(fontName) {
  const key = String(fontName || "").trim().toLowerCase();
  return FONT_REGISTRY.find(
    ({ name, family }) => name.toLowerCase() === key || family.toLowerCase() === key,
  ) || null;
}

/** Resolves persisted font names safely to a registered CSS/PDF family. */
export function getFontFamily(fontName) {
  const font = findRegisteredFont(fontName);
  return font?.family || "Arial";
}

/** Returns a registered binary path for a requested family, weight, and style. */
export function getFontFilePath(family, weight = 400, style = "normal") {
  const font = FONT_REGISTRY.find((entry) => entry.family === family);
  if (!font) return null;

  return font.files.find((file) => file.weight === weight && file.style === style)?.path
    || font.files.find((file) => file.weight === weight)?.path
    || font.files[0]?.path
    || null;
}
