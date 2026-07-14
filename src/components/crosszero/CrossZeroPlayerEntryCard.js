"use client";

import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function CrossZeroPlayerEntryCard({
  dir,
  align,
  title,
  subtitle,
  badge,
  nameLabel,
  companyLabel,
  departmentLabel,
  buttonLabel,
  form,
  submitting,
  error,
  onChange,
  onSubmit,
}) {
  return (
    <Paper
      dir={dir}
      elevation={6}
      sx={{
        p: { xs: 3, sm: 4 },
        width: "100%",
        maxWidth: 500,
        textAlign: align,
        backdropFilter: "blur(10px)",
        borderRadius: 6,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.92),
        border: "1px solid",
        borderColor: "divider",
        boxShadow: (theme) => theme.palette.shadow.paper,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "primary.main",
          mb: 1,
          textAlign: "center"
        }}>
        {title}
      </Typography>
      {badge ? <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>{badge}</Box> : null}
      <Typography
        sx={{
          color: "text.secondary",
          mb: 3,
          textAlign: "center",
          fontSize: "0.9rem",
        }}
      >
        {subtitle}
      </Typography>
      <TextField
        label={nameLabel}
        fullWidth
        required
        sx={{ mb: 3 }}
        value={form.name}
        onChange={(event) => onChange({ ...form, name: event.target.value })}
        onKeyDown={(event) => event.key === "Enter" && onSubmit()}
        slotProps={{
          input: { sx: { backgroundColor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.32 : 0.6), color: "text.primary", "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" } } },
          inputLabel: { sx: { color: "text.secondary" } },
        }}
      />
      <TextField
        label={companyLabel}
        fullWidth
        sx={{ mb: 3 }}
        value={form.company}
        onChange={(event) => onChange({ ...form, company: event.target.value })}
        slotProps={{
          input: { sx: { backgroundColor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.32 : 0.6), color: "text.primary", "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" } } },
          inputLabel: { sx: { color: "text.secondary" } },
        }}
      />
      <TextField
        label={departmentLabel}
        fullWidth
        sx={{ mb: 3 }}
        value={form.department}
        onChange={(event) => onChange({ ...form, department: event.target.value })}
        slotProps={{
          input: { sx: { backgroundColor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.32 : 0.6), color: "text.primary", "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" } } },
          inputLabel: { sx: { color: "text.secondary" } },
        }}
      />
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={onSubmit}
        disabled={submitting || !form.name.trim()}
        startIcon={
          submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <ICONS.next />
          )
        }
        sx={getStartIconSpacing(dir)}
      >
        {buttonLabel}
      </Button>
      {error ? (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 2, display: "block", textAlign: "center" }}
        >
          {error}
        </Typography>
      ) : null}
    </Paper>
  );
}
