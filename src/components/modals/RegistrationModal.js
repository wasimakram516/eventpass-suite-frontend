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
    InputAdornment,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function RegistrationModal({
    open,
    onClose,
    registration,
    formFields,
    onSave,
    mode = "edit",
    title,
}) {
    const [values, setValues] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const hasCustomFields = useMemo(() => formFields && formFields.length > 0, [formFields]);

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
        () => (hasCustomFields ? filteredFormFields : classicFields),
        [hasCustomFields, filteredFormFields, classicFields]
    );

    useEffect(() => {
        if (fieldsToRender.length > 0) {
            const init = {};
            if (registration && mode === "edit") {
                fieldsToRender.forEach((f) => {
                    if (hasCustomFields) {
                        init[f.inputName] =
                            registration.customFields?.[f.inputName] ||
                            registration[f.inputName] ||
                            "";
                    } else {
                        const fieldMap = {
                            "Full Name": registration.fullName,
                            Email: registration.email,
                            Phone: registration.phone,
                            Company: registration.company,
                        };
                        init[f.inputName] = fieldMap[f.inputName] || "";
                    }
                });
            } else {
                fieldsToRender.forEach((f) => {
                    init[f.inputName] = "";
                });
            }
            setValues(init);
            setFieldErrors({});
            setLoading(false);
        }
    }, [registration, fieldsToRender, hasCustomFields, mode, open]);

    const handleChange = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateFields = () => {
        const errors = {};
        fieldsToRender.forEach((f) => {
            const val = values[f.inputName]?.trim();
            const required = f.required || false;

            if (required && !val) {
                errors[f.inputName] = `${f.inputName} is required`;
            }

            if ((f.inputType === "email" || f.inputName === "Email") && val && !isValidEmail(val)) {
                errors[f.inputName] = "Invalid email address";
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
            await onSave(values);
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

        const isPhoneField = f.inputName?.toLowerCase().includes("phone") || f.inputType === "phone";

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
                helperText={errorMsg || ""}
                type={f.inputType === "number" ? "number" : f.inputType === "email" ? "email" : "text"}
                InputProps={
                    isPhoneField
                        ? {
                            startAdornment: <InputAdornment position="start">+92</InputAdornment>,
                        }
                        : undefined
                }
            />
        );
    };

    const displayTitle = title || (mode === "create" ? "Create Registration" : "Edit Registration");
    const saveButtonText = mode === "create" ? "Create" : "Save Changes";

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{displayTitle}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    {fieldsToRender.map((f) => renderField(f))}
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

