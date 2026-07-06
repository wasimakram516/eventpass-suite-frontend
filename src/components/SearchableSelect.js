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
  FormHelperText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const DEFAULT_SEARCH_THRESHOLD = 5;

/**
 * Drop-in replacement for a plain MUI <Select> over a flat list of options.
 * Once options exceed `searchThreshold`, a sticky search box (same pattern as
 * CountryPicker) appears inside the menu. Long option labels wrap within the
 * menu instead of forcing the popover wide; the closed field always shows a
 * single-line, start-aligned, ellipsis-truncated value.
 */
export default function SearchableSelect({
  name,
  label,
  value,
  onChange,
  options = [],
  required = false,
  error = false,
  helperText,
  disabled = false,
  lang = "en",
  dir = "ltr",
  searchThreshold = DEFAULT_SEARCH_THRESHOLD,
  fullWidth = true,
  size,
  sx,
}) {
  const [search, setSearch] = useState("");

  const normalized = useMemo(
    () =>
      options.map((opt) =>
        opt != null && typeof opt === "object"
          ? { value: opt.value, label: String(opt.label ?? opt.value) }
          : { value: opt, label: String(opt) }
      ),
    [options]
  );

  const showSearch = normalized.length > searchThreshold;
  const q = search.toLowerCase().trim();
  const hasNoMatch = !!q && !normalized.some((opt) => opt.label.toLowerCase().includes(q));
  const selected = normalized.find((opt) => opt.value === value);

  return (
    <FormControl
      fullWidth={fullWidth}
      required={required}
      error={error}
      disabled={disabled}
      dir={dir}
      size={size}
      sx={sx}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        value={value ?? ""}
        label={label}
        onChange={onChange}
        onClose={() => setSearch("")}
        renderValue={(val) => {
          if (val === "" || val == null) return null;
          return (
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "start" }}>
              {selected?.label ?? val}
            </Box>
          );
        }}
        sx={{
          "& .MuiSelect-select": { textAlign: "start", display: "flex", justifyContent: "flex-start" },
        }}
        MenuProps={{ autoFocus: false }}
        slotProps={{ paper: { sx: { maxHeight: 320 } } }}
      >
        {showSearch && (
          <ListSubheader sx={{ bgcolor: "background.paper", pt: 1, pb: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={lang === "ar" ? "بحث…" : "Search…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
              slotProps={{
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
        )}

        {hasNoMatch && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {lang === "ar" ? "لا توجد نتائج" : "No results found"}
            </Typography>
          </MenuItem>
        )}

        {normalized.map((opt) => {
          const matches = !q || opt.label.toLowerCase().includes(q);
          return (
            <MenuItem
              key={opt.value}
              value={opt.value}
              style={{ display: showSearch ? (matches ? "flex" : "none") : "flex" }}
              sx={{ "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" } }}
            >
              {/* Menu Paper width follows the anchor field (MUI sets an inline
                  minWidth that beats any CSS maxWidth on the Paper), so long
                  labels are capped here at the content level to force a wrap
                  instead of stretching the row. */}
              <Box sx={{ maxWidth: 340, whiteSpace: "normal", wordBreak: "break-word" }}>
                {opt.label}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {helperText && (
        <FormHelperText sx={{ textAlign: "start", ml: 1.5 }}>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
