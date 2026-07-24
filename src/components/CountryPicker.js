"use client";

import { useState, useMemo } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  TextField,
  InputAdornment,
  ListSubheader,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { COUNTRY_CODES, getFlagImageUrl, getLocalizedCountryName, normalizeForMatch } from "@/utils/countryCodes";

// Deduplicate by isoCode — COUNTRY_CODES may have entries with the same country listed multiple times
const BASE_COUNTRIES = Object.values(
  Object.fromEntries(COUNTRY_CODES.map((cc) => [cc.isoCode, cc]))
);

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
  const [search, setSearch] = useState("");

  const UNIQUE_COUNTRIES = useMemo(() => {
    return BASE_COUNTRIES
      .map((cc) => ({ ...cc, displayName: getLocalizedCountryName(cc.isoCode, lang) || cc.country }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, lang));
  }, [lang]);

  const selected = UNIQUE_COUNTRIES.find((cc) => cc.isoCode === value?.toLowerCase());
  const q = normalizeForMatch(search.trim());
  const hasNoMatch = !!q && !UNIQUE_COUNTRIES.some(cc =>
    normalizeForMatch(cc.displayName).includes(q) || normalizeForMatch(cc.country).includes(q)
  );

  return (
    <FormControl fullWidth required={required} error={error} disabled={disabled} dir={dir}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={(value || "").toLowerCase()}
        label={label}
        onChange={(e) => onChange?.(e.target.value)}
        onClose={() => setSearch("")}
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
        {/* Sticky search inside the dropdown */}
        <ListSubheader sx={{ bgcolor: "background.paper", pt: 1, pb: 0.5 }}>
          <TextField
            size="small"
            fullWidth
            dir={dir}
            placeholder={lang === "ar" ? "ابحث عن دولة…" : "Search country…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
            slotProps={{
              htmlInput: { dir },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </ListSubheader>

        {hasNoMatch && (
          <MenuItem disabled dir={dir}>
            <Typography variant="body2" color="text.secondary">{lang === "ar" ? "لا توجد دول" : "No countries found"}</Typography>
          </MenuItem>
        )}

        {UNIQUE_COUNTRIES.map((cc) => {
          const matches = !q ||
            normalizeForMatch(cc.displayName).includes(q) ||
            normalizeForMatch(cc.country).includes(q);
          return (
            <MenuItem
              key={cc.isoCode}
              value={cc.isoCode}
              dir={dir}
              style={{ display: matches ? "flex" : "none" }}
              sx={{ "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" } }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <img
                  src={getFlagImageUrl(cc.isoCode)}
                  alt={cc.country}
                  style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2 }}
                />
                <Typography variant="body2">{cc.displayName}</Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mt: 0.5, ml: 1.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
}
