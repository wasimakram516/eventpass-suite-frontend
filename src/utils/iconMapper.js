import ICONS from "@/utils/iconUtil";

export function getModuleIcon(iconKey) {
  const IconComponent =
    ICONS[iconKey] || ICONS.module || ICONS.info; 
  return <IconComponent />;
}
