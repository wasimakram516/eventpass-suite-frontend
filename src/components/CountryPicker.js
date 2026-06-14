"use client";

import { useMemo } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import { COUNTRY_CODES, getFlagImageUrl } from "@/utils/countryCodes";

// Deduplicate by isoCode — COUNTRY_CODES may have entries with the same country listed multiple times
const BASE_COUNTRIES = Object.values(
  Object.fromEntries(COUNTRY_CODES.map((cc) => [cc.isoCode, cc]))
);

// Manual Arabic names for codes Intl.DisplayNames doesn't cover
const AR_OVERRIDES = {
  DG: "دييغو غارسيا",
  EH: "الصحراء الغربية",
  AC: "جزيرة أسينشن",
  TA: "تريستان دا كونا",
  BQ: "جزر الكاريبي الهولندية",
  XK: "كوسوفو",
  CP: "جزيرة كليبرتون",
  EA: "سبتة ومليلية",
};

function getDisplayName(isoCode, lang) {
  if (lang === "en") return null;
  const upper = isoCode.toUpperCase();
  if (lang === "ar" && AR_OVERRIDES[upper]) return AR_OVERRIDES[upper];
  try {
    const name = new Intl.DisplayNames([lang], { type: "region" }).of(upper);
    // Intl returns the code itself when no translation exists — treat that as a miss
    if (!name || name.toUpperCase() === upper) return null;
    return name;
  } catch {
    return null;
  }
}

export default function CountryPicker({
  label = "Country",
  value,
  onChange,
  required = false,
  error = false,
  helperText,
  disabled = false,
  lang = "en",
  dir = "ltr",
}) {
  const UNIQUE_COUNTRIES = useMemo(() => {
    return BASE_COUNTRIES
      .map((cc) => ({ ...cc, displayName: getDisplayName(cc.isoCode, lang) || cc.country }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, lang));
  }, [lang]);

  const selected = UNIQUE_COUNTRIES.find((cc) => cc.isoCode === value?.toLowerCase());

  return (
    <FormControl fullWidth required={required} error={error} disabled={disabled} dir={dir}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={(value || "").toLowerCase()}
        label={label}
        onChange={(e) => onChange?.(e.target.value)}
        renderValue={(val) => {
          if (!val) return null;
          return (
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <img
                  src={getFlagImageUrl(selected?.isoCode || val)}
                  alt={selected?.displayName || ""}
                  style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                />
                <Typography variant="body2" noWrap>{selected?.displayName || val}</Typography>
              </Box>
            </Box>
          );
        }}
        sx={{ borderRadius: 30, "&& .MuiSelect-select": { paddingRight: "44px !important" } }}
        MenuProps={{ autoFocus: false }}
        slotProps={{ paper: { sx: { maxHeight: 320 } } }}
      >
        {UNIQUE_COUNTRIES.map((cc) => (
          <MenuItem key={cc.isoCode} value={cc.isoCode}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <img
                src={getFlagImageUrl(cc.isoCode)}
                alt={cc.country}
                style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2 }}
              />
              <Typography variant="body2">{cc.displayName}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mt: 0.5, ml: 1.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
}
