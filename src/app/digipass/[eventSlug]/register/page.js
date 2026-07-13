"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Card,
  Alert,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Container,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { createDigipassRegistration } from "@/services/digipass/digipassRegistrationService";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import { translateTexts } from "@/services/translationService";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import { normalizePhone } from "@/utils/phoneUtils";
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_ISO_CODE,
  COUNTRY_CODES,
  getCountryCodeByIsoCode,
} from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { uploadSingleFile } from "@/utils/mediaUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessage } from "@/contexts/MessageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function DigiPassRegistration() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { showMessage } = useMessage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    registerForEvent: isArabic
      ? "التسجيل في الفعالية"
      : "Register for the Event",
    register: isArabic ? "التسجيل" : "Register",
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
  const [dynamicFields, setDynamicFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [translations, setTranslations] = useState({});
  const [translationsReady, setTranslationsReady] = useState(false);
  const [translatedEvent, setTranslatedEvent] = useState(null);
  const [countryIsoCodes, setCountryIsoCodes] = useState({});
  const [fileData, setFileData] = useState({});
  const [isMuted] = useState(true);
  const videoRef = useRef(null);

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

  // Background selection logic (match DigiPass landing)
  const background = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = language === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    const resolveFileType = (url, explicitType) => {
      if (explicitType) return explicitType;
      const urlLower = String(url || "").toLowerCase();
      if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
        return "video";
      }
      return "image";
    };

    if (bg && typeof bg === "object" && bg.url && String(bg.url).trim() !== "") {
      return {
        url: bg.url,
        fileType: resolveFileType(bg.url, bg.fileType),
      };
    }

    const otherLangKey = language === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (
      otherBg &&
      typeof otherBg === "object" &&
      otherBg.url &&
      String(otherBg.url).trim() !== ""
    ) {
      return {
        url: otherBg.url,
        fileType: resolveFileType(otherBg.url, otherBg.fileType),
      };
    }

    if (event.backgroundUrl) {
      return {
        url: event.backgroundUrl,
        fileType: "image",
      };
    }

    return null;
  }, [event, language]);

  // Compute which fields are visible based on parent-dependent relationships
  const visibleFields = useMemo(() => {
    const dependentsOf = {};
    dynamicFields.forEach((f) => {
      if (f.dependents) {
        try {
          const depMap = JSON.parse(f.dependents);
          Object.entries(depMap).forEach(([option, config]) => {
            (config.fieldIds || []).forEach((childName) => {
              if (!dependentsOf[childName]) dependentsOf[childName] = [];
              dependentsOf[childName].push({ parentName: f.name, option });
            });
          });
        } catch { }
      }
    });

    return dynamicFields.filter((f) => {
      const deps = dependentsOf[f.name];
      if (!deps || deps.length === 0) return true;
      return deps.some((d) => formData[d.parentName] === d.option);
    });
  }, [dynamicFields, formData]);

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
          dependents: f.dependents,
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
        (t) => typeof t === "string" && t.trim() !== "",
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
    setFormData((prev) => {
      // Find if this field has dependents and clear their values when option changes
      const parentField = dynamicFields.find((f) => f.name === name);
      if (parentField?.dependents) {
        try {
          const depMap = JSON.parse(parentField.dependents);
          const allChildIds = new Set();
          Object.values(depMap).forEach((config) => {
            (config.fieldIds || []).forEach((id) => allChildIds.add(id));
          });
          if (allChildIds.size > 0) {
            const cleared = {};
            allChildIds.forEach((childName) => {
              if (prev[childName] !== undefined) cleared[childName] = "";
            });
            return { ...prev, [name]: value, ...cleared };
          }
        } catch { }
      }
      return { ...prev, [name]: value };
    });
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

  const handleFileSelect = (fieldName, file) => {
    if (fileData[fieldName]?.preview) {
      URL.revokeObjectURL(fileData[fieldName].preview);
    }
    const preview = URL.createObjectURL(file);
    setFileData((p) => ({ ...p, [fieldName]: { file, preview } }));
    setFormData((p) => ({ ...p, [fieldName]: file.name }));
    setFieldErrors((p) => ({ ...p, [fieldName]: "" }));
  };

  const handleFileRemove = (fieldName) => {
    if (fileData[fieldName]?.preview) {
      URL.revokeObjectURL(fileData[fieldName].preview);
    }
    setFileData((p) => {
      const next = { ...p };
      delete next[fieldName];
      return next;
    });
    setFormData((p) => ({ ...p, [fieldName]: "" }));
  };

  const fileDataRef = useRef(fileData);
  fileDataRef.current = fileData;
  useEffect(() => {
    return () => {
      Object.values(fileDataRef.current).forEach((fd) => {
        if (fd?.preview) URL.revokeObjectURL(fd.preview);
      });
    };
  }, []);

  // Set body background to transparent
  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
    const nextRoot = document.getElementById("__next");
    if (nextRoot) {
      nextRoot.style.backgroundColor = "transparent";
    }
    return () => {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
      if (nextRoot) {
        nextRoot.style.backgroundColor = "";
      }
    };
  }, []);

  const handleSubmit = async () => {
    const errors = {};
    visibleFields.forEach((f) => {
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

    // Upload file-type fields to S3
    const fileUploadFields = visibleFields.filter(f => f.type === "file" && fileData[f.name]?.file);
    if (fileUploadFields.length > 0 && !event?.businessSlug) {
      setFieldErrors({ _global: "Business slug not available for file upload." });
      setSubmitting(false);
      return;
    }
    for (const f of fileUploadFields) {
      try {
        const url = await uploadSingleFile({
          file: fileData[f.name].file,
          businessSlug: event.businessSlug,
          moduleName: "digipass",
        });
        normalizedFormData[f.name] = url;
      } catch (err) {
        console.error("File upload failed:", err);
        setFieldErrors({ [f.name]: "File upload failed. Please try again." });
        setSubmitting(false);
        return;
      }
    }

    visibleFields.forEach((f) => {
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
      Object.values(fileData).forEach(fd => { if (fd?.preview) URL.revokeObjectURL(fd.preview); });
      setFileData({});
      showMessage(t.registrationSuccess, "success");
      router.replace(`/digipass/${eventSlug}/signin`);
    } else {
      setFieldErrors({ _global: result.message || t.registrationFailed });
    }
  };

  if (loading || !event) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
      sx: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 999,
          backgroundColor: (theme) => theme.palette.overlay.cardHeavy,
        },
      },
    };

    if (field.type === "radio")
      return (
        <Box key={field.name} sx={{ textAlign: "center" }}>
          <Typography sx={{ mb: 1 }}>
            {fieldLabel}
            {field.required && (
              <Typography component="span" sx={{ color: "error.main" }}> *</Typography>
            )}
          </Typography>
          <RadioGroup
            row
            name={field.name}
            value={formData[field.name] ?? ""}
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
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              backgroundColor: (theme) => theme.palette.overlay.cardHeavy,
            },
          }}
          required={field.required}
        >
          <InputLabel>{fieldLabel}</InputLabel>
          <Select
            name={field.name}
            value={formData[field.name] ?? ""}
            onChange={handleInputChange}
            label={fieldLabel}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: {
                    backgroundColor: "background.paper",
                    "& .MuiMenuItem-root": {
                      color: "text.primary",
                      "&:hover": { backgroundColor: "action.hover" },
                    },
                  },
                },
              },
            }}
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
      return <TextField key={field.name} {...commonProps} type="number" />;
    }

    if (field.type === "country") {
      return (
        <Box key={field.name} sx={{ mb: 2 }}>
          <CountryPicker
            label={fieldLabel}
            value={formData[field.name] || ""}
            onChange={(iso) => handleInputChange({ target: { name: field.name, value: iso } })}
            required={field.required}
            error={!!errorMsg}
            helperText={errorMsg || ""}
            lang={language}
            dir={dir}
          />
        </Box>
      );
    }

    if (field.type === "file") {
      const fd = fileData[field.name];
      return (
        <DigiPassFileUploadField
          key={field.name}
          field={field}
          fd={fd}
          fieldLabel={fieldLabel}
          errorMsg={errorMsg}
          isArabic={isArabic}
          onFileSelect={(file) => handleFileSelect(field.name, file)}
          onFileRemove={() => handleFileRemove(field.name)}
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
          slotProps={{
            input: {
              startAdornment: (
                <CountryCodeSelector
                  value={isoCode}
                  onChange={(iso) => handleCountryCodeChange(field.name, iso)}
                  disabled={event?.linkedEventRegId ? !event.linkedEventRegId.useInternationalNumbers : false}
                  dir={dir}
                />
              ),
            }
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
        position: "relative",
        overflow: "hidden",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
      dir={dir}
    >
      {/* Image Background */}
      {background && background.fileType === "image" && background.url && (
        <Box
          component="img"
          src={background.url}
          alt="Background"
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

      {/* Video Background */}
      {background?.fileType === "video" && background?.url && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            src={background.url}
            autoPlay
            playsInline
            loop
            muted={isMuted}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      )}

      {/* Back Button */}
      <IconButton
        onClick={() => router.push(`/digipass/${eventSlug}`)}
        sx={{
          position: "fixed",
          top: { xs: 10, sm: 20 },
          left: { xs: 10, sm: 20 },
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          zIndex: 9999,
        }}
      >
        <ICONS.back sx={{ fontSize: { xs: 24, md: 32 } }} />
      </IconButton>

      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Card */}
        <Card
          sx={{
            width: "100%",
            maxWidth: 600,
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            backdropFilter: "blur(6px)",
            backgroundColor: (theme) => theme.palette.overlay.cardHeavy, boxShadow: (theme) => theme.palette.shadow.dialog,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: 3, sm: 4 },
          }}
        >
          {/* Event Logo */}
          {logoUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: 220, sm: 280, md: 350 },
                height: "auto",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt="Event Logo"
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: { xs: 150, sm: 200, md: 250 },
                  objectFit: "cover",
                }}
              />
            </Box>
          )}

          {/* Global Error Alert */}
          {fieldErrors._global && (
            <Alert
              severity="error"
              sx={{
                width: "100%",
                mb: 2,
              }}
            >
              {fieldErrors._global}
            </Alert>
          )}

          {/* Form Fields + Register Button with consistent gap */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {visibleFields.map((f) => renderField(f))}

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting}
              onClick={handleSubmit}
              startIcon={
                submitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ICONS.register />
                )
              }
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                ...getStartIconSpacing(dir),
              }}
            >
              {t.register}
            </Button>
          </Box>
        </Card>
      </Container>
      {/* Force LanguageSelector subtree to LTR so EN/AR toggle behaves correctly in Arabic */}
      <Box dir="ltr">
        <LanguageSelector top={20} right={20} />
      </Box>
    </Box>
  );
}

