"use client";

import { useState } from "react";
import {
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";

/**
 * Shared ticket choice control for public Checkout and CMS registrations.
 * It deliberately owns only the presentation/search behavior; each caller
 * owns its registration-specific state changes when a ticket is selected.
 */
export default function TicketTypeSelector({
  ticketTypes = [],
  value = "",
  onChange,
  label,
  searchPlaceholder,
  soldOutLabel,
  availableLabel,
  currency = "OMR",
  error = false,
  helperText,
  disabled = false,
  dir = "ltr",
}) {
  const selectedTicket = ticketTypes.find((ticket) => String(ticket._id) === String(value));
  const [search, setSearch] = useState("");
  const showSearch = ticketTypes.length > 5;
  const normalizedSearch = search.trim().toLowerCase();

  return (
    <FormControl fullWidth size="small" error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onClose={() => setSearch("")}
        inputProps={{ dir }}
        sx={{
          textAlign: "start",
          "& .MuiSelect-icon": {
            right: dir === "rtl" ? "unset" : undefined,
            left: dir === "rtl" ? 7 : "unset",
          },
          "& .MuiSelect-select": {
            display: "flex",
            justifyContent: "flex-start",
            ...(dir === "rtl"
              ? { paddingRight: "14px !important", paddingLeft: "32px !important" }
              : {}),
          },
        }}
        MenuProps={{ autoFocus: false }}
        slotProps={{ paper: { sx: { maxHeight: 360 } } }}
        renderValue={() => {
          if (!selectedTicket) return "";
          return (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, width: "100%" }}>
              <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedTicket.name}
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                {selectedTicket.price} {currency}
              </Typography>
            </Box>
          );
        }}
      >
        {showSearch && (
          <ListSubheader sx={{ bgcolor: "background.paper", pt: 1, pb: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <ICONS.search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </ListSubheader>
        )}
        {ticketTypes.map((ticket) => {
          const isSoldOut = ticket.capacity !== null && ticket.sold >= ticket.capacity;
          const remaining = ticket.capacity !== null ? ticket.capacity - (ticket.sold || 0) : null;
          const isLowStock = remaining !== null && remaining > 0 && remaining <= 20;
          const matches = !normalizedSearch || ticket.name.toLowerCase().includes(normalizedSearch);

          return (
            <MenuItem
              key={ticket._id}
              value={ticket._id}
              disabled={isSoldOut}
              sx={{
                display: showSearch && !matches ? "none" : "flex",
                "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2, py: 0.5 }}>
                <Box sx={{ minWidth: 0, maxWidth: 320 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                    {ticket.name}
                  </Typography>
                  {ticket.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3, whiteSpace: "normal", wordBreak: "break-word" }}>
                      {ticket.description}
                    </Typography>
                  )}
                  {(isSoldOut || remaining !== null) && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: isSoldOut ? "error.main" : isLowStock ? "warning.main" : "text.secondary",
                        fontWeight: isSoldOut || isLowStock ? 600 : 400,
                      }}
                    >
                      {isSoldOut ? soldOutLabel : `${remaining} ${availableLabel}`}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" fontWeight={700} color={isSoldOut ? "text.disabled" : "primary.main"} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                  {isSoldOut ? "—" : `${ticket.price} ${currency}`}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
