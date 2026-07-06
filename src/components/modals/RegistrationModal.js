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
    ListSubheader,
    InputAdornment,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import SearchableSelect from "@/components/SearchableSelect";
import { DEFAULT_COUNTRY_CODE, DEFAULT_ISO_CODE, COUNTRY_CODES, getCountryCodeByIsoCode } from "@/utils/countryCodes";
import { normalizePhone } from "@/utils/phoneUtils";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { uploadSingleFile } from "@/utils/mediaUpload";
import { initiatePayment } from "@/services/eventreg/paymentService";
import { computePaymentBreakdown, formatOmr } from "@/utils/paymentBreakdown";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
    en: {
        createTitle: "Create Registration",
        editTitle: "Edit Registration",
        selectTicket: "Select a Ticket",
        ticket: "Ticket",
        ticketLockedPaid: "The ticket can't be changed once the payment is completed.",
        soldOut: "Sold Out",
        available: "available",
        unlimited: "Unlimited",
        viewCurrentFile: "View current file",
        chooseFile: "Choose File or Drag & Drop",
        replaceFile: "Replace File or Drag & Drop",
        cancel: "Cancel",
        create: "Create",
        proceedToPayment: "Proceed to Payment",
        saveChanges: "Save Changes",
        registrationFailed: "Registration failed.",
        duplicatePaidTitle: "Already registered",
        duplicatePaidMessage: "This attendee already has a confirmed registration for this event with the same email or phone number. We've re-sent their ticket and confirmation email.",
        duplicatePendingTitle: "Payment outstanding",
        duplicatePendingMessage: "This attendee already has a registration in progress for this event, and payment hasn't been completed yet. We've re-sent the secure payment link to their email.",
        duplicatePendingExpiry: "This link will expire on:",
        duplicatePendingAutoDelete: "If payment isn't completed before then, this registration will be automatically removed and can be created again.",
        resumePaymentNow: "Open Payment Link",
    },
    ar: {
        createTitle: "إنشاء تسجيل",
        editTitle: "تعديل التسجيل",
        selectTicket: "اختر التذكرة",
        ticket: "التذكرة",
        ticketLockedPaid: "لا يمكن تغيير التذكرة بعد إتمام الدفع.",
        soldOut: "نفدت",
        available: "متاح",
        unlimited: "غير محدود",
        viewCurrentFile: "عرض الملف الحالي",
        chooseFile: "اختر ملفًا أو اسحبه وأفلته",
        replaceFile: "استبدل الملف أو اسحبه وأفلته",
        cancel: "إلغاء",
        create: "إنشاء",
        proceedToPayment: "المتابعة للدفع",
        saveChanges: "حفظ التغييرات",
        registrationFailed: "فشل التسجيل.",
        duplicatePaidTitle: "مسجَّل بالفعل",
        duplicatePaidMessage: "يوجد بالفعل تسجيل مؤكد لهذا الحاضر لهذه الفعالية بنفس البريد الإلكتروني أو رقم الهاتف. لقد أعدنا إرسال التذكرة وتأكيد التسجيل إلى بريده الإلكتروني.",
        duplicatePendingTitle: "الدفع لم يكتمل بعد",
        duplicatePendingMessage: "يوجد بالفعل تسجيل قيد الإجراء لهذا الحاضر لهذه الفعالية، ولم تكتمل عملية الدفع بعد. لقد أعدنا إرسال رابط الدفع الآمن إلى بريده الإلكتروني.",
        duplicatePendingExpiry: "ستنتهي صلاحية الرابط في:",
        duplicatePendingAutoDelete: "إذا لم تكتمل عملية الدفع قبل ذلك، ستتم إزالة هذا التسجيل تلقائيًا، ويمكن إنشاؤه مرة أخرى.",
        resumePaymentNow: "فتح رابط الدفع",
    },
};

