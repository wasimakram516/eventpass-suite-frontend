"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

/**
 * An event modal option that switches on a tab of its own (Custom Email,
 * Custom WhatsApp Messages): a checkbox, plus a hint pointing to that tab
 * while it is on.
 *
 * @param {object} props
 * @param {boolean} props.checked
 * @param {(checked: boolean) => void} props.onChange
 * @param {string} props.label
 * @param {string} [props.hint] - Shown under the checkbox while it is checked
 * @returns {JSX.Element}
 */
export default function TabOptionCheckbox({ checked, onChange, label, hint }) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox checked={!!checked} onChange={(e) => onChange(e.target.checked)} color="primary" />
          }
          label={label}
          sx={{ alignSelf: "start" }}
        />
      </Box>

      {checked && hint && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          {hint}
        </Typography>
      )}
    </>
  );
}
