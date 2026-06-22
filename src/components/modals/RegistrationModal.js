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
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    InputLabel,
    Select,
    Box,
    Typography,
    FormHelperText,
    CircularProgress,
    IconButton,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import { DEFAULT_COUNTRY_CODE, DEFAULT_ISO_CODE, COUNTRY_CODES, getCountryCodeByIsoCode } from "@/utils/countryCodes";
import { normalizePhone } from "@/utils/phoneUtils";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { uploadSingleFile } from "@/utils/mediaUpload";


export default function RegistrationModal({
    open,
    onClose,
    registration,
    formFields,
    onSave,
    mode = "edit",
    title,
    event,
}) {
    const [values, setValues] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [countryIsoCodes, setCountryIsoCodes] = useState({});
    const [fileData, setFileData] = useState({});

    const hasCustomFields = useMemo(() => (event?.useCustomFields ?? formFields?.length > 0) && formFields?.length > 0, [event?.useCustomFields, formFields]);

    // When editing, check if this registration has its own custom field data
    const regCustomFields = useMemo(() => {
        if (!registration || mode !== "edit") return null;
        const cf = registration.customFields instanceof Map
            ? Object.fromEntries(registration.customFields)
            : (registration.customFields || {});
        const keys = Object.keys(cf).filter(k => cf[k] && String(cf[k]).trim());
        return keys.length > 0 ? cf : null;
    }, [registration, mode]);

    const filteredFormFields = useMemo(() => {
        if (!formFields || !formFields.length) return [];
        return formFields.filter((f) => f.visible !== false);
    }, [formFields]);

    const classicFields = useMemo(
        () => [
            { inputName: "Full Name", inputType: "text", required: true },
            { inputName: "Email", inputType: "email", required: true },
            { inputName: "Phone", inputType: "text", required: false },
            { inputName: "Company", inputType: "text", required: false },
        ],
        []
    );

    const fieldsToRender = useMemo(
        () => {
            if (regCustomFields) {
                return Object.keys(regCustomFields).map(key => ({
                    inputName: key,
                    inputType: "text",
                    required: false,
                }));
            }
            // When editing a registration without customFields, always show classic fields
            if (mode === "edit") return classicFields;
            return hasCustomFields ? filteredFormFields : classicFields;
        },
        [hasCustomFields, filteredFormFields, classicFields, regCustomFields, mode]
    );

    const visibleFields = useMemo(() => {
        if (!hasCustomFields) return fieldsToRender;
        const dependentsOf = {};
        fieldsToRender.forEach(f => {
            if (f.dependents) {
                try {
                    const depMap = JSON.parse(f.dependents);
                    Object.entries(depMap).forEach(([option, config]) => {
                        (config.fieldIds || []).forEach(childName => {
                            if (!dependentsOf[childName]) dependentsOf[childName] = [];
                            dependentsOf[childName].push({ parentName: f.inputName, option });
                        });
                    });
                } catch { }
            }
        });
        return fieldsToRender.filter(f => {
            const deps = dependentsOf[f.inputName];
            if (!deps) return true;
            return deps.some(d => {
                const parentVal = values[d.parentName];
                return parentVal === d.option;
            });
        });
    }, [fieldsToRender, values, hasCustomFields]);

    useEffect(() => {
        if (fieldsToRender.length > 0) {
            const init = {};
            const initCountryIsoCodes = {};
            if (registration && mode === "edit") {
                fieldsToRender.forEach((f) => {
                    if (regCustomFields) {
                        init[f.inputName] = regCustomFields[f.inputName] || "";
                    } else {
                        const fieldMap = {
                            "Full Name": registration.fullName,
                            Email: registration.email,
                            Phone: registration.phone,
                            Company: registration.company,
                        };
                        init[f.inputName] = fieldMap[f.inputName] || registration[f.inputName] || "";
                    }
                    if (isPhoneField(f)) {
                        const phoneValue = init[f.inputName] || "";
                        const regIsoCode = registration?.isoCode;
                        if (regIsoCode) {
                            initCountryIsoCodes[f.inputName] = regIsoCode.toLowerCase();
                        } else if (phoneValue.startsWith("+")) {
                            let foundCountry = null;
                            let longestMatch = "";
                            for (const country of COUNTRY_CODES) {
                                if (phoneValue.startsWith(country.code)) {
                                    if (country.code.length > longestMatch.length) {
                                        longestMatch = country.code;
                                        foundCountry = country;
                                    }
                                }
                            }
                            if (foundCountry) {
                                initCountryIsoCodes[f.inputName] = foundCountry.isoCode;
                                init[f.inputName] = phoneValue.substring(foundCountry.code.length).trim();
                            } else {
                                initCountryIsoCodes[f.inputName] = DEFAULT_ISO_CODE;
                            }
                        } else {
                            initCountryIsoCodes[f.inputName] = DEFAULT_ISO_CODE;
                        }
                    }
                });
            } else {
                fieldsToRender.forEach((f) => {
                    init[f.inputName] = "";
                    if (isPhoneField(f)) {
                        initCountryIsoCodes[f.inputName] = DEFAULT_ISO_CODE;
                    }
                });
            }
            setValues(init);
            setCountryIsoCodes(initCountryIsoCodes);
            setFieldErrors({});
            setLoading(false);
        }
    }, [registration, fieldsToRender, hasCustomFields, mode, open, registration?.isoCode]);

    const handleChange = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
        const parentField = fieldsToRender.find(f => f.inputName === key);
        if (parentField?.dependents) {
            try {
                const depMap = JSON.parse(parentField.dependents);
                const allChildIds = new Set();
                Object.values(depMap).forEach(config => {
                    (config.fieldIds || []).forEach(id => allChildIds.add(id));
                });
                setValues(prev => {
                    const next = { ...prev };
                    allChildIds.forEach(id => { next[id] = ""; });
                    return next;
                });
            } catch { }
        }
    };

    const handleCountryCodeChange = (fieldName, isoCode) => {
        setCountryIsoCodes((prev) => ({ ...prev, [fieldName]: isoCode }));
    };

    const handlePhoneChange = (fieldName, value) => {
        const digitsOnly = value.replace(/\D/g, "");
        setValues((prev) => ({ ...prev, [fieldName]: digitsOnly }));
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleFileSelect = (fieldName, file) => {
        if (fileData[fieldName]?.preview) {
            URL.revokeObjectURL(fileData[fieldName].preview);
        }
        const preview = URL.createObjectURL(file);
        setFileData((prev) => ({ ...prev, [fieldName]: { file, preview } }));
        setValues((prev) => ({ ...prev, [fieldName]: file.name }));
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const handleFileRemove = (fieldName) => {
        if (fileData[fieldName]?.preview) {
            URL.revokeObjectURL(fileData[fieldName].preview);
        }
        setFileData((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
        setValues((prev) => ({ ...prev, [fieldName]: "" }));
    };

    const isPhoneField = (field) => {
        if (field.inputType === "number") return false;
        if (field.inputType === "phone") return true;
        if (field.inputName === "Phone") return true;
        return false;
    };


    const validateFields = () => {
        const errors = {};
        visibleFields.forEach((f) => {
            const rawValue = values[f.inputName];
            const val = rawValue != null ? String(rawValue).trim() : "";
            const required = f.required || false;

            if (required && !val) {
                errors[f.inputName] = `${f.inputName} is required`;
            }

            if ((f.inputType === "email" || f.inputName === "Email") && val && !isValidEmail(val)) {
                errors[f.inputName] = "Invalid email address";
            }

            if (isPhoneField(f) && val) {
                const isoCode = countryIsoCodes[f.inputName] || DEFAULT_ISO_CODE;
                const phoneError = validatePhoneNumber(val, isoCode);
                if (phoneError) {
                    errors[f.inputName] = phoneError;
                }
            }
        });

        return errors;
    };

    const handleSave = async () => {
        const errors = validateFields();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const normalizedValues = {};
            visibleFields.forEach(f => {
                normalizedValues[f.inputName] = values[f.inputName] ?? "";
            });
            let phoneIsoCode = null;

            // Upload file-type fields to S3
            const fileUploadFields = visibleFields.filter(f => f.inputType === "file" && fileData[f.inputName]?.file);
            if (fileUploadFields.length > 0 && !event?.businessSlug) {
                setFieldErrors({ _global: "Business slug not available for file upload." });
                setLoading(false);
                return;
            }
            for (const f of fileUploadFields) {
                try {
                    const url = await uploadSingleFile({
                        file: fileData[f.inputName].file,
                        businessSlug: event.businessSlug,
                        moduleName: "eventreg",
                    });
                    normalizedValues[f.inputName] = url;
                } catch (err) {
                    console.error("File upload failed:", err);
                    setFieldErrors({ [f.inputName]: "File upload failed." });
                    setLoading(false);
                    return;
                }
            }

            visibleFields.forEach((f) => {
                if (isPhoneField(f)) {
                    const phoneValue = normalizedValues[f.inputName];
                    if (phoneValue) {
                        const isoCode = countryIsoCodes[f.inputName] || DEFAULT_ISO_CODE;
                        const country = getCountryCodeByIsoCode(isoCode);
                        const countryCode = country?.code || DEFAULT_COUNTRY_CODE;
                        const fullPhone = phoneValue.startsWith("+")
                            ? phoneValue
                            : `${countryCode}${phoneValue}`;
                        const normalized = normalizePhone(fullPhone);

                        phoneIsoCode = isoCode;

                        normalizedValues[f.inputName] = phoneValue.trim();
                    }
                }
            });

            if (phoneIsoCode) {
                normalizedValues.isoCode = phoneIsoCode;
            }

            await onSave(normalizedValues);
        } finally {
            setLoading(false);
        }
    };

    const renderField = (f) => {
        const value = values[f.inputName] ?? "";
        const required = f.required || false;
        const errorMsg = fieldErrors[f.inputName];

        if (f.inputType === "radio") {
            return (
                <Box key={f.inputName} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {f.inputName}
                        {required && <span style={{ color: "red" }}> *</span>}
                    </Typography>
                    <RadioGroup
                        row
                        name={f.inputName}
                        value={value}
                        onChange={(e) => handleChange(f.inputName, e.target.value)}
                    >
                        {f.values?.map((opt) => (
                            <FormControlLabel
                                key={`${f.inputName}-${opt}`}
                                value={opt}
                                control={<Radio size="small" />}
                                label={opt}
                            />
                        ))}
                    </RadioGroup>
                    {errorMsg && (
                        <FormHelperText error sx={{ mt: 0.5 }}>
                            {errorMsg}
                        </FormHelperText>
                    )}
                </Box>
            );
        }

        if (["list", "select", "dropdown"].includes(f.inputType)) {
            return (
                <FormControl key={f.inputName} fullWidth size="small" required={required} error={!!errorMsg}>
                    <InputLabel>{f.inputName}</InputLabel>
                    <Select
                        value={value}
                        onChange={(e) => handleChange(f.inputName, e.target.value)}
                        label={f.inputName}
                    >
                        {f.values?.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                    {errorMsg && <FormHelperText>{errorMsg}</FormHelperText>}
                </FormControl>
            );
        }

        if (f.inputType === "number") {
            return (
                <TextField
                    key={f.inputName}
                    label={f.inputName}
                    value={value}
                    onChange={(e) => handleChange(f.inputName, e.target.value)}
                    fullWidth
                    size="small"
                    required={required}
                    error={!!errorMsg}
                    helperText={errorMsg}
                    type="number"
                />
            );
        }

        if (f.inputType === "country") {
            return (
                <Box key={f.inputName} sx={{ mb: 2 }}>
                    <CountryPicker
                        label={f.inputName}
                        value={value}
                        onChange={(iso) => handleChange(f.inputName, iso)}
                        required={required}
                        error={!!errorMsg}
                        helperText={errorMsg || ""}
                    />
                </Box>
            );
        }

        if (f.inputType === "file") {
            const fd = fileData[f.inputName];
            return (
                <ModalFileUploadField
                    key={f.inputName}
                    field={f}
                    fd={fd}
                    fieldLabel={f.inputName}
                    errorMsg={errorMsg}
                    required={required}
                    onFileSelect={(file) => handleFileSelect(f.inputName, file)}
                    onFileRemove={() => handleFileRemove(f.inputName)}
                />
            );
        }

        const isPhoneField = f.inputType === "phone" || f.inputName === "Phone";
        const useInternationalNumbers = event?.useInternationalNumbers !== false;

        if (isPhoneField) {
            const isoCode = countryIsoCodes[f.inputName] || DEFAULT_ISO_CODE;
            const phoneValue = value || "";

            return (
                <TextField
                    key={f.inputName}
                    label={f.inputName}
                    value={phoneValue}
                    onChange={(e) => handlePhoneChange(f.inputName, e.target.value)}
                    fullWidth
                    size="small"
                    required={required}
                    error={!!errorMsg}
                    helperText={errorMsg || "Enter your phone number"}
                    type="tel"
                    slotProps={{
                        input: {
                            startAdornment: (
                                <CountryCodeSelector
                                    value={isoCode}
                                    onChange={(iso) => handleCountryCodeChange(f.inputName, iso)}
                                    disabled={!useInternationalNumbers}
                                    dir="ltr"
                                />
                            ),
                        }
                    }}
                />
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
                required={required}
                error={!!errorMsg}
                helperText={errorMsg}
                type={f.inputType === "number" ? "number" : f.inputType === "email" ? "email" : "text"}
            />
        );
    };

    const displayTitle = title || (mode === "create" ? "Create Registration" : "Edit Registration");
    const saveButtonText = mode === "create" ? "Create" : "Save Changes";

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{displayTitle}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{
                    mt: 1
                }}>
                    {visibleFields.map((f) => renderField(f))}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={loading}
                    startIcon={<ICONS.cancel />}
                    sx={getStartIconSpacing("ltr")}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={
                        loading ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            <ICONS.save />
                        )
                    }
                    sx={getStartIconSpacing("ltr")}
                >
                    {saveButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function ModalFileUploadField({ field, fd, fieldLabel, errorMsg, required, onFileSelect, onFileRemove }) {
    const [dragOver, setDragOver] = useState(false);
    return (
        <Box sx={{ mb: 2, textAlign: "left" }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {fieldLabel}
                {required && <span style={{ color: "red" }}> *</span>}
            </Typography>
            {fd ? (
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, p: 1, pr: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
                    {fd.file.type.startsWith("image/") ? (
                        <Box component="img" src={fd.preview} alt="Preview" sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "contain", bgcolor: "grey.100" }} />
                    ) : fd.file.type.startsWith("video/") ? (
                        <Box component="video" src={fd.preview} sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "contain", bgcolor: "grey.100" }} />
                    ) : (
                        <ICONS.upload sx={{ fontSize: 28, mx: 0.5, color: "text.secondary" }} />
                    )}
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fd.file.name}</Typography>
                    <IconButton onClick={onFileRemove} size="small" sx={{ bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" }, width: 28, height: 28, flexShrink: 0 }}>
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
                    onClick={() => document.getElementById(`file-input-${field.inputName}`)?.click()}
                >
                    <ICONS.upload sx={{ fontSize: 28, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">Choose File or Drag & Drop</Typography>
                    <input id={`file-input-${field.inputName}`} type="file" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = ""; }} />
                </Box>
            )}
            {errorMsg && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{errorMsg}</Typography>}
        </Box>
    );
}

