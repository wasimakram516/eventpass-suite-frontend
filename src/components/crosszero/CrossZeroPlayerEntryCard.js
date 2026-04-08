"use client";

import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
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
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 6,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{ color: "primary.main", mb: 1, textAlign: "center" }}
      >
        {title}
      </Typography>

      {badge ? <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>{badge}</Box> : null}

      <Typography
        sx={{
          color: "rgba(15,23,42,0.62)",
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
        InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.75)" } }}
      />

      <TextField
        label={companyLabel}
        fullWidth
        sx={{ mb: 3 }}
        value={form.company}
        onChange={(event) => onChange({ ...form, company: event.target.value })}
        InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.75)" } }}
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
