"use client";

import React, { useEffect, useState } from "react";
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
import { normalizePhone } from "@/utils/phoneUtils";
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_ISO_CODE,
  COUNTRY_CODES,
  getCountryCodeByIsoCode,
} from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessage } from "@/contexts/MessageContext";

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
      showMessage(t.registrationSuccess, "success");
      router.replace(`/digipass/${eventSlug}/signin`);
    } else {
      setFieldErrors({ _global: result.message || t.registrationFailed });
    }
  };

  if (loading || !event || !translatedEvent || !translationsReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "url('/bf-digiPass.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <CircularProgress sx={{ color: "white" }} />
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
        mb: 2,
        "& .MuiInputLabel-root": {
          color: "white",
          "&.Mui-focused": {
            color: "white",
          },
        },
        "& .MuiOutlinedInput-root": {
          color: "white",
          backgroundColor: "#0B1E3D",
          "& fieldset": {
            borderColor: "white",
          },
          "&:hover fieldset": {
            borderColor: "white",
          },
          "&.Mui-focused fieldset": {
            borderColor: "white",
          },
        },
        "& .MuiInputBase-input": {
          color: "white",
        },
        "& .MuiFormHelperText-root": {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    };

    if (field.type === "radio")
      return (
        <Box key={field.name} sx={{ mb: 2, textAlign: "center" }}>
          <Typography sx={{ mb: 1, color: "white" }}>
            {fieldLabel}
            {field.required && (
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}> *</span>
            )}
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
                control={
                  <Radio
                    sx={{
                      p: 0.5,
                      color: "white",
                      "&.Mui-checked": {
                        color: "white",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "white" }}>
                    {translations[opt] || opt}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>
          {errorMsg && (
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
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
            mb: 2,
            "& .MuiInputLabel-root": {
              color: "white",
              "&.Mui-focused": {
                color: "white",
              },
            },
            "& .MuiOutlinedInput-root": {
              color: "white",
              backgroundColor: "#0B1E3D",
              "& fieldset": {
                borderColor: "white",
              },
              "&:hover fieldset": {
                borderColor: "white",
              },
              "&.Mui-focused fieldset": {
                borderColor: "white",
              },
            },
            "& .MuiSvgIcon-root": {
              color: "white",
            },
          }}
          required={field.required}
        >
          <InputLabel>{fieldLabel}</InputLabel>
          <Select
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            label={fieldLabel}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#f5f5f5",
                  "& .MuiMenuItem-root": {
                    color: "#333",
                    "&:hover": {
                      backgroundColor: "#e0e0e0",
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
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              {errorMsg}
            </Typography>
          )}
        </FormControl>
      );

    if (field.type === "number") {
      return <TextField key={field.name} {...commonProps} type="number" />;
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
              <Box sx={{ color: "white" }}>
                <CountryCodeSelector
                  value={isoCode}
                  onChange={(iso) => handleCountryCodeChange(field.name, iso)}
                  disabled={false}
                  dir={dir}
                />
              </Box>
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
        position: "relative",
        overflow: "hidden",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
      dir={dir}
    >
      {/* Background Image */}
      <Box
        component="img"
        src="/bf-digiPass.png"
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

      {/* Back Button */}
      <IconButton
        onClick={() => router.push(`/digipass/${eventSlug}`)}
        sx={{
          position: "absolute",
          top: { xs: "1.5vw", sm: "1.2vw", md: "1vw" },
          left: { xs: "1.5vw", sm: "1.2vw", md: "1vw" },
          bgcolor: "rgba(255, 255, 255, 0.7)",
          color: "#0B1E3D",
          width: { xs: "10vw", sm: "8vw", md: "6vw" },
          height: { xs: "10vw", sm: "8vw", md: "6vw" },
          minWidth: "40px",
          minHeight: "40px",
          maxWidth: "60px",
          maxHeight: "60px",
          zIndex: 1000,
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.9)",
          },
          boxShadow: 2,
        }}
      >
        <ICONS.back
          sx={{
            fontSize: { xs: "5vw", sm: "4vw", md: "3vw" },
            maxFontSize: "24px",
          }}
        />
      </IconButton>

      {/* Orange Circle Background */}
      <Box
        component="img"
        src="/orangeCircle.png"
        alt="Orange Circle"
        sx={{
          position: "absolute",
          top: 0,
          right: "-19vw",
          width: "96%",
          height: "57%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

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
            maxWidth: { xs: "100%", sm: 450, md: 500 },
            backgroundColor: "#0B1E3D",
            borderRadius: { xs: 3, sm: 4 },
            p: { xs: 4, sm: 5, md: 6 },
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: 3, sm: 4 },
            minHeight: { xs: 500, sm: 600, md: 700 },
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
                "& .MuiAlert-message": {
                  color: "white",
                },
                backgroundColor: "rgba(211, 47, 47, 0.2)",
              }}
            >
              {fieldErrors._global}
            </Alert>
          )}

          {/* Form Fields */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {dynamicFields.map((f) => renderField(f))}
          </Box>

          {/* Register Button */}
          <Button
            variant="outlined"
            size="large"
            fullWidth
            disabled={submitting}
            onClick={handleSubmit}
            startIcon={
              submitting ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                <ICONS.register />
              )
            }
            sx={{
              borderColor: "white",
              color: "white",
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              "&:disabled": {
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "rgba(255, 255, 255, 0.5)",
              },
            }}
          >
            {submitting ? "Registering..." : "Register"}
          </Button>
        </Card>
      </Container>
    </Box>
  );
}
