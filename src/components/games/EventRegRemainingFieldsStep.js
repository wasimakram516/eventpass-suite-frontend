"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import useI18nLayout from "@/hooks/useI18nLayout";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import SearchableSelect from "@/components/SearchableSelect";
import { translateTexts } from "@/services/translationService";
import { applyTranslationOverridesToArray, resolveGlossaryTerm } from "@/utils/translationOverrides";
import { DEFAULT_ISO_CODE, getCountryCodeByIsoCode } from "@/utils/countryCodes";
import { validatePhoneNumber, normalizePhone } from "@/utils/phoneValidation";

const translations = {
  en: {
    title: "Almost there",
    helper: "Tell us a little more about you to continue.",
    submit: "Continue",
    submitting: "Saving...",
    required: "is required",
    invalidEmail: "Invalid email address",
    pleaseSelect: "Please select",
  },
  ar: {
    title: "قاربنا على الانتهاء",
    helper: "أخبرنا المزيد عنك للمتابعة.",
    submit: "متابعة",
    submitting: "جارٍ الحفظ...",
    required: "مطلوب",
    invalidEmail: "عنوان البريد الإلكتروني غير صالح",
    pleaseSelect: "يرجى الاختيار",
  },
};

function fieldLabel(name) {
  if (name === "fullName") return "Full Name";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// In light mode the step sits on a white card (same as the EventReg register
// page), so text and inputs use the standard theme tokens. In dark mode it
// keeps each module's glass look.
function useFieldStyles(module) {
  const headingColor = "text.primary";
  const helperColor = "text.secondary";

  const inputFieldSx = (theme) => {
    if (theme.palette.mode === "light") {
      return {
        backgroundColor: theme.palette.background.paper,
        color: "text.primary",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
      };
    }
    if (module === "quiznest" || module === "tapmatch") {
      return {
        backgroundColor: theme.palette.quiznest.inputBg,
        color: theme.palette.common.white,
        "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.quiznest.inputBorder },
      };
    }
    if (module === "eventduel") {
      return {
        backgroundColor: (t) => t.palette.action.hover,
        color: "common.white",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
      };
    }
    return {
      backgroundColor: (t) => alpha(t.palette.action.hover, t.palette.mode === "dark" ? 0.32 : 0.6),
      color: "text.primary",
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
    };
  };

  const inputLabelSx = { color: "text.secondary" };

  return { headingColor, helperColor, inputFieldSx, inputLabelSx };
}

// Second step shown on a game start page when the primary field didn't match
// an existing registration. Collects the rest of the linked event's form with
// the same per-type validation as the EventReg register page; required fields
// are enforced before creating the registration.
const EventRegRemainingFieldsStep = ({ fields = [], submitting = false, onSubmit, module = "quiznest" }) => {
  const { t, dir, align, language } = useI18nLayout(translations);
  const { headingColor, helperColor, inputFieldSx, inputLabelSx } = useFieldStyles(module);

  const [values, setValues] = useState({});
  const [isoCodes, setIsoCodes] = useState({});
  const [errors, setErrors] = useState({});
  const [translatedLabels, setTranslatedLabels] = useState({});

  // Translate field labels + option values (mirrors the EventReg register page).
  useEffect(() => {
    const labels = fields.map((f) => fieldLabel(f.inputName));
    const options = fields.flatMap((f) => f.values || []);
    const texts = [...new Set([...labels, ...options])].filter(
      (text) => typeof text === "string" && text.trim() !== ""
    );
    if (!texts.length) {
      setTranslatedLabels({});
      return;
    }
    let mounted = true;
    translateTexts(texts, language).then((rawResults) => {
      if (!mounted) return;
      const results = applyTranslationOverridesToArray(rawResults || [], language);
      const map = {};
      texts.forEach((text, i) => {
        map[text] = resolveGlossaryTerm(text, language) || results[i] || text;
      });
      setTranslatedLabels(map);
    }).catch(() => {
      if (mounted) setTranslatedLabels({});
    });
    return () => {
      mounted = false;
    };
  }, [fields, language]);

  const translateValue = (text, fallback) => translatedLabels[text] || fallback || text;

  const inputSlotProps = useMemo(
    () => ({
      inputLabel: { sx: inputLabelSx },
      input: { sx: inputFieldSx },
    }),
    [inputLabelSx, inputFieldSx]
  );

  const setFieldValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhoneChange = (name, value) => {
    const digitsOnly = value.replace(/\D/g, "");
    setFieldValue(name, digitsOnly);
  };

  const handleCountryCodeChange = (name, isoCode) => {
    setIsoCodes((prev) => ({ ...prev, [name]: isoCode }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const nextErrors = {};
    fields.forEach((f) => {
      const val = values[f.inputName];
      const present = val != null && String(val).trim() !== "";

      if (f.required && !present) {
        nextErrors[f.inputName] = `${fieldLabel(f.inputName)} ${t.required}`;
        return;
      }
      if (!present) return;

      if (f.inputType === "email" && !isValidEmail(String(val).trim())) {
        nextErrors[f.inputName] = t.invalidEmail;
      }

      if (f.inputType === "phone") {
        const isoCode = isoCodes[f.inputName] || DEFAULT_ISO_CODE;
        const phoneError = validatePhoneNumber(String(val).trim(), isoCode);
        if (phoneError) nextErrors[f.inputName] = phoneError;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {};
    fields.forEach((f) => {
      const raw = values[f.inputName];
      if (raw == null || String(raw).trim() === "") return;
      let value = String(raw).trim();
      if (f.inputType === "phone") {
        const isoCode = isoCodes[f.inputName] || DEFAULT_ISO_CODE;
        const country = getCountryCodeByIsoCode(isoCode);
        if (country) {
          const fullPhone = value.startsWith("+") ? value : `${country.code}${value}`;
          const normalized = normalizePhone(fullPhone);
          const countryCode = country.code;
          if (normalized && normalized.startsWith("+")) {
            const local = normalized.substring(countryCode.length).trim();
            value = local || value;
          }
        }
      }
      payload[f.inputName] = value;
    });
    onSubmit(payload);
  };

  // Continue stays enabled when no additional field is required; when any is
  // required, it stays disabled until every required field is filled.
  const hasRequiredFields = fields.some((f) => f.required);
  const missingRequired = fields.some(
    (f) => f.required && (!values[f.inputName] || String(values[f.inputName]).trim() === "")
  );
  const continueDisabled = hasRequiredFields && missingRequired;

  const isPhoneField = (f) => f.inputType === "phone";

  return (
    <Box dir={dir} sx={{ width: "100%", textAlign: align }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: headingColor }}>
        {t.title}
      </Typography>
      <Typography variant="body2" sx={{ color: helperColor, mb: 2 }}>
        {t.helper}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {fields.map((f) => {
          const label = fieldLabel(f.inputName);
          const translatedLabel = translateValue(label, label);
          const errorMsg = errors[f.inputName];

          if (f.inputType === "radio") {
            return (
              <Box key={f.inputName} sx={{ textAlign: align }}>
                <Typography variant="body2" sx={{ color: headingColor, mb: 0.5 }}>
                  {translatedLabel}
                  {f.required ? <Typography component="span" sx={{ color: "error.main" }}> *</Typography> : null}
                </Typography>
                <RadioGroup
                  row
                  name={f.inputName}
                  value={values[f.inputName] ?? ""}
                  onChange={(e) => setFieldValue(f.inputName, e.target.value)}
                  sx={{ justifyContent: align === "right" ? "flex-end" : "flex-start", gap: 2 }}
                >
                  {(f.values || []).map((opt) => (
                    <FormControlLabel
                      key={`${f.inputName}-${opt}`}
                      value={opt}
                      control={<Radio size="small" />}
                      label={translateValue(opt, opt)}
                      sx={{ color: headingColor }}
                    />
                  ))}
                </RadioGroup>
                {errorMsg ? (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                    {errorMsg}
                  </Typography>
                ) : null}
              </Box>
            );
          }

          if (f.inputType === "list") {
            return (
              <SearchableSelect
                key={f.inputName}
                name={f.inputName}
                label={translatedLabel}
                value={values[f.inputName] ?? ""}
                onChange={(e) => setFieldValue(f.inputName, e.target.value)}
                options={(f.values || []).map((opt) => ({ value: opt, label: translateValue(opt, opt) }))}
                required={f.required}
                error={!!errorMsg}
                helperText={errorMsg || ""}
                lang={language}
                dir={dir}
              />
            );
          }

          if (f.inputType === "country") {
            return (
              <Box key={f.inputName}>
                <CountryPicker
                  label={translatedLabel}
                  value={values[f.inputName] || ""}
                  onChange={(iso) => setFieldValue(f.inputName, iso)}
                  required={f.required}
                  error={!!errorMsg}
                  helperText={errorMsg || ""}
                  lang={language}
                  dir={dir}
                />
              </Box>
            );
          }

          if (isPhoneField(f)) {
            const isoCode = isoCodes[f.inputName] || DEFAULT_ISO_CODE;
            return (
              <TextField
                key={f.inputName}
                label={translatedLabel}
                fullWidth
                required={f.required}
                value={values[f.inputName] ?? ""}
                onChange={(e) => handlePhoneChange(f.inputName, e.target.value)}
                type="tel"
                slotProps={{
                  input: {
                    startAdornment: (
                      <CountryCodeSelector
                        value={isoCode}
                        onChange={(iso) => handleCountryCodeChange(f.inputName, iso)}
                        dir={dir}
                      />
                    ),
                    sx: (theme) => inputFieldSx(theme),
                  },
                  inputLabel: { sx: inputLabelSx },
                }}
                error={!!errorMsg}
                helperText={errorMsg || ""}
              />
            );
          }

          return (
            <TextField
              key={f.inputName}
              label={translatedLabel}
              type={f.inputType === "number" ? "number" : f.inputType === "email" ? "email" : "text"}
              fullWidth
              required={f.required}
              value={values[f.inputName] ?? ""}
              onChange={(e) => setFieldValue(f.inputName, e.target.value)}
              slotProps={inputSlotProps}
              error={!!errorMsg}
              helperText={errorMsg || ""}
            />
          );
        })}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        disabled={submitting || continueDisabled}
        sx={{ mt: 2, py: 1.2, borderRadius: 999, fontWeight: 700 }}
      >
        {submitting ? <CircularProgress size={22} color="inherit" /> : t.submit}
      </Button>
    </Box>
  );
};

export default EventRegRemainingFieldsStep;