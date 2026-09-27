"use client";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import { PER_PAGE_OPTIONS } from "@/utils/gameResultsUtils";

// Shared toolbar for results/sessions list pages: "Showing X–Y of Z" on the
// left, a centered search box, and a right-aligned "Records per page" select.
// Responsive: below `md` the three collapse into stacked full-width rows with
// the record text centered. `getPageCountOptions` lets pages override the
// select choices; `dir` drives RTL search-icon spacing.
export default function ResultsToolbar({
  dir,
  showing,
  searchTerm,
  onSearchChange,
  perPage,
  onPerPageChange,
  perPageLabel,
  searchPlaceholder,
  pageCountOptions = PER_PAGE_OPTIONS,
  renderCount = (n) => n,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        gap: 2,
        mt: { xs: 1, md: 2 },
        mb: 3,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", textAlign: { xs: "center", md: "left" }, width: { xs: "100%", md: "auto" } }}
      >
        {showing}
      </Typography>

      <TextField
        size="small"
        variant="outlined"
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: 1, minWidth: { xs: "100%", md: 240 }, maxWidth: { md: 420 } }}
        slotProps={{
          input: {
            startAdornment: (
              <ICONS.search
                fontSize="small"
                sx={{ mr: dir === "rtl" ? 0 : 1, ml: dir === "rtl" ? 1 : 0, opacity: 0.6 }}
              />
            ),
            sx: dir === "rtl" ? { paddingRight: 2 } : {},
          },
        }}
      />

      <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 150 } }}>
          <InputLabel>{perPageLabel}</InputLabel>
          <Select
            value={perPage}
            label={perPageLabel}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
          >
            {pageCountOptions.map((n) => (
              <MenuItem key={n} value={n}>
                {renderCount(n)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}