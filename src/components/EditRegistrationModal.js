"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
} from "@mui/material";

export default function EditRegistrationModal({
  open,
  onClose,
  registration,
  formFields,
  onSave,
}) {
  const [values, setValues] = useState({});

  useEffect(() => {
    if (registration) {
      const init = {};
      formFields.forEach((f) => {
        init[f.inputName] =
          registration.customFields?.[f.inputName] ||
          registration[f.inputName] ||
          "";
      });
      setValues(init);
    }
  }, [registration, formFields]);

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => onSave(values);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Registration</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {formFields.map((f) => {
            const value = values[f.inputName] ?? "";
            if (["radio", "list"].includes(f.inputType)) {
              return (
                <TextField
                  select
                  key={f.inputName}
                  label={f.inputName}
                  value={value}
                  onChange={(e) => handleChange(f.inputName, e.target.value)}
                  fullWidth
                  size="small"
                >
                  {f.values?.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              );
            }
            return (
              <TextField
                key={f.inputName}
                label={f.inputName}
                value={value}
                onChange={(e) => handleChange(f.inputName, e.target.value)}
                fullWidth
                size="small"
                type={f.inputType === "number" ? "number" : "text"}
              />
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
