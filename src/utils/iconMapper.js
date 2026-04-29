import ICONS from "@/utils/iconUtil";

export function getModuleIcon(iconKey, props = {}) {
  const IconComponent =
    ICONS[iconKey] || ICONS.module || ICONS.info;
  return <IconComponent {...props} />;
}

const FIELD_ICON_MAP = [
  [/^(full[\s_-]?name|name|attendee|participant|voter|first[\s_-]?name|last[\s_-]?name|firstname|lastname)$/, "personOutline"],
  [/^(e[\s_-]?mail|email)$/, "emailOutline"],
  [/^(phone|mobile|tel(ephone)?|cell)$/, "phone"],
  [/^(company|organization|org|employer|business|firm|institution)$/, "apartment"],
  [/^(location|address|city|country|region|state)$/, "location"],
  [/^(date|dob|birthday|birth[\s_-]?date)$/, "eventOutline"],
  [/^(time|duration)$/, "timeOutline"],
];

// Returns a JSX icon element for a known field key, or a generic info icon.
export function getFieldIcon(key, props = { fontSize: "small" }) {
  const normalized = String(key).toLowerCase().trim();
  for (const [pattern, iconKey] of FIELD_ICON_MAP) {
    if (pattern.test(normalized)) {
      const IconComponent = ICONS[iconKey];
      return <IconComponent {...props} />;
    }
  }
  const IconComponent = ICONS.info;
  return <IconComponent {...props} />;
}
