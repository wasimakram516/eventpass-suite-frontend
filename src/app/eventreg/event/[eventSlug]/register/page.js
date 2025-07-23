"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";

import { createRegistration } from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";

export default function Registration() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const [dynamicFields, setDynamicFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getPublicEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug]);

  // Normalize fields & init data
  useEffect(() => {
    if (!event) return;
    const fields = event.formFields?.length
      ? event.formFields.map((f) => ({
          name: f.inputName,
          label: f.inputName,
          type: f.inputType,
          options: f.values || [],
          required: f.required,
        }))
      : [
          { name: "fullName", label: "Full Name", type: "text", required: true },
          { name: "phone", label: "Phone Number", type: "text", required: true },
          { name: "email", label: "Email", type: "text", required: true },
          { name: "company", label: "Company (optional)", type: "text", required: false },
        ];
    const initial = {};
    fields.forEach((f) => (initial[f.name] = ""));
    setDynamicFields(fields);
    setFormData(initial);
  }, [event]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^[+]?[0-9]*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    const errors = {};
    dynamicFields.forEach((f) => {
      const val = formData[f.name]?.trim();
      if (f.required && !val) {
        errors[f.name] = `${f.label} is required`;
      }
      if (f.name === "email" && val && !isValidEmail(val)) {
        errors[f.name] = "Invalid email address";
      }
    });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    const result = await createRegistration({ ...formData, slug: eventSlug });
    setSubmitting(false);

    if (!result?.error) {
      setShowDialog(true);
    } else {
      // show top-level error if needed
      setFieldErrors({ _global: result.message || "Failed to register." });
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/eventreg/event/${eventSlug}`);
  };

  if (loading || !event) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const renderField = (field) => {
    const errorMsg = fieldErrors[field.name];
    const commonProps = {
      fullWidth: true,
      name: field.name,
      label: field.label,
      value: formData[field.name] || "",
      onChange: handleInputChange,
      error: !!errorMsg,
      helperText: errorMsg || "",
      sx: { mb: 2 },
    };

    if (field.type === "radio") {
      return (
        <Box key={field.name} sx={{ mb: 2, textAlign: "left" }}>
          <Typography sx={{ mb: 1, color: errorMsg ? 'error.main' : 'inherit' }}>
            {field.label}
          </Typography>
          <RadioGroup row name={field.name} value={formData[field.name]} onChange={handleInputChange}>
            {field.options.map((opt) => (
              <FormControlLabel
                key={`${field.name}-${opt}`}
                value={opt}
                control={<Radio />}
                label={opt}
              />
            ))}
          </RadioGroup>
          {errorMsg && (
            <Typography variant="caption" color="error" display="block">
              {errorMsg}
            </Typography>
          )}
        </Box>
      );
    }

    if (field.type === "list") {
      return (
        <FormControl fullWidth key={field.name} error={!!errorMsg} sx={{ mb: 2 }}>
          <InputLabel>{field.label}</InputLabel>
          <Select name={field.name} value={formData[field.name]} onChange={handleInputChange}>
            {field.options.map((opt) => (
              <MenuItem key={`${field.name}-${opt}`} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
          {errorMsg && <Typography variant="caption" color="error">{errorMsg}</Typography>}
        </FormControl>
      );
    }

    return <TextField key={field.name} {...commonProps} type={field.type === 'number' ? 'number' : 'text'} />;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', px: 2, py: 4 }}>
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 600, borderRadius: 3, p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ICONS.appRegister sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">Register for the Event</Typography>
        </Box>

        {fieldErrors._global && <Alert severity="error" sx={{ mb: 3 }}>{fieldErrors._global}</Alert>}

        {dynamicFields.map((f) => renderField(f))}

        <Button variant="contained" fullWidth disabled={submitting} onClick={handleSubmit}>
          {submitting ? <CircularProgress size={22} /> : 'Submit'}
        </Button>
      </Paper>

      <Dialog open={showDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <ICONS.checkCircle sx={{ fontSize: 70, color: '#28a745', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold">Registration Successful!</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>Thank you for registering. We look forward to seeing you!</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={handleDialogClose} variant="contained">View Event</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
