"use client";

import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: { default: "Default", custom: "Custom", reminder: "Reminder" },
  ar: { default: "افتراضي", custom: "مخصص", reminder: "تذكير" },
};

/**
 * The Default, Custom and (optionally) Reminder choice at the top of a
 * notification modal, laid out for both left to right and right to left.
 * Shared by the bulk and single notification modals.
 *
 * @param {object} props
 * @param {"default"|"custom"|"reminder"} props.value - The selected message type
 * @param {(type: string) => void} props.onChange - Called with the newly selected type
 * @param {boolean} [props.showReminderOption] - Whether to offer Reminder
 * @returns {JSX.Element}
 */
const MessageTypeSelector = ({ value, onChange, showReminderOption = false }) => {
  const { t, dir } = useI18nLayout(translations);
  const isRtl = dir === "rtl";

  const options = [
    { type: "default", label: t.default },
    { type: "custom", label: t.custom },
    ...(showReminderOption ? [{ type: "reminder", label: t.reminder }] : []),
  ];

  // The first option hugs the start edge; the rest are spaced from their neighbour.
  const spacingSx = (isFirst) => ({
    direction: dir,
    marginRight: isRtl ? (isFirst ? 0 : 2) : isFirst ? 2 : 0,
    marginLeft: isRtl ? (isFirst ? 2 : 0) : isFirst ? 0 : 2,
  });

  return (
    <RadioGroup
      value={value}
      onChange={(e) => onChange(e.target.value)}
      row
      sx={{
        flexDirection: isRtl ? "row-reverse" : "row",
        direction: dir,
        marginLeft: isRtl ? "auto" : 0,
        marginRight: isRtl ? 0 : "auto",
        width: "fit-content",
      }}
    >
      {options.map((option, index) => (
        <FormControlLabel
          key={option.type}
          value={option.type}
          control={<Radio color="primary" />}
          label={option.label}
          labelPlacement={isRtl ? "start" : "end"}
          sx={spacingSx(index === 0)}
        />
      ))}
    </RadioGroup>
  );
};

export default MessageTypeSelector;