function DigiPassFileUploadField({ field, fd, fieldLabel, errorMsg, isArabic, onFileSelect, onFileRemove }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <Box sx={{ mb: 2, textAlign: isArabic ? "right" : "left" }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, textAlign: "start" }}>
        {fieldLabel}
        {field.required && <Typography component="span" sx={{ color: "error.main" }}> *</Typography>}
      </Typography>
      {fd ? (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            p: 1,
            pr: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: (theme) => theme.palette.overlay.card,
            textAlign: "left",
          }}
        >
          {fd.file.type.startsWith("image/") ? (
            <Box component="img" src={fd.preview} alt="Preview" sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "contain", bgcolor: "background.paper" }} />
          ) : fd.file.type.startsWith("video/") ? (
            <Box component="video" src={fd.preview} sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "contain", bgcolor: "background.paper" }} />
          ) : (
            <ICONS.upload sx={{ fontSize: 28, color: "text.secondary", mx: 0.5 }} />
          )}
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fd.file.name}
          </Typography>
          <IconButton onClick={onFileRemove} size="small" sx={{ bgcolor: "error.main", color: "error.contrastText", "&:hover": { bgcolor: "error.dark" }, width: 28, height: 28, flexShrink: 0 }}>
            <ICONS.delete sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ) : (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) onFileSelect(file); }}
          sx={{
            border: "2px dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            borderRadius: 3,
            py: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            bgcolor: dragOver ? "action.hover" : "transparent",
            transition: "border-color 0.2s, background-color 0.2s",
          }}
          onClick={() => document.getElementById(`file-input-${field.name}`)?.click()}
        >
          <ICONS.upload sx={{ fontSize: 28, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {isArabic ? "اختر ملفًا أو اسحب وأفلت" : "Choose File or Drag & Drop"}
          </Typography>
          <input id={`file-input-${field.name}`} type="file" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = ""; }} />
        </Box>
      )}
      {errorMsg && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{errorMsg}</Typography>}
    </Box>
  );
}
