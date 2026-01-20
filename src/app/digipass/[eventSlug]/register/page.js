"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  IconButton,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { createDigipassRegistration } from "@/services/digipass/digipassRegistrationService";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import { translateTexts } from "@/services/translationService";
import Background from "@/components/Background";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import { normalizePhone } from "@/utils/phoneUtils";
import { DEFAULT_COUNTRY_CODE, DEFAULT_ISO_CODE, COUNTRY_CODES, getCountryCodeByIsoCode } from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DigiPassRegistration() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    registerForEvent: isArabic
      ? "التسجيل في الفعالية"
      : "Register for the Event",
    submit: isArabic ? "إرسال" : "Submit",
    registrationSuccess: isArabic
      ? "تم التسجيل بنجاح!"
      : "Registration Successful!",
    thankYou: isArabic
      ? "شكراً لتسجيلك. نتطلع لرؤيتك!"
      : "Thank you for registering. We look forward to seeing you!",
    viewEvent: isArabic ? "عرض الفعالية" : "View Event",
    required: isArabic ? "مطلوب" : "is required",
    invalidEmail: isArabic
      ? "عنوان البريد الإلكتروني غير صالح"
      : "Invalid email address",
    registrationFailed: isArabic ? "فشل التسجيل." : "Failed to register.",
    thankYouForRegistering: isArabic
      ? "شكرًا لتسجيلك."
      : "Thank you for registering.",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [translations, setTranslations] = useState({});
  const [translationsReady, setTranslationsReady] = useState(false);
  const [translatedEvent, setTranslatedEvent] = useState(null);
  const [countryIsoCodes, setCountryIsoCodes] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getDigipassEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug, language]);

  useEffect(() => {
    if (!event) return;

    const fields = event.formFields?.length
      ? event.formFields
        .filter((f) => f.visible !== false)
        .map((f) => ({
          name: f.inputName,
          label: f.inputName,
          type: f.inputType,
          options: f.values || [],
          required: f.required,
          placeholder: f.placeholder || "",
        }))
      : [];

    const initial = {};
    const initialCountryIsoCodes = {};
    fields.forEach((f) => {
      if (f.name) {
        initial[f.name] = "";
      }
      if (f.type === "phone") {
        initialCountryIsoCodes[f.name] = DEFAULT_ISO_CODE;
      }
    });
    setDynamicFields(fields);
    setFormData(initial);
    setCountryIsoCodes(initialCountryIsoCodes);

    const translateAll = async () => {
      const textsToTranslate = new Set();

      if (event.name) textsToTranslate.add(event.name);
      if (event.description) textsToTranslate.add(event.description);

      fields.forEach((f) => {
        if (f.label) textsToTranslate.add(f.label);
        if (f.placeholder) textsToTranslate.add(f.placeholder);
        (f.options || []).forEach((o) => textsToTranslate.add(o));
      });

      const textArray = Array.from(textsToTranslate).filter(
        (t) => typeof t === "string" && t.trim() !== ""
      );

      if (!textArray.length) {
        setTranslatedEvent(event);
        setTranslationsReady(true);
        return;
      }

      try {
        const results = await translateTexts(textArray, language);
        const map = {};
        textArray.forEach((txt, i) => (map[txt] = results[i] || txt));

        const translatedEvent = {
          ...event,
          name: map[event.name] || event.name,
          description: map[event.description] || event.description,
          formFields:
            event.formFields?.map((f) => ({
              ...f,
              inputName: map[f.inputName] || f.inputName,
              values: f.values?.map((v) => map[v] || v) || f.values,
              placeholder: map[f.placeholder] || f.placeholder,
            })) || event.formFields,
        };

        const translationMap = {};
        fields.forEach((f) => {
          translationMap[f.label] = map[f.label] || f.label;
          (f.options || []).forEach((o) => {
            translationMap[o] = map[o] || o;
          });
        });

        setTranslations(translationMap);
        setTranslatedEvent(translatedEvent);
      } catch (err) {
        console.error("Translation error:", err);
        setTranslatedEvent(event);
      } finally {
        setTranslationsReady(true);
      }
    };

    setTranslationsReady(false);
    translateAll();
  }, [event, language]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleCountryCodeChange = (fieldName, isoCode) => {
    setCountryIsoCodes((p) => ({ ...p, [fieldName]: isoCode }));
  };

  const handlePhoneChange = (fieldName, value) => {
    const digitsOnly = value.replace(/\D/g, "");
    setFormData((p) => ({ ...p, [fieldName]: digitsOnly }));
    setFieldErrors((p) => ({ ...p, [fieldName]: "" }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    const errors = {};
    dynamicFields.forEach((f) => {
      if (!f || !f.name) return;
      const val = formData[f.name]?.trim();
      if (f.required && !val) errors[f.name] = `${f.label} ${t.required}`;
      if (f.type === "email" && val && !isValidEmail(val))
        errors[f.name] = t.invalidEmail;

      if (f.type === "phone" && val) {
        const isoCode = countryIsoCodes[f.name] || DEFAULT_ISO_CODE;
        const phoneError = validatePhoneNumber(val, isoCode);
        if (phoneError) {
          errors[f.name] = phoneError;
        }
      }
    });

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    const normalizedFormData = { ...formData };

    dynamicFields.forEach((f) => {
      if (f.type === "phone") {
        const phoneValue = normalizedFormData[f.name];
        if (phoneValue) {
          const isoCode = countryIsoCodes[f.name] || DEFAULT_ISO_CODE;
          const country = getCountryCodeByIsoCode(isoCode);
          const countryCode = country?.code || DEFAULT_COUNTRY_CODE;
          const fullPhone = phoneValue.startsWith("+")
            ? phoneValue
            : `${countryCode}${phoneValue}`;
          const normalized = normalizePhone(fullPhone);

          if (normalized && normalized.startsWith("+")) {
            const extracted = normalized.substring(countryCode.length).trim();
            normalizedFormData[f.name] = extracted;
          } else {
            normalizedFormData[f.name] = normalized;
          }
        }
      }
    });

    const result = await createDigipassRegistration({
      ...normalizedFormData,
      slug: eventSlug,
    });
    setSubmitting(false);

    if (!result?.error) {
      setShowDialog(true);
    } else {
      setFieldErrors({ _global: result.message || t.registrationFailed });
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/digipass/${eventSlug}/signin`);
  };

  const getImageBackground = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = language === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    if (bg && typeof bg === 'object' && bg.url && bg.fileType === "image") {
      return bg.url;
    }

    const otherLangKey = language === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (otherBg && typeof otherBg === 'object' && otherBg.url && otherBg.fileType === "image") {
      return otherBg.url;
    }

    return null;
  }, [event, language]);

  const imageBackgroundUrl = getImageBackground;

  if (loading || !event || !translatedEvent || !translationsReady) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Background type="dynamic" />
        <CircularProgress />
      </Box>
    );
  }

  const renderField = (field) => {
    const errorMsg = fieldErrors[field.name];
    const fieldLabel = translations[field.label] || field.label;

    const commonProps = {
      fullWidth: true,
      name: field.name,
      label: fieldLabel,
      value: formData[field.name] || "",
      onChange: handleInputChange,
      error: !!errorMsg,
      helperText: errorMsg || "",
      required: field.required,
      sx: { mb: 2 },
    };

    if (field.type === "radio")
      return (
        <Box key={field.name} sx={{ mb: 2, textAlign: "center" }}>
          <Typography sx={{ mb: 1 }}>
            {fieldLabel}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </Typography>
          <RadioGroup
            row
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            sx={{ justifyContent: "center", gap: 2 }}
          >
            {field.options.map((opt) => (
              <FormControlLabel
                key={`${field.name}-${opt}`}
                value={opt}
                control={<Radio sx={{ p: 0.5 }} />}
                label={translations[opt] || opt}
              />
            ))}
          </RadioGroup>
          {errorMsg && (
            <Typography variant="caption" color="error">
              {errorMsg}
            </Typography>
          )}
        </Box>
      );

    if (field.type === "list")
      return (
        <FormControl
          fullWidth
          key={field.name}
          sx={{ mb: 2 }}
          required={field.required}
        >
          <InputLabel>{fieldLabel}</InputLabel>
          <Select
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            label={fieldLabel}
          >
            {field.options.map((opt) => (
              <MenuItem key={`${field.name}-${opt}`} value={opt}>
                {translations[opt] || opt}
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

    if (field.type === "number") {
      return (
        <TextField
          key={field.name}
          {...commonProps}
          type="number"
        />
      );
    }

    if (field.type === "phone") {
      const isoCode = countryIsoCodes[field.name] || DEFAULT_ISO_CODE;
      const phoneValue = formData[field.name] || "";

      return (
        <TextField
          key={field.name}
          {...commonProps}
          value={phoneValue}
          onChange={(e) => handlePhoneChange(field.name, e.target.value)}
          InputProps={{
            startAdornment: (
              <CountryCodeSelector
                value={isoCode}
                onChange={(iso) => handleCountryCodeChange(field.name, iso)}
                disabled={false}
                dir={dir}
              />
            ),
          }}
        />
      );
    }

    return (
      <TextField
        key={field.name}
        {...commonProps}
        type={
          field.type === "number"
            ? "number"
            : field.type === "email"
              ? "email"
              : "text"
        }
      />
    );
  };

  const { name, description, logoUrl } = translatedEvent || event;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
        py: 4,
        position: "relative",
        overflow: "hidden",
      }}
      dir={dir}
    >
      {/* Image Background */}
      {imageBackgroundUrl && (
        <Box
          component="img"
          src={imageBackgroundUrl}
          alt="Event background"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
      {!imageBackgroundUrl && <Background type="dynamic" />}

      <LanguageSelector top={20} right={20} />

      {logoUrl && (
        <Box
          sx={{
            width: { xs: "100%", sm: 320, md: 500 },
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
            mt: { xs: 6, sm: 0 },
          }}
        >
          <Box
            component="img"
            src={logoUrl}
            alt={`${name} Logo`}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      <Paper
        dir={dir}
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {name}
        </Typography>
        {description && (
          <Box
            sx={{
              mb: 3,
              color: "text.secondary",
              fontSize: "0.875rem",
              "& h1": { fontSize: "2em", fontWeight: "bold", margin: "0.67em 0" },
              "& h2": { fontSize: "1.5em", fontWeight: "bold", margin: "0.75em 0" },
              "& h3": { fontSize: "1.17em", fontWeight: "bold", margin: "0.83em 0" },
              "& ul, & ol": { margin: "1em 0", paddingLeft: "2.5em" },
              "& ul": { listStyleType: "disc" },
              "& ol": { listStyleType: "decimal" },
              "& li": { margin: "0.5em 0" },
              "& p": { margin: "1em 0" },
              "& strong, & b": { fontWeight: "bold" },
              "& em, & i": { fontStyle: "italic" },
              "& u": { textDecoration: "underline" },
              "& s, & strike": { textDecoration: "line-through" },
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          {t.registerForEvent}
        </Typography>

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
          sx={{ mt: 2 }}
        >
          {submitting ? <CircularProgress size={22} /> : t.submit}
        </Button>
      </Paper>

      {/* Success dialog */}
      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        dir={dir}
      >
        <DialogTitle sx={{ textAlign: "center", position: "relative" }}>
          <IconButton
            onClick={handleDialogClose}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              bgcolor: "error.main",
              color: "#fff",
              boxShadow: 2,
              "&:hover": {
                bgcolor: "error.dark",
              },
            }}
          >
            <ICONS.close sx={{ fontSize: 22 }} />
          </IconButton>

          <Box display="flex" flexDirection="column" alignItems="center">
            <ICONS.checkCircle sx={{ fontSize: 70, color: "#28a745", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold">
              {t.registrationSuccess}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t.thankYouForRegistering}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDialogClose}
          >
            {t.viewEvent}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

