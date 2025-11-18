"use client";
import React, { useState, useEffect, useMemo } from "react";
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

  const hasCustomFields = useMemo(() => formFields && formFields.length > 0, [formFields]);
  const classicFields = useMemo(
    () => [
      { inputName: "Full Name", inputType: "text" },
      { inputName: "Email", inputType: "email" },
      { inputName: "Phone", inputType: "text" },
      { inputName: "Company", inputType: "text" },
    ],
    []
  );
  const fieldsToRender = useMemo(
    () => (hasCustomFields ? formFields : classicFields),
    [hasCustomFields, formFields, classicFields]
  );

  useEffect(() => {
    if (registration && fieldsToRender.length > 0) {
      const init = {};
      fieldsToRender.forEach((f) => {
        if (hasCustomFields) {
          init[f.inputName] =
            registration.customFields?.[f.inputName] ||
            registration[f.inputName] ||
            "";
        } else {
          const fieldMap = {
            "Full Name": registration.fullName,
            Email: registration.email,
            Phone: registration.phone,
            Company: registration.company,
          };
          init[f.inputName] = fieldMap[f.inputName] || "";
        }
      });
      setValues(init);
    }
  }, [registration, fieldsToRender, hasCustomFields]);

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => onSave(values);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Registration</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {fieldsToRender.map((f) => {
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
                type={f.inputType === "number" ? "number" : f.inputType === "email" ? "email" : "text"}
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