export default function RegistrationModal({
    open,
    onClose,
    registration,
    formFields,
    onSave,
    onPaymentInitiated,
    mode = "edit",
    title,
    event,
}) {
    const { t, dir } = useI18nLayout(translations);
    const [values, setValues] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [countryIsoCodes, setCountryIsoCodes] = useState({});
    const [fileData, setFileData] = useState({});

    // ── Paid-event: ticket selection ──────────────────────────────────────────
    const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
    const [ticketTypeError, setTicketTypeError] = useState("");
    const [ticketSearch, setTicketSearch] = useState("");

    // ── Paid-event: payment summary dialog ────────────────────────────────────
    const [showPaymentSummary, setShowPaymentSummary] = useState(false);
    const [paymentPayload, setPaymentPayload] = useState(null);
    const [payProcessing, setPayProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState("");
    // Set when initiatePayment reports an existing registration (paid or
    // still-pending) for the same email/phone, instead of creating a new one.
    const [duplicateNotice, setDuplicateNotice] = useState(null);

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
        () => (hasCustomFields ? filteredFormFields : classicFields),
        [hasCustomFields, filteredFormFields, classicFields]
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

                    // Identity labels resolve from customFields → top-level (handles both
                    // custom-form events, where identity lives in customFields, and classic
                    // events, where it lives top-level). Any other field (custom or
                    // ticket-dependent) reads its value straight from customFields by name.
                    const identityMap = {
                        "Full Name": cf["Full Name"] ?? cf["fullName"] ?? registration.fullName ?? "",
                        "Email": cf["Email"] ?? cf["email"] ?? registration.email ?? "",
                        "Phone": cf["Phone"] ?? cf["phone"] ?? registration.phone ?? "",
                        "Company": cf["Company"] ?? cf["company"] ?? registration.company ?? "",
                    };
                    init[f.inputName] = (f.inputName in identityMap)
                        ? identityMap[f.inputName]
                        : (cf[f.inputName] ?? "");

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

                // Carry over any remaining customFields (ticket-dependent fields, incl.
                // uploaded file URLs) so they pre-fill and, crucially, are preserved on
                // save instead of being wiped. Identity/base fields are already in `init`.
                Object.entries(cf).forEach(([k, v]) => {
                    if (!(k in init)) init[k] = v ?? "";
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
        // Reset ticket + payment state on open/close. In edit mode, preselect the
        // registration's existing ticket so its dependent fields resolve and the
        // (read-only / editable-when-pending) selector shows the right value.
        // Preselect by id when available, otherwise fall back to matching the stored
        // ticket name (the registration always carries ticketTypeName, even if an
        // older API response didn't include ticketTypeId).
        const preselectedTicketId =
            mode === "edit" && registration
                ? String(
                    registration.ticketTypeId ||
                    ticketTypes.find((tt) => tt.name === registration.ticketTypeName)?._id ||
                    ""
                )
                : "";
        setSelectedTicketTypeId(preselectedTicketId);
        setTicketTypeError("");
        setShowPaymentSummary(false);
        setPaymentPayload(null);
        setPaymentError("");
    }, [registration, fieldsToRender, hasCustomFields, mode, open, registration?.isoCode]);

    // Init dependent field values when ticket changes. In edit mode, seed them from
    // the registration's customFields so existing answers (incl. uploaded files) show.
    useEffect(() => {
        if (!ticketDependentFields.length) return;
        const cf =
            mode === "edit" && registration
                ? (registration.customFields instanceof Map
                    ? Object.fromEntries(registration.customFields)
                    : (registration.customFields || {}))
                : {};
        setValues(prev => {
            const next = { ...prev };
            ticketDependentFields.forEach(f => {
                if (!(f.inputName in next) || next[f.inputName] === "") {
                    next[f.inputName] = cf[f.inputName] ?? "";
                }
            });
            return next;
        });
    }, [ticketDependentFields, mode, registration]);

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
            // Dependent fields are part of the form in both create and edit (edit lets
            // staff fix answers / re-upload files). ticketDependentFields is [] when
            // no ticket is selected, so this is a no-op for non-paid events.
            ...(isPaidEvent ? ticketDependentFields : []),
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
    // ── Build normalized payload (shared by free-save and paid-preview) ───────
    const buildNormalizedPayload = async () => {
        const allFields = [
            ...visibleFields,
            // Dependent fields are part of the form in both create and edit (edit lets
            // staff fix answers / re-upload files). ticketDependentFields is [] when
            // no ticket is selected, so this is a no-op for non-paid events.
            ...(isPaidEvent ? ticketDependentFields : []),
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

        // Note: we intentionally do NOT remap field labels (e.g. "Full Name" → fullName)
        // here. The frontend sends values by their field label and lets the backend own
        // the custom-vs-classic routing (top-level identity vs customFields).
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
            const remappedValues = { ...normalizedValues };
            // ── Paid event: show payment summary dialog instead of saving directly ──
            if (isPaidEvent && mode === "create") {

                const classicFallbacks = {
                    "Full Name": "fullName",
                    "Email": "email",
                    "Phone": "phone",
                    "Company": "company",
                };
                Object.entries(classicFallbacks).forEach(([label, camelKey]) => {
                    if (!remappedValues[camelKey]) {
                        // Try raw values by label (classic form) or camelCase key
                        const raw = values[label] ?? values[camelKey] ?? "";
                        if (raw) remappedValues[camelKey] = raw;
                    }
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
            // For a paid edit, just send the selected ticket. The backend decides what
            // to do with it (no-op if unchanged, regenerate the payment if pending,
            // reject if already paid) — the frontend doesn't replicate that logic.
            if (mode === "edit" && isPaidEvent && selectedTicketTypeId) {
                normalizedValues.ticketTypeId = selectedTicketTypeId;
            }
            await onSave(normalizedValues);
        } catch (err) {
            console.error(err);
            setFieldErrors({ _global: err.message || "Something went wrong." });
        } finally {
            setLoading(false);
        }
    };

    // ── Payment confirm (Thawani) ─────────────────────────────────────────────
    // Admin/CMS flow: initiatePayment creates the pending registration server-side
    // and returns the gateway link. We do NOT redirect or open a tab here — we
    // return the admin to the registrations list, where the new pending row
    // exposes a "Copy payment link" action. All user messaging (success, duplicate,
    // error) is surfaced by withApiHandler from the backend response; here we only
    // drive the UI based on the response flags.
    const handleConfirmPayment = async () => {
        if (!paymentPayload) return;
        setPayProcessing(true);
        setPaymentError("");
        setDuplicateNotice(null);
        const result = await initiatePayment(paymentPayload);

        setPayProcessing(false);

        const duplicateStatus = result?.duplicateStatus || result?.data?.duplicateStatus;
        if (!result?.error && duplicateStatus) {
            // An existing registration already covers this email/phone — show a
            // clear info message (the backend already re-sent the relevant email)
            // instead of treating it like a failed attempt.
            setDuplicateNotice({
                status: duplicateStatus,
                expiresAt: result?.expiresAt || result?.data?.expiresAt || null,
                sessionUrl: result?.sessionUrl || result?.data?.sessionUrl || null,
            });
            return;
        }

        if (result?.created) {
            setShowPaymentSummary(false);
            onPaymentInitiated?.();
        } else {
            setPaymentError(result?.message || t.registrationFailed);
        }
    };

    // Formats a payment-link expiry using the staff member's own browser
    // timezone (display only — no server-side timezone detection needed).
    const formatExpiryLocal = (expiresAt) => {
        if (!expiresAt) return "";
        try {
            return new Intl.DateTimeFormat(dir === "rtl" ? "ar-EG" : "en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "shortOffset",
            }).format(new Date(expiresAt));
        } catch {
            return new Date(expiresAt).toLocaleString();
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
                <SearchableSelect
                    key={f.inputName}
                    name={f.inputName}
                    label={f.inputName}
                    value={value}
                    onChange={(e) => handleChange(f.inputName, e.target.value)}
                    options={f.values || []}
                    required={required}
                    error={!!errorMsg}
                    helperText={errorMsg || ""}
                    size="small"
                />
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
                    currentValue={typeof value === "string" ? value : ""}
                    viewLabel={t.viewCurrentFile} chooseLabel={t.chooseFile} replaceLabel={t.replaceFile}
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
                    helperText={errorMsg || ""} type="tel"
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
    const displayTitle = title || (mode === "create" ? t.createTitle : t.editTitle);
    const saveButtonText = mode === "create"
        ? (isPaidEvent ? t.proceedToPayment : t.create)
        : t.saveChanges;

    return (
        <>
            {/* ── Main form dialog ─────────────────────────────────────────── */}
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir={dir}>
                <DialogTitle>{displayTitle}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {fieldErrors._global && (
                            <Alert severity="error">{fieldErrors._global}</Alert>
                        )}

                        {/* Ticket selector — paid events (create, and edit). In edit it is
                            read-only once paid; editable while the payment is still pending. */}
                        {isPaidEvent && ticketTypes.length > 0 && (
                            <FormControl fullWidth size="small" error={!!ticketTypeError}>
                                <InputLabel>{mode === "create" ? `${t.selectTicket} *` : t.ticket}</InputLabel>
                                <Select
                                    value={selectedTicketTypeId}
                                    label={mode === "create" ? `${t.selectTicket} *` : t.ticket}
                                    disabled={mode === "edit" && registration?.paymentStatus === "paid"}
                                    onChange={(e) => handleTicketChange(e.target.value)}
                                    onClose={() => setTicketSearch("")}
                                    sx={{ "& .MuiSelect-select": { display: "flex", justifyContent: "flex-start" } }}
                                    MenuProps={{ autoFocus: false }}
                                    slotProps={{ paper: { sx: { maxHeight: 360 } } }}
                                    renderValue={(val) => {
                                        const tt = ticketTypes.find(x => x._id === val);
                                        if (!tt) return "";
                                        return (
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, width: "100%" }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {tt.name}
                                                </Typography>
                                                <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                                                    {tt.price} OMR
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {ticketTypes.length > 5 && (
                                        <ListSubheader sx={{ bgcolor: "background.paper", pt: 1, pb: 0.5 }}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Search tickets…"
                                                value={ticketSearch}
                                                onChange={(e) => setTicketSearch(e.target.value)}
                                                onKeyDown={(e) => e.stopPropagation()}
                                                autoFocus
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <ICONS.search fontSize="small" />
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                }}
                                            />
                                        </ListSubheader>
                                    )}
                                    {ticketTypes.map((tt) => {
                                        const isSoldOut = tt.capacity !== null && tt.sold >= tt.capacity;
                                        const remaining = tt.capacity !== null ? tt.capacity - (tt.sold || 0) : null;
                                        const isLowStock = remaining !== null && remaining > 0 && remaining <= 20;
                                        const q = ticketSearch.toLowerCase().trim();
                                        const matches = !q || tt.name.toLowerCase().includes(q);
                                        return (
                                            <MenuItem
                                                key={tt._id}
                                                value={tt._id}
                                                disabled={isSoldOut}
                                                style={{ display: ticketTypes.length > 5 ? (matches ? "flex" : "none") : "flex" }}
                                                sx={{ "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" } }}
                                            >
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2, py: 0.5 }}>
                                                    {/* Menu Paper width tracks the anchor field's (often wide) width via
                                                        an inline minWidth MUI sets, which beats a CSS maxWidth on the
                                                        Paper — so the wrap is forced here at the content level instead. */}
                                                    <Box sx={{ minWidth: 0, maxWidth: 320 }}>
                                                        <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                                            {tt.name}
                                                        </Typography>
                                                        {tt.description && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3, whiteSpace: "normal", wordBreak: "break-word" }}>
                                                                {tt.description}
                                                            </Typography>
                                                        )}
                                                        {(isSoldOut || remaining !== null) && (
                                                            <Typography variant="caption" sx={{
                                                                display: "block",
                                                                color: isSoldOut ? "error.main" : isLowStock ? "warning.main" : "text.secondary",
                                                                fontWeight: isSoldOut || isLowStock ? 600 : 400,
                                                            }}>
                                                                {isSoldOut ? t.soldOut : `${remaining} ${t.available}`}
                                                            </Typography>
                                                        )}
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
                                {mode === "edit" && registration?.paymentStatus === "paid" && (
                                    <FormHelperText>{t.ticketLockedPaid}</FormHelperText>
                                )}
                            </FormControl>
                        )}

                        {/* Ticket-dependent fields — create mode only */}
                        {isPaidEvent && ticketDependentFields.map((f) => renderField(f))}

                        {/* Main form fields */}
                        {visibleFields.map((f) => renderField(f))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={onClose} disabled={loading}
                        startIcon={<ICONS.cancel />} sx={getStartIconSpacing("ltr")}>
                        {t.cancel}
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
                onClose={() => { if (!payProcessing) { setShowPaymentSummary(false); setDuplicateNotice(null); } }}
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

                    {duplicateNotice ? (
                        <Box
                            sx={{
                                backgroundColor: "#e3f2fd",
                                borderLeft: dir === "rtl" ? "none" : "4px solid #1976d2",
                                borderRight: dir === "rtl" ? "4px solid #1976d2" : "none",
                                borderRadius: 1,
                                p: 2,
                                mt: 2,
                                textAlign: dir === "rtl" ? "right" : "left",
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                {duplicateNotice.status === "paid" ? t.duplicatePaidTitle : t.duplicatePendingTitle}
                            </Typography>
                            <Typography variant="body2">
                                {duplicateNotice.status === "paid" ? t.duplicatePaidMessage : t.duplicatePendingMessage}
                            </Typography>
                            {duplicateNotice.status === "pending" && duplicateNotice.expiresAt && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>{t.duplicatePendingExpiry}</strong> {formatExpiryLocal(duplicateNotice.expiresAt)}
                                </Typography>
                            )}
                            {duplicateNotice.status === "pending" && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {t.duplicatePendingAutoDelete}
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        paymentError && <Alert severity="error" sx={{ mt: 2 }}>{paymentError}</Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
                    {duplicateNotice ? (
                        <>
                            <Button
                                onClick={() => { setShowPaymentSummary(false); setDuplicateNotice(null); }}
                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, color: "text.secondary" }}
                            >
                                {t.cancel}
                            </Button>
                            {duplicateNotice.status === "pending" && duplicateNotice.sessionUrl && (
                                <Button
                                    variant="contained"
                                    onClick={() => window.open(duplicateNotice.sessionUrl, "_blank", "noopener,noreferrer")}
                                    startIcon={<ICONS.payment />}
                                    sx={{
                                        textTransform: "none", fontWeight: 700, borderRadius: 2.5,
                                        px: 3, py: 1.1,
                                        boxShadow: "0 8px 20px rgba(20,112,138,0.3)",
                                        ...getStartIconSpacing("ltr"),
                                    }}
                                >
                                    {t.resumePaymentNow}
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={() => setShowPaymentSummary(false)}
                                disabled={payProcessing}
                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, color: "text.secondary" }}
                            >
                                {t.cancel}
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
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
}

function ModalFileUploadField({ field, fd, fieldLabel, errorMsg, required, currentValue, viewLabel, chooseLabel, replaceLabel, onFileSelect, onFileRemove }) {
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
                <>
                    {currentValue && (
                        <Button size="small" variant="text"
                            onClick={() => window.open(currentValue, "_blank")}
                            sx={{ mb: 1, textTransform: "none", px: 0 }}>
                            {viewLabel}
                        </Button>
                    )}
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
                        <Typography variant="body2" color="text.secondary">{currentValue ? replaceLabel : chooseLabel}</Typography>
                        <input id={`file-input-${field.inputName}`} type="file" hidden
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = ""; }} />
                    </Box>
                </>
            )}
            {errorMsg && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{errorMsg}</Typography>}
        </Box>
    );
}