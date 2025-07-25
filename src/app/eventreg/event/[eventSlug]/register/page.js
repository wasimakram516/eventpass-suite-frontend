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
import LanguageSelector from "@/components/LanguageSelector";
import { createRegistration } from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

export default function Registration() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const { t, dir } = useI18nLayout({
    en: {
      registerForEvent: "Register for the Event",
      fullName: "Full Name",
      phone: "Phone Number",
      email: "Email",
      company: "Company (optional)",
      submit: "Submit",
      registrationSuccess: "Registration Successful!",
      thankYou: "Thank you for registering. We look forward to seeing you!",
      viewEvent: "View Event",
      required: "is required",
      invalidEmail: "Invalid email address",
      registrationFailed: "Failed to register.",
      department: "Department",
      position: "Position",
      address: "Address",
      city: "City",
      country: "Country",
      gender: "Gender",
      age: "Age",
      nationality: "Nationality",
      invalidPhone: "Phone number must be 11 digits",
    },
    ar: {
      registerForEvent: "التسجيل في الفعالية",
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف",
      email: "البريد الإلكتروني",
      company: "الشركة (اختياري)",
      submit: "إرسال",
      registrationSuccess: "تم التسجيل بنجاح!",
      thankYou: "شكراً لتسجيلك. نتطلع لرؤيتك!",
      viewEvent: "عرض الفعالية",
      required: "مطلوب",
      invalidEmail: "عنوان البريد الإلكتروني غير صالح",
      registrationFailed: "فشل التسجيل.",
      department: "القسم",
      position: "المنصب",
      address: "العنوان",
      city: "المدينة",
      country: "الدولة",
      gender: "الجنس",
      age: "العمر",
      nationality: "الجنسية",
      invalidPhone: "رقم الهاتف يجب أن يكون 11 رقماً",
    },
  });

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const [dynamicFields, setDynamicFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

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
          { name: "fullName", label: "fullName", type: "text", required: true },
          { name: "phone", label: "phone", type: "text", required: true },
          { name: "email", label: "email", type: "text", required: true },
          { name: "company", label: "company", type: "text", required: false },
        ];

    const initial = {};
    fields.forEach((f) => (initial[f.name] = ""));
    setDynamicFields(fields);
    setFormData(initial);
  }, [event]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      if (!/^[0-9]*$/.test(value)) return;
      if (value.length > 11) return;
    }

    if (name === "fullName" && !/^[a-zA-Z\s]*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    const errors = {};
    dynamicFields.forEach((f) => {
      const val = formData[f.name]?.trim();
      if (f.required && !val) {
        errors[f.name] = `${t[f.label] || f.label} ${t.required}`;
      }
      if (f.name === "email" && val && !isValidEmail(val)) {
        errors[f.name] = t.invalidEmail;
      }
      if (f.name === "phone" && val && val.length !== 11) {
        errors[f.name] = t.invalidPhone;
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
      setFieldErrors({ _global: result.message || t.registrationFailed });
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/eventreg/event/${eventSlug}`);
  };

  if (loading || !event) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  const renderField = (field) => {
    const errorMsg = fieldErrors[field.name];
    const commonProps = {
      fullWidth: true,
      name: field.name,
      label: t[field.label] || field.label,
      value: formData[field.name] || "",
      onChange: handleInputChange,
      error: !!errorMsg,
      helperText: errorMsg || "",
      sx: { mb: 2 },
    };

    if (field.type === "radio") {
      return (
        <Box key={field.name} sx={{ mb: 2, textAlign: "left" }}>
          <Typography
            sx={{ mb: 1, color: errorMsg ? "error.main" : "inherit" }}
          >
            {t[field.label] || field.label}
          </Typography>
          <RadioGroup
            row
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
          >
            {field.options.map((opt) => (
              <FormControlLabel
                key={`${field.name}-${opt}`}
                value={opt}
                control={<Radio />}
                label={t[opt] || opt}
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
        <FormControl
          fullWidth
          key={field.name}
          error={!!errorMsg}
          sx={{ mb: 2 }}
        >
          <InputLabel>{t[field.label] || field.label}</InputLabel>
          <Select
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
          >
            {field.options.map((opt) => (
              <MenuItem key={`${field.name}-${opt}`} value={opt}>
                {t[opt] || opt}
              </MenuItem>
            ))}
          </Select>
          {errorMsg && (
            <Typography variant="caption" color="error">
              {errorMsg}
            </Typography>
          )}
        </FormControl>
      );
    }

    return (
      <TextField
        key={field.name}
        {...commonProps}
        type={field.type === "number" ? "number" : "text"}
      />
    );
  };

  return (
    <Box
      dir={dir}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ICONS.appRegister
            sx={{ fontSize: 40, color: "primary.main", mr: 2 }}
          />
          <Typography variant="h4" fontWeight="bold">
            {t.registerForEvent}
          </Typography>
        </Box>

        {fieldErrors._global && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {fieldErrors._global}
          </Alert>
        )}

        {dynamicFields.map((f) => renderField(f))}

        <Button
          variant="contained"
          fullWidth
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? <CircularProgress size={22} /> : t.submit}
        </Button>
      </Paper>

      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        dir={dir}
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <ICONS.checkCircle sx={{ fontSize: 70, color: "#28a745", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold">
              {t.registrationSuccess}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t.thankYou}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={handleDialogClose} variant="contained">
            {t.viewEvent}
          </Button>
        </DialogActions>
      </Dialog>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
