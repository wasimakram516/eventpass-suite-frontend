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
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { createRegistration } from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";
import { translateTexts } from "@/services/translationService";
import Background from "@/components/Background";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function Registration() {
  const { eventSlug, lang } = useParams();
  const isArabic = lang === "ar";
  const router = useRouter();
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    registerForEvent: isArabic
      ? "التسجيل في الفعالية"
      : "Register for the Event",
    fullName: isArabic ? "الاسم الكامل" : "Full Name",
    phone: isArabic ? "رقم الهاتف" : "Phone Number",
    email: isArabic ? "البريد الإلكتروني" : "Email",
    company: isArabic ? "الشركة (اختياري)" : "Company (optional)",
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
    yourToken: isArabic ? "رمزك" : "Your Token",
    saveQr: isArabic ? "حفظ رمز QR" : "Save QR Code",
    registerAnother: isArabic
      ? "إغلاق وإجراء تسجيل آخر"
      : "Close and Make Another Registration",
    thankYouForRegistering: isArabic
      ? "شكرًا لتسجيلك."
      : "Thank you for registering.",
    downloadQr: isArabic ? "تحميل رمز الاستجابة السريعة" : "Download QR Code",
    approvalPendingMessage: isArabic
      ? "يرجى الانتظار حتى يوافق المسؤول على تسجيلك."
      : "Please wait for the admin to approve your registration.",
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
  const [qrToken, setQrToken] = useState(null);

  // Fetch event + translate event metadata
  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getPublicEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug, lang]);

  // Prepare dynamic fields + batch translation for event & form fields
  useEffect(() => {
    if (!event) return;

    const defaultFields = [
      { name: "fullName", label: "Full Name", type: "text", required: true },
      { name: "phone", label: "Phone Number", type: "text", required: false },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: false },
    ];

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
      : defaultFields;

    // initialize form
    const initial = {};
    fields.forEach((f) => (initial[f.name] = ""));
    setDynamicFields(fields);
    setFormData(initial);

    const translateAll = async () => {
      const textsToTranslate = new Set();

      // Event-level fields
      if (event.name) textsToTranslate.add(event.name);
      if (event.venue) textsToTranslate.add(event.venue);
      if (event.description) textsToTranslate.add(event.description);

      // Form fields: labels, options, placeholders
      fields.forEach((f) => {
        if (f.label) textsToTranslate.add(f.label);
        if (f.placeholder) textsToTranslate.add(f.placeholder);
        (f.options || []).forEach((o) => textsToTranslate.add(o));
      });

      // ✅ Convert Set → Array first, then filter
      const textArray = Array.from(textsToTranslate).filter(
        (t) => typeof t === "string" && t.trim() !== ""
      );

      if (!textArray.length) {
        setTranslatedEvent(event);
        setTranslationsReady(true);
        return;
      }

      try {
        const results = await translateTexts(textArray, lang);
        const map = {};
        textArray.forEach((txt, i) => (map[txt] = results[i] || txt));

        const translatedEvent = {
          ...event,
          name: map[event.name] || event.name,
          venue: map[event.venue] || event.venue,
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
        console.error("⚠️ Translation error:", err);
        setTranslatedEvent(event);
      } finally {
        setTranslationsReady(true);
      }
    };

    setTranslationsReady(false);
    translateAll();
  }, [event, lang]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    const errors = {};
    dynamicFields.forEach((f) => {
      const val = formData[f.name]?.trim();
      if (f.required && !val) errors[f.name] = `${f.label} ${t.required}`;
      if (
        (f.type === "email" || f.name === "email") &&
        val &&
        !isValidEmail(val)
      )
        errors[f.name] = t.invalidEmail;
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
      if (event?.showQrAfterRegistration) setQrToken(result.token);
    } else {
      setFieldErrors({ _global: result.message || t.registrationFailed });
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/${lang}/event/${eventSlug}`);
  };

  // image background only (no videos on registration page)
  const getImageBackground = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = lang === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    if (bg && typeof bg === 'object' && bg.url && bg.fileType === "image") {
      return bg.url;
    }

    const otherLangKey = lang === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (otherBg && typeof otherBg === 'object' && otherBg.url && otherBg.fileType === "image") {
      return otherBg.url;
    }

    if (event.backgroundUrl) {
      return event.backgroundUrl;
    }

    return null;
  }, [event, lang]);

  const imageBackgroundUrl = getImageBackground;

  // Loading
  if (loading || !event || !translatedEvent || !translationsReady) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Background />
        <CircularProgress />
      </Box>
    );
  }

  // Render fields
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
      {!imageBackgroundUrl && <Background />}

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
          {/* Close IconButton */}
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

          {/* Approval message (does NOT block QR anymore) */}
          {event?.requiresApproval && (
            <Box
              sx={{
                backgroundColor: "#fff3e0",
                borderLeft: dir === "rtl" ? "none" : "4px solid #ff6f00",
                borderRight: dir === "rtl" ? "4px solid #ff6f00" : "none",
                borderRadius: 1,
                p: 2,
                mb: 3,
                textAlign: dir === "rtl" ? "right" : "left",
                mx: "auto",
                width: "fit-content",
                maxWidth: "100%",
              }}
            >
              <Typography variant="body1">
                {t.approvalPendingMessage}
              </Typography>
            </Box>
          )}

          {/* Show QR ONLY if event.showQrAfterRegistration is true */}
          {event?.showQrAfterRegistration && qrToken && (
            <>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                {t.yourToken}
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    backgroundColor: "primary.main",
                    color: "#fff",
                    borderRadius: "20px",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    fontSize: 16,
                  }}
                >
                  {qrToken}
                </Box>
              </Box>

              {/* QR canvas */}
              <Box mt={2} display="flex" justifyContent="center">
                <Paper
                  id="qr-container"
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    display: "inline-block",
                  }}
                >
                  <QRCodeCanvas
                    id="qr-code"
                    value={qrToken}
                    size={180}
                    bgColor="#ffffff"
                    includeMargin
                    style={{
                      padding: "12px",
                      background: "#ffffff",
                      borderRadius: "8px",
                    }}
                  />
                </Paper>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          {/* Download QR button (only when QR is shown) */}
          {event?.showQrAfterRegistration && qrToken && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const canvas = document.getElementById("qr-code");
                const pngUrl = canvas
                  .toDataURL("image/png")
                  .replace("image/png", "image/octet-stream");

                const link = document.createElement("a");
                link.href = pngUrl;
                link.download = `qr-${qrToken}.png`;
                link.click();
              }}
            >
              {t.downloadQr}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
