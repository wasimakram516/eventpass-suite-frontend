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
    Alert,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import { DEFAULT_COUNTRY_CODE, DEFAULT_ISO_CODE, COUNTRY_CODES, getCountryCodeByIsoCode } from "@/utils/countryCodes";
import { normalizePhone } from "@/utils/phoneUtils";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { uploadSingleFile } from "@/utils/mediaUpload";
import { initiatePayment } from "@/services/eventreg/paymentService";
import { computePaymentBreakdown, formatOmr } from "@/utils/paymentBreakdown";


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

    // ── Paid-event: ticket selection ──────────────────────────────────────────
    const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
    const [ticketTypeError, setTicketTypeError] = useState("");

    // ── Paid-event: payment summary dialog ────────────────────────────────────
    const [showPaymentSummary, setShowPaymentSummary] = useState(false);
    const [paymentPayload, setPaymentPayload] = useState(null);
    const [payProcessing, setPayProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    const isPaidEvent = !!event?.isPaid;
    const ticketTypes = event?.ticketTypes || [];

    // Selected ticket + breakdown (live, mirrors public page)
    const selectedTicket = ticketTypes.find(tt => tt._id === selectedTicketTypeId) || null;
    const paymentBreakdown = selectedTicket
        ? computePaymentBreakdown(selectedTicket.price, event?.fees || [], event?.vatPercentage ?? 0)
        : null;

    // ── Ticket-dependent fields ───────────────────────────────────────────────
    const ticketDependentFields = useMemo(() => {
        if (!selectedTicketTypeId || !event?.globalDependentFields?.length || !event?.globalDependentFieldMappings) {
            return [];
        }
        const selectedTt = ticketTypes.find(tt => tt._id === selectedTicketTypeId);
        if (!selectedTt?.name) return [];
        const mappedFieldNames = event.globalDependentFieldMappings[selectedTt.name] || [];
        return event.globalDependentFields
            .filter(f => mappedFieldNames.includes(f.inputName) && f.inputName?.trim() && f.visible !== false)
            .map(f => ({
                inputName: f.inputName,
                inputType: f.inputType || "text",
                required: f.required || false,
                values: f.values || [],
            }));
    }, [selectedTicketTypeId, event, ticketTypes]);

    // ── Existing field helpers ────────────────────────────────────────────────
    const hasCustomFields = useMemo(() => (event?.useCustomFields ?? formFields?.length > 0) && formFields?.length > 0, [event?.useCustomFields, formFields]);

    const filteredFormFields = useMemo(() => {
        if (!formFields || !formFields.length) return [];
        return formFields.filter((f) => f.visible !== false);
    }, [formFields]);

    const classicFields = useMemo(
        () => [
            { inputName: "Full Name", inputType: "text", required: true },
            { inputName: "Email", inputType: "email", required: true },
            { inputName: "Phone", inputType: "phone", required: false },
            { inputName: "Company", inputType: "text", required: false },
        ],
        []
    );

   
    const fieldsToRender = useMemo(
        () => {
            if (mode === "edit") return classicFields;
            return hasCustomFields ? filteredFormFields : classicFields;
        },
        [hasCustomFields, filteredFormFields, classicFields, mode]
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
            return deps.some(d => values[d.parentName] === d.option);
        });
    }, [fieldsToRender, values, hasCustomFields]);

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (fieldsToRender.length > 0) {
            const init = {};
            const initCountryIsoCodes = {};
            if (registration && mode === "edit") {
                // Normalize customFields regardless of Map vs plain object
                const cf = registration.customFields instanceof Map
                    ? Object.fromEntries(registration.customFields)
                    : (registration.customFields || {});

                fieldsToRender.forEach((f) => {
                   
                    const fieldMap = {
                        "Full Name": cf["Full Name"] ?? cf["fullName"] ?? registration.fullName ?? "",
                        "Email":     cf["Email"]     ?? cf["email"]     ?? registration.email     ?? "",
                        "Phone":     cf["Phone"]     ?? cf["phone"]     ?? registration.phone     ?? "",
                        "Company":   cf["Company"]   ?? cf["company"]   ?? registration.company   ?? "",
                    };
                    init[f.inputName] = fieldMap[f.inputName] ?? "";

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
        // Reset ticket + payment state on open/close
        setSelectedTicketTypeId("");
        setTicketTypeError("");
        setShowPaymentSummary(false);
        setPaymentPayload(null);
        setPaymentError("");
    }, [registration, fieldsToRender, hasCustomFields, mode, open, registration?.isoCode]);

    // Init dependent field values when ticket changes
    useEffect(() => {
        if (!ticketDependentFields.length) return;
        setValues(prev => {
            const next = { ...prev };
            ticketDependentFields.forEach(f => {
                if (!(f.inputName in next)) next[f.inputName] = "";
            });
            return next;
        });
    }, [ticketDependentFields]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
        }
        const parentField = fieldsToRender.find(f => f.inputName === key);
        if (parentField?.dependents) {
            try {
                const depMap = JSON.parse(parentField.dependents);
                const allChildIds = new Set();
                Object.values(depMap).forEach(config => { (config.fieldIds || []).forEach(id => allChildIds.add(id)); });
                setValues(prev => { const next = { ...prev }; allChildIds.forEach(id => { next[id] = ""; }); return next; });
            } catch { }
        }
    };

    const handleTicketChange = (newTicketId) => {
        setSelectedTicketTypeId(newTicketId);
        setTicketTypeError("");
        const allDepFieldNames = (event?.globalDependentFields || []).map(f => f.inputName);
        if (allDepFieldNames.length) {
            setValues(prev => {
                const next = { ...prev };
                allDepFieldNames.forEach(name => { if (name in next) next[name] = ""; });
                return next;
            });
        }
    };

    const handleCountryCodeChange = (fieldName, isoCode) => {
        setCountryIsoCodes((prev) => ({ ...prev, [fieldName]: isoCode }));
    };

    const handlePhoneChange = (fieldName, value) => {
        const digitsOnly = value.replace(/\D/g, "");
        setValues((prev) => ({ ...prev, [fieldName]: digitsOnly }));
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
        }
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleFileSelect = (fieldName, file) => {
        if (fileData[fieldName]?.preview) URL.revokeObjectURL(fileData[fieldName].preview);
        const preview = URL.createObjectURL(file);
        setFileData((prev) => ({ ...prev, [fieldName]: { file, preview } }));
        setValues((prev) => ({ ...prev, [fieldName]: file.name }));
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
        }
    };

    const handleFileRemove = (fieldName) => {
        if (fileData[fieldName]?.preview) URL.revokeObjectURL(fileData[fieldName].preview);
        setFileData((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
        setValues((prev) => ({ ...prev, [fieldName]: "" }));
    };

    const isPhoneField = (field) => {
        if (field.inputType === "number") return false;
        if (field.inputType === "phone") return true;
        if (field.inputName === "Phone") return true;
        return false;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validateFields = () => {
        const errors = {};

        if (isPaidEvent && mode === "create" && !selectedTicketTypeId) {
            setTicketTypeError("Please select a ticket type.");
            errors._ticketType = true;
        } else {
            setTicketTypeError("");
        }

        const allFields = [
            ...visibleFields,
            ...(isPaidEvent && mode === "create" ? ticketDependentFields : []),
        ];

        allFields.forEach((f) => {
            const rawValue = values[f.inputName];
            const val = rawValue != null ? String(rawValue).trim() : "";
            const required = f.required || false;
            if (required && !val) errors[f.inputName] = `${f.inputName} is required`;
            if ((f.inputType === "email" || f.inputName === "Email") && val && !isValidEmail(val))
                errors[f.inputName] = "Invalid email address";
            if (isPhoneField(f) && val) {
                const isoCode = countryIsoCodes[f.inputName] || DEFAULT_ISO_CODE;
                const phoneError = validatePhoneNumber(val, isoCode);
                if (phoneError) errors[f.inputName] = phoneError;
            }
        });

        return errors;
    };

    // ── Build normalized payload (shared by free-save and paid-preview) ───────
    const buildNormalizedPayload = async () => {
        const allFields = [
            ...visibleFields,
            ...(isPaidEvent && mode === "create" ? ticketDependentFields : []),
        ];

        const normalizedValues = {};
        allFields.forEach(f => { normalizedValues[f.inputName] = values[f.inputName] ?? ""; });

        // File uploads
        const fileUploadFields = allFields.filter(f => f.inputType === "file" && fileData[f.inputName]?.file);
        if (fileUploadFields.length > 0 && !event?.businessSlug) {
            throw new Error("Business slug not available for file upload.");
        }
        for (const f of fileUploadFields) {
            const url = await uploadSingleFile({
                file: fileData[f.inputName].file,
                businessSlug: event.businessSlug,
                moduleName: "eventreg",
            });
            normalizedValues[f.inputName] = url;
        }

        // Phone normalization
        let phoneIsoCode = null;
        allFields.forEach((f) => {
            if (isPhoneField(f)) {
                const phoneValue = normalizedValues[f.inputName];
                if (phoneValue) {
                    const isoCode = countryIsoCodes[f.inputName] || DEFAULT_ISO_CODE;
                    const country = getCountryCodeByIsoCode(isoCode);
                    const countryCode = country?.code || DEFAULT_COUNTRY_CODE;
                    const fullPhone = phoneValue.startsWith("+") ? phoneValue : `${countryCode}${phoneValue}`;
                    const normalized = normalizePhone(fullPhone);
                    phoneIsoCode = isoCode;
                    if (normalized && normalized.startsWith(countryCode)) {
                        normalizedValues[f.inputName] = normalized.substring(countryCode.length).trim();
                    } else {
                        normalizedValues[f.inputName] = phoneValue.trim();
                    }
                }
            }
        });

        
        if (mode === "edit") {
            const classicKeyMap = {
                "Full Name": "fullName",
                "Email":     "email",
                "Phone":     "phone",
                "Company":   "company",
            };
            Object.entries(classicKeyMap).forEach(([label, key]) => {
                if (label in normalizedValues) {
                    normalizedValues[key] = normalizedValues[label];
                    delete normalizedValues[label];
                }
            });
        }

        if (phoneIsoCode) normalizedValues.isoCode = phoneIsoCode;

        return { normalizedValues, phoneIsoCode };
    };

    // ── Save handler ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        const errors = validateFields();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const { normalizedValues, phoneIsoCode } = await buildNormalizedPayload();

            // ── Paid event: show payment summary dialog instead of saving directly ──
            if (isPaidEvent && mode === "create") {
                const classicKeyMap = {
                    "Full Name": "fullName",
                    "Email": "email",
                    "Phone": "phone",
                    "Company": "company",
                };
                const remappedValues = {};
                Object.entries(normalizedValues).forEach(([key, val]) => {
                    const mappedKey = classicKeyMap[key] ?? key;
                    remappedValues[mappedKey] = val;
                });

                // Prune global dependent fields that don't belong to the current ticket
                const currentDepFieldNames = new Set(ticketDependentFields.map(f => f.inputName));
                const allGlobalDepNames = new Set((event?.globalDependentFields || []).map(f => f.inputName));
                const prunedValues = Object.fromEntries(
                    Object.entries(remappedValues).filter(([key]) => {
                        if (!allGlobalDepNames.has(key)) return true;
                        return currentDepFieldNames.has(key);
                    })
                );

                setPaymentPayload({
                    eventSlug: event?.slug,
                    ticketTypeId: selectedTicketTypeId,
                    lang: "en",
                    ...prunedValues,
                    isoCode: phoneIsoCode,
                });
                setPaymentError("");
                setLoading(false);
                setShowPaymentSummary(true);
                return;
            }

            // ── Free event or edit: call onSave directly ──
            await onSave(normalizedValues);
        } catch (err) {
            console.error(err);
            setFieldErrors({ _global: err.message || "Something went wrong." });
        } finally {
            setLoading(false);
        }
    };

    // ── Payment confirm (Thawani redirect) ────────────────────────────────────
    const handleConfirmPayment = async () => {
        if (!paymentPayload) return;
        setPayProcessing(true);
        setPaymentError("");
        try {
            const result = await initiatePayment(paymentPayload);
            if (!result?.error && result?.sessionUrl) {
                window.location.href = result.sessionUrl;
            } else {
                setPaymentError(result?.message || "Payment initiation failed.");
                setPayProcessing(false);
            }
        } catch (err) {
            setPaymentError(err.message || "Payment initiation failed.");
            setPayProcessing(false);
        }
    };

    // ── Field renderer ────────────────────────────────────────────────────────
    const renderField = (f) => {
        const value = values[f.inputName] ?? "";
        const required = f.required || false;
        const errorMsg = fieldErrors[f.inputName];

        if (f.inputType === "radio") {
            return (
                <Box key={f.inputName} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {f.inputName}{required && <span style={{ color: "red" }}> *</span>}
                    </Typography>
                    <RadioGroup row name={f.inputName} value={value} onChange={(e) => handleChange(f.inputName, e.target.value)}>
                        {f.values?.map((opt) => (
                            <FormControlLabel key={`${f.inputName}-${opt}`} value={opt} control={<Radio size="small" />} label={opt} />
                        ))}
                    </RadioGroup>
                    {errorMsg && <FormHelperText error sx={{ mt: 0.5 }}>{errorMsg}</FormHelperText>}
                </Box>
            );
        }

        if (["list", "select", "dropdown"].includes(f.inputType)) {
            return (
                <FormControl key={f.inputName} fullWidth size="small" required={required} error={!!errorMsg}>
                    <InputLabel>{f.inputName}</InputLabel>
                    <Select value={value} onChange={(e) => handleChange(f.inputName, e.target.value)} label={f.inputName}>
                        {f.values?.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </Select>
                    {errorMsg && <FormHelperText>{errorMsg}</FormHelperText>}
                </FormControl>
            );
        }

        if (f.inputType === "number") {
            return (
                <TextField key={f.inputName} label={f.inputName} value={value}
                    onChange={(e) => handleChange(f.inputName, e.target.value)}
                    fullWidth size="small" required={required} error={!!errorMsg} helperText={errorMsg} type="number" />
            );
        }

        if (f.inputType === "country") {
            return (
                <Box key={f.inputName} sx={{ mb: 2 }}>
                    <CountryPicker label={f.inputName} value={value} onChange={(iso) => handleChange(f.inputName, iso)}
                        required={required} error={!!errorMsg} helperText={errorMsg || ""} />
                </Box>
            );
        }

        if (f.inputType === "file") {
            return (
                <ModalFileUploadField key={f.inputName} field={f} fd={fileData[f.inputName]}
                    fieldLabel={f.inputName} errorMsg={errorMsg} required={required}
                    onFileSelect={(file) => handleFileSelect(f.inputName, file)}
                    onFileRemove={() => handleFileRemove(f.inputName)} />
            );
        }

        const fieldIsPhone = isPhoneField(f);
        const useInternationalNumbers = event?.useInternationalNumbers !== false;

        if (fieldIsPhone) {
            const isoCode = countryIsoCodes[f.inputName] || DEFAULT_ISO_CODE;
            return (
                <TextField key={f.inputName} label={f.inputName} value={value || ""}
                    onChange={(e) => handlePhoneChange(f.inputName, e.target.value)}
                    fullWidth size="small" required={required} error={!!errorMsg}
                    helperText={errorMsg || "Enter your phone number"} type="tel"
                    slotProps={{
                        input: {
                            startAdornment: (
                                <CountryCodeSelector value={isoCode}
                                    onChange={(iso) => handleCountryCodeChange(f.inputName, iso)}
                                    disabled={!useInternationalNumbers} dir="ltr" />
                            ),
                        }
                    }} />
            );
        }

        return (
            <TextField key={f.inputName} label={f.inputName} value={value}
                onChange={(e) => handleChange(f.inputName, e.target.value)}
                fullWidth size="small" required={required} error={!!errorMsg} helperText={errorMsg}
                type={f.inputType === "number" ? "number" : f.inputType === "email" ? "email" : "text"} />
        );
    };

    // ── Labels ────────────────────────────────────────────────────────────────
    const displayTitle = title || (mode === "create" ? "Create Registration" : "Edit Registration");
    const saveButtonText = mode === "create"
        ? (isPaidEvent ? "Proceed to Payment" : "Create")
        : "Save Changes";

    return (
        <>
            {/* ── Main form dialog ─────────────────────────────────────────── */}
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>{displayTitle}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {fieldErrors._global && (
                            <Alert severity="error">{fieldErrors._global}</Alert>
                        )}

                        {/* Ticket selector — paid, create mode only */}
                        {isPaidEvent && mode === "create" && ticketTypes.length > 0 && (
                            <FormControl fullWidth size="small" error={!!ticketTypeError}>
                                <InputLabel>Select a Ticket *</InputLabel>
                                <Select
                                    value={selectedTicketTypeId}
                                    label="Select a Ticket *"
                                    onChange={(e) => handleTicketChange(e.target.value)}
                                    renderValue={(val) => {
                                        const tt = ticketTypes.find(x => x._id === val);
                                        if (!tt) return "";
                                        return (
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>{tt.name}</Typography>
                                                <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
                                                    {tt.price} OMR
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {ticketTypes.map((tt) => {
                                        const isSoldOut = tt.capacity !== null && tt.sold >= tt.capacity;
                                        const remaining = tt.capacity !== null ? tt.capacity - (tt.sold || 0) : null;
                                        const isLowStock = remaining !== null && remaining > 0 && remaining <= 20;
                                        return (
                                            <MenuItem key={tt._id} value={tt._id} disabled={isSoldOut}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2, py: 0.5 }}>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600}>{tt.name}</Typography>
                                                        {tt.description && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
                                                                {tt.description}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="caption" sx={{
                                                            display: "block",
                                                            color: isSoldOut ? "error.main" : isLowStock ? "warning.main" : "text.secondary",
                                                            fontWeight: isSoldOut || isLowStock ? 600 : 400,
                                                        }}>
                                                            {isSoldOut ? "Sold Out" : remaining !== null ? `${remaining} available` : "Unlimited"}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={700}
                                                        color={isSoldOut ? "text.disabled" : "primary.main"}
                                                        sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                                                        {isSoldOut ? "—" : `${tt.price} OMR`}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                                {ticketTypeError && <FormHelperText>{ticketTypeError}</FormHelperText>}
                            </FormControl>
                        )}

                        {/* Ticket-dependent fields — create mode only */}
                        {isPaidEvent && mode === "create" && ticketDependentFields.map((f) => renderField(f))}

                        {/* Main form fields */}
                        {visibleFields.map((f) => renderField(f))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={onClose} disabled={loading}
                        startIcon={<ICONS.cancel />} sx={getStartIconSpacing("ltr")}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : (isPaidEvent && mode === "create" ? <ICONS.payment /> : <ICONS.save />)}
                        sx={getStartIconSpacing("ltr")}>
                        {loading ? "Please wait…" : saveButtonText}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Payment summary dialog (mirrors public registration page) ── */}
            <Dialog
                open={showPaymentSummary}
                onClose={() => !payProcessing && setShowPaymentSummary(false)}
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { borderRadius: 4, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.22)" },
                    },
                }}
            >
                {/* Header band */}
                <Box sx={{
                    background: "linear-gradient(135deg, #0f3d57 0%, #14708a 100%)",
                    color: "#fff", px: 3, pt: 3, pb: 2.5,
                    display: "flex", alignItems: "center", gap: 1.5,
                }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                        backgroundColor: "rgba(255,255,255,0.16)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <ICONS.list sx={{ fontSize: 24, color: "#fff" }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                            Payment Summary
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.4, display: "block" }}>
                            Please review the details below before proceeding to the payment gateway.
                        </Typography>
                    </Box>
                </Box>

                <DialogContent sx={{ px: 3, pt: 2.5, pb: 2 }}>
                    {paymentBreakdown && (
                        <Box>
                            {/* Ticket base */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body1" fontWeight={700} noWrap>
                                        {selectedTicket?.name || "Ticket"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Ticket</Typography>
                                </Box>
                                <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: "nowrap", pl: 1 }}>
                                    {formatOmr(paymentBreakdown.base, "OMR")}
                                </Typography>
                            </Box>

                            {/* Fees */}
                            {paymentBreakdown.feeLines.map((fee, i) => (
                                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {fee.name} <Box component="span" sx={{ opacity: 0.7 }}>· {fee.percentage}%</Box>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", pl: 1 }}>
                                        {formatOmr(fee.amount, "OMR")}
                                    </Typography>
                                </Box>
                            ))}

                            {/* Subtotal */}
                            {(paymentBreakdown.feeLines.length > 0 || paymentBreakdown.vatAmount > 0) && (
                                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.9, mt: 0.5, borderTop: "1px dashed", borderColor: "divider" }}>
                                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap", pl: 1 }}>
                                        {formatOmr(paymentBreakdown.subtotal, "OMR")}
                                    </Typography>
                                </Box>
                            )}

                            {/* VAT */}
                            {paymentBreakdown.vatAmount > 0 && (
                                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        VAT <Box component="span" sx={{ opacity: 0.7 }}>· {paymentBreakdown.vatPercentage}%</Box>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", pl: 1 }}>
                                        {formatOmr(paymentBreakdown.vatAmount, "OMR")}
                                    </Typography>
                                </Box>
                            )}

                            {/* Total */}
                            <Box sx={{
                                mt: 1.5, px: 2, py: 1.5, borderRadius: 2.5,
                                backgroundColor: "rgba(20,112,138,0.08)",
                                border: "1px solid rgba(20,112,138,0.2)",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                                        Amount due
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={800}>Total</Typography>
                                </Box>
                                <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ whiteSpace: "nowrap", pl: 1 }}>
                                    {formatOmr(paymentBreakdown.total, "OMR")}
                                </Typography>
                            </Box>

                            {/* Trust note */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mt: 2 }}>
                                <ICONS.verified sx={{ fontSize: 16, color: "success.main" }} />
                                <Typography variant="caption" color="text.secondary">
                                    Secure payment via Thawani
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {paymentError && <Alert severity="error" sx={{ mt: 2 }}>{paymentError}</Alert>}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
                    <Button
                        onClick={() => setShowPaymentSummary(false)}
                        disabled={payProcessing}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, color: "text.secondary" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmPayment}
                        disabled={payProcessing || !paymentBreakdown}
                        startIcon={!payProcessing ? <ICONS.payment /> : undefined}
                        sx={{
                            textTransform: "none", fontWeight: 700, borderRadius: 2.5,
                            px: 3, py: 1.1,
                            boxShadow: "0 8px 20px rgba(20,112,138,0.3)",
                            ...getStartIconSpacing("ltr"),
                        }}
                    >
                        {payProcessing ? <CircularProgress size={22} color="inherit" /> : "Confirm & Pay"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function ModalFileUploadField({ field, fd, fieldLabel, errorMsg, required, onFileSelect, onFileRemove }) {
    const [dragOver, setDragOver] = useState(false);
    return (
        <Box sx={{ mb: 2, textAlign: "left" }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {fieldLabel}{required && <span style={{ color: "red" }}> *</span>}
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
                        borderRadius: 3, py: 3,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                        cursor: "pointer",
                        bgcolor: dragOver ? "action.hover" : "transparent",
                        transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onClick={() => document.getElementById(`file-input-${field.inputName}`)?.click()}
                >
                    <ICONS.upload sx={{ fontSize: 28, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">Choose File or Drag & Drop</Typography>
                    <input id={`file-input-${field.inputName}`} type="file" hidden
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = ""; }} />
                </Box>
            )}
            {errorMsg && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{errorMsg}</Typography>}
        </Box>
    );
}