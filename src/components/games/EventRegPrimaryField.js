"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import useI18nLayout from "@/hooks/useI18nLayout";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import SearchableSelect from "@/components/SearchableSelect";
import { translateTexts } from "@/services/translationService";
import { applyTranslationOverridesToArray, resolveGlossaryTerm } from "@/utils/translationOverrides";
import { DEFAULT_ISO_CODE } from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";

const translations = {
  en: {
    required: "is required",
    invalidEmail: "Invalid email address",
    pleaseSelect: "Please select",
  },
  ar: {
    required: "مطلوب",
    invalidEmail: "عنوان البريد الإلكتروني غير صالح",
    pleaseSelect: "يرجى الاختيار",
  },
};

// The value a player types for a linked game's primary field must match the
// field's type on the linked event's registration form (email → valid email,
// phone → valid phone, list/radio → one of the options). Returns an error
// token, or "" when the value is acceptable.
export const validatePrimaryValue = (link, value, isoCode = DEFAULT_ISO_CODE) => {
  const type = link?.primaryInputType || "text";
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  if (trimmed === "") return "";

  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "invalid_email";
  }

  if (type === "phone") {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) return "";
    return validatePhoneNumber(digitsOnly, isoCode) || "";
  }

  if (type === "list" || type === "radio") {
    const options = (link?.primaryFieldValues || []).map((o) => String(o));
    return options.length && !options.includes(trimmed) ? "invalid_choice" : "";
  }

  return "";
};

// Whether the form is ready to submit: a blank value never is; otherwise a
// value is ready when it passes the field's own type validation.
export const isPrimaryValueReady = (link, value, isoCode = DEFAULT_ISO_CODE) => {
  const raw = String(value ?? "").trim();
  if (raw === "") return false;
  return validatePrimaryValue(link, raw, isoCode) === "";
};

function useFieldStyles(module) {
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

  return { inputFieldSx, inputLabelSx };
}

function fieldLabel(name) {
  if (name === "fullName") return "Full Name";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// First-step primary field for a linked game. Renders the control that matches
// the linked event's field type (text/email/phone/number/list/radio/country)
// and validates input accordingly, like the EventReg register form does. For
// phone fields the chosen country code is reported back to the caller so it
// can be sent with the join payload.
const EventRegPrimaryField = ({
  link,
  label,
  module = "quiznest",
  value,
  onChange,
  onIsoCodeChange,
  onValidityChange,
  dir,
  language,
}) => {
  const { t } = useI18nLayout(translations);
  const { inputFieldSx, inputLabelSx } = useFieldStyles(module);

  const type = link?.primaryInputType || "text";
  const required = link?.primaryFieldRequired !== false;
  const options = (link?.primaryFieldValues || []).map((o) => String(o));
  const isCustomField = type === "list" || type === "radio";

  const [isoCode, setIsoCode] = useState(DEFAULT_ISO_CODE);
  const [touched, setTouched] = useState(false);
  const [translated, setTranslated] = useState({});

  // Translate the label + option values with the same pipeline as the rest of
  // the module (glossary overrides first, then the API translation).
  useEffect(() => {
    const rawLabel = fieldLabel(link?.primaryField || "");
    const texts = [...new Set([rawLabel, label, ...options])].filter(
      (text) => typeof text === "string" && text.trim() !== ""
    );
    if (!texts.length) {
      setTranslated({});
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
      setTranslated(map);
    }).catch(() => {
      if (mounted) setTranslated({});
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link?.primaryField, language, JSON.stringify(options)]);

  const translatedLabel = translated[label] || label || "";
  const translateOption = (opt) => translated[opt] || opt;

  useEffect(() => {
    const error = validatePrimaryValue(link, value, isoCode);
    setTouched((cur) => cur || String(value ?? "").trim() !== "");
    onValidityChange?.(isPrimaryValueReady(link, value, isoCode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isoCode, link]);

  const visibleError = touched ? validatePrimaryValue(link, value, isoCode) : "";
  let displayError = "";
  if (visibleError === "invalid_email") displayError = t.invalidEmail;
  else if (visibleError === "invalid_choice") displayError = t.pleaseSelect;
  else displayError = visibleError || "";

  const inputSlotProps = useMemo(
    () => ({
      input: { sx: inputFieldSx },
      inputLabel: { sx: inputLabelSx },
    }),
    [inputFieldSx, inputLabelSx]
  );

  const handlePhoneValue = (raw) => {
    onChange(raw.replace(/\D/g, ""));
  };

  const handleIsoChange = (code) => {
    setIsoCode(code);
    onIsoCodeChange?.(code);
  };

  if (type === "radio") {
    return (
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Typography variant="body1" sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}>
          {translatedLabel}
          {required ? <Typography component="span" sx={{ color: "error.main" }}> *</Typography> : null}
        </Typography>
        <RadioGroup
          row
          name="primary-field"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          sx={{ justifyContent: dir === "rtl" ? "flex-end" : "flex-start", gap: 1, mb: 1 }}
        >
          {options.map((opt) => (
            <FormControlLabel
              key={opt}
              value={opt}
              control={<Radio size="small" />}
              label={translateOption(opt)}
              sx={{ color: "text.primary" }}
            />
          ))}
        </RadioGroup>
        {displayError ? (
          <Typography variant="caption" color="error" sx={{ display: "block" }}>
            {displayError}
          </Typography>
        ) : null}
      </Box>
    );
  }

  if (isCustomField && options.length) {
    return (
      <SearchableSelect
        name="primary-field"
        label={translatedLabel}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        options={options.map((opt) => ({ value: opt, label: translateOption(opt) }))}
        required={required}
        error={!!displayError}
        helperText={displayError || ""}
        lang={language}
        dir={dir}
        sx={{ mb: 2 }}
      />
    );
  }

  if (type === "country") {
    return (
      <Box sx={{ mb: 2 }}>
        <CountryPicker
          label={translatedLabel}
          value={String(value ?? "")}
          onChange={(iso) => onChange(iso)}
          required={required}
          lang={language}
          dir={dir}
        />
      </Box>
    );
  }

  if (type === "phone") {
    return (
      <TextField
        label={translatedLabel}
        fullWidth
        required={required}
        value={String(value ?? "")}
        onChange={(e) => handlePhoneValue(e.target.value)}
        type="tel"
        error={!!displayError}
        helperText={displayError || ""}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <CountryCodeSelector
                value={isoCode}
                onChange={handleIsoChange}
                dir={dir}
              />
            ),
            sx: inputFieldSx,
          },
          inputLabel: { sx: inputLabelSx },
        }}
      />
    );
  }

  return (
    <TextField
      label={translatedLabel}
      type={type === "number" ? "number" : type === "email" ? "email" : "text"}
      fullWidth
      required={required}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      slotProps={inputSlotProps}
      error={!!displayError}
      helperText={displayError || ""}
      sx={{ mb: 2 }}
    />
  );
};

export default EventRegPrimaryField;