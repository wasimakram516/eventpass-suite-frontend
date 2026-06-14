// Badge size / orientation helpers.
// The badge size config is persisted inside `customizations._badgeSize`,
// reusing the existing reserved-key pattern (like `_qrCode`), so no backend
// schema change is required (Event.customizations is a Mixed field).

// Reserved keys inside the customizations object that are NOT badge fields.
export const RESERVED_CUSTOMIZATION_KEYS = ["_qrCode", "_badgeSize"];

// Conversion factor from PDF points to CSS pixels.
export const PT_TO_PX = 96 / 72;

// Preset sizes expressed in PDF points (72pt = 1 inch), authored as portrait.
export const BADGE_SIZE_PRESETS = [
  { id: "a6", label: 'A6 Badge (Default)', widthPt: 297.6, heightPt: 419.5 },
  { id: "label_4x3", label: 'Label 4" × 3"', widthPt: 288, heightPt: 216 },
  { id: "label_2x1", label: 'Label 2" × 1"', widthPt: 144, heightPt: 72 },
  { id: "custom", label: "Custom Size", widthPt: null, heightPt: null },
];

export const UNIT_OPTIONS = [
  { id: "mm", label: "mm" },
  { id: "cm", label: "cm" },
  { id: "in", label: "in" },
  { id: "px", label: "px" },
];

export const ORIENTATION_OPTIONS = [
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
  { id: "inverted_portrait", label: "Inverted Portrait" },
  { id: "inverted_landscape", label: "Inverted Landscape" },
];

export const DEFAULT_BADGE_SIZE = {
  preset: "a6",
  width: 0,
  height: 0,
  unit: "px",
  orientation: "portrait",
};

// Convert a value expressed in the given unit to PDF points.
export function unitToPoints(value, unit) {
  const num = parseFloat(value);
  if (!num || num <= 0) return 0;
  switch (unit) {
    case "in":
      return num * 72;
    case "mm":
      return (num * 72) / 25.4;
    case "cm":
      return (num * 72) / 2.54;
    case "px":
    default:
      return num * (72 / 96);
  }
}

// Resolve a stored badge size config into renderable dimensions.
// Returns { widthPt, heightPt, rotated180 } where width/height already
// account for orientation (landscape swaps W/H) and rotated180 indicates
// the content should be rendered upside-down for "inverted" orientations.
export function resolveBadgeDimensions(badgeSize) {
  const cfg = { ...DEFAULT_BADGE_SIZE, ...(badgeSize || {}) };

  let baseWidthPt;
  let baseHeightPt;

  if (cfg.preset === "custom") {
    baseWidthPt = unitToPoints(cfg.width, cfg.unit);
    baseHeightPt = unitToPoints(cfg.height, cfg.unit);
  } else {
    const preset =
      BADGE_SIZE_PRESETS.find((p) => p.id === cfg.preset) ||
      BADGE_SIZE_PRESETS[0];
    baseWidthPt = preset.widthPt;
    baseHeightPt = preset.heightPt;
  }

  // Fall back to A6 if custom dimensions are missing/invalid.
  if (!baseWidthPt || !baseHeightPt) {
    baseWidthPt = BADGE_SIZE_PRESETS[0].widthPt;
    baseHeightPt = BADGE_SIZE_PRESETS[0].heightPt;
  }

  const isLandscape =
    cfg.orientation === "landscape" ||
    cfg.orientation === "inverted_landscape";
  const rotated180 =
    cfg.orientation === "inverted_portrait" ||
    cfg.orientation === "inverted_landscape";

  return {
    widthPt: isLandscape ? baseHeightPt : baseWidthPt,
    heightPt: isLandscape ? baseWidthPt : baseHeightPt,
    rotated180,
  };
}
