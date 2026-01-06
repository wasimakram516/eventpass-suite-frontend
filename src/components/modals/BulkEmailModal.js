"use client";

import React, { useRef, useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    TextField,
    Box,
    Typography,
    Stack,
    FormControl,
    Select,
    MenuItem,
    
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import RichTextEditor from "@/components/RichTextEditor";

const translations = {
    en: {
        title: "Send Notifications",
        messageType: "Message Type",
        default: "Default",
        custom: "Custom",
        subject: "Subject",
        body: "Body",
        sendEmail: "Send Email",
        sendWhatsApp: "Send WhatsApp",
        placeholderSubject: "Enter email subject",
        placeholderBody: "Enter email body...",
        confirmed: "Confirmed",
        notConfirmed: "Not Confirmed",
        approved: "Approved",
        rejected: "Rejected",
        pending: "Pending",
        all: "All",
        filterByStatus: "Filter by Status",
        emailSent: "Email Sent",
        emailNotSent: "Email Not Sent",
        whatsappSent: "WhatsApp Sent",
        whatsappNotSent: "WhatsApp Not Sent",
        defaultEmailInfo: "When sending default bulk messages, the system will use the default Email and WhatsApp invitation templates.",
        uploadFile: "Upload File",
        attachedFile: "Attached File",
        removeFile: "Remove",
        uploadHelperText: "Optional: Attach media files (Image, Video, or PDF) to include with your message",
    },
    ar: {
        title: "إرسال الإشعارات",
        messageType: "نوع الرسالة",
        default: "افتراضي",
        custom: "مخصص",
        subject: "الموضوع",
        body: "المحتوى",
        sendEmail: "إرسال بريد إلكتروني",
        sendWhatsApp: "إرسال واتساب",
        placeholderSubject: "أدخل موضوع البريد الإلكتروني",
        placeholderBody: "أدخل محتوى البريد الإلكتروني...",
        confirmed: "مؤكد",
        notConfirmed: "غير مؤكد",
        approved: "موافق عليه",
        rejected: "مرفوض",
        pending: "قيد الانتظار",
        all: "الكل",
        filterByStatus: "تصفية حسب الحالة",
        emailSent: "تم إرسال البريد",
        emailNotSent: "لم يتم إرسال البريد",
        whatsappSent: "تم إرسال واتساب",
        whatsappNotSent: "لم يتم إرسال واتساب",
        defaultEmailInfo: "عند إرسال رسائل جماعية افتراضية، سيستخدم النظام قوالب الدعوة الافتراضية للبريد الإلكتروني والواتساب.",
        uploadFile: "رفع ملف",
        attachedFile: "الملف المرفق",
        removeFile: "إزالة",
        uploadHelperText: "اختياري: يمكنك إرفاق ملفات الوسائط (صورة أو فيديو أو PDF) لتضمينها مع رسالتك",
    },
};

const BulkEmailModal = ({
    open,
    onClose,
    onSendEmail,
    onSendWhatsApp,
    sendingEmails = false,
    isApprovalBased = true,
    useApprovedRejected = false,
}) => {
    const { t, dir } = useI18nLayout(translations);
    const [emailType, setEmailType] = useState("default");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [subjectError, setSubjectError] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setSelectedFilter("all");
    }, [isApprovalBased]);

    useEffect(() => {
        if (!open) {
            setEmailType("default");
            setSubject("");
            setBody("");
            setSelectedFilter("all");
            setSubjectError(false);
            setAttachedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [open]);

    const handleClose = () => {
        setEmailType("default");
        setSubject("");
        setBody("");
        setSelectedFilter("all");
        setSubjectError(false);
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onClose();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendEmail = () => {
        if (emailType === "custom" && !subject.trim()) {
            setSubjectError(true);
            return;
        }
        setSubjectError(false);

        // Convert selectedFilter to individual filter states
        const filterStates = selectedFilter === "all"
            ? { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "all" }
            : selectedFilter === "approved"
                ? { statusFilter: "approved", emailSentFilter: "all", whatsappSentFilter: "all" }
                : selectedFilter === "rejected"
                    ? { statusFilter: "rejected", emailSentFilter: "all", whatsappSentFilter: "all" }
                    : selectedFilter === "confirmed"
                        ? { statusFilter: "confirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
                        : selectedFilter === "notConfirmed"
                            ? { statusFilter: "notConfirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
                            : selectedFilter === "pending"
                                ? { statusFilter: "pending", emailSentFilter: "all", whatsappSentFilter: "all" }
                                : selectedFilter === "emailSent"
                                    ? { statusFilter: "all", emailSentFilter: "sent", whatsappSentFilter: "all" }
                                    : selectedFilter === "emailNotSent"
                                        ? { statusFilter: "all", emailSentFilter: "notSent", whatsappSentFilter: "all" }
                                        : selectedFilter === "whatsappSent"
                                            ? { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "sent" }
                                            : { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "notSent" };

        onSendEmail({
            type: emailType,
            subject: emailType === "custom" ? subject : undefined,
            body: emailType === "custom" ? body : undefined,
            file: emailType === "custom" ? attachedFile : undefined,
            ...filterStates,
        });
    };

    const handleSendWhatsApp = () => {
        if (emailType === "custom" && !subject.trim()) {
            setSubjectError(true);
            return;
        }
        setSubjectError(false);
        const filterStates = selectedFilter === "all"
            ? { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "all" }
            : selectedFilter === "approved"
                ? { statusFilter: "approved", emailSentFilter: "all", whatsappSentFilter: "all" }
                : selectedFilter === "rejected"
                    ? { statusFilter: "rejected", emailSentFilter: "all", whatsappSentFilter: "all" }
                    : selectedFilter === "confirmed"
                        ? { statusFilter: "confirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
                        : selectedFilter === "notConfirmed"
                            ? { statusFilter: "notConfirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
                            : selectedFilter === "pending"
                                ? { statusFilter: "pending", emailSentFilter: "all", whatsappSentFilter: "all" }
                                : selectedFilter === "emailSent"
                                    ? { statusFilter: "all", emailSentFilter: "sent", whatsappSentFilter: "all" }
                                    : selectedFilter === "emailNotSent"
                                        ? { statusFilter: "all", emailSentFilter: "notSent", whatsappSentFilter: "all" }
                                        : selectedFilter === "whatsappSent"
                                            ? { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "sent" }
                                            : { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "notSent" };

        onSendWhatsApp({
            type: emailType,
            subject: emailType === "custom" ? subject : undefined,
            body: emailType === "custom" ? body : undefined,
            file: emailType === "custom" ? attachedFile : undefined,
            ...filterStates,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            dir={dir}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                }}
            >
                {t.title}
                <IconButton onClick={handleClose} size="small">
                    <ICONS.close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Filter Dropdown */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {t.filterByStatus}:
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="all">{t.all}</MenuItem>
                                {isApprovalBased ? (
                                    useApprovedRejected ? (
                                        [
                                            <MenuItem key="approved" value="approved">{t.approved}</MenuItem>,
                                            <MenuItem key="rejected" value="rejected">{t.rejected}</MenuItem>,
                                            <MenuItem key="pending" value="pending">{t.pending}</MenuItem>,
                                            <MenuItem key="emailSent" value="emailSent">{t.emailSent}</MenuItem>,
                                            <MenuItem key="emailNotSent" value="emailNotSent">{t.emailNotSent}</MenuItem>,
                                            <MenuItem key="whatsappSent" value="whatsappSent">{t.whatsappSent}</MenuItem>,
                                            <MenuItem key="whatsappNotSent" value="whatsappNotSent">{t.whatsappNotSent}</MenuItem>,
                                        ]
                                    ) : (
                                        [
                                            <MenuItem key="confirmed" value="confirmed">{t.confirmed}</MenuItem>,
                                            <MenuItem key="notConfirmed" value="notConfirmed">{t.notConfirmed}</MenuItem>,
                                            <MenuItem key="pending" value="pending">{t.pending}</MenuItem>,
                                            <MenuItem key="emailSent" value="emailSent">{t.emailSent}</MenuItem>,
                                            <MenuItem key="emailNotSent" value="emailNotSent">{t.emailNotSent}</MenuItem>,
                                            <MenuItem key="whatsappSent" value="whatsappSent">{t.whatsappSent}</MenuItem>,
                                            <MenuItem key="whatsappNotSent" value="whatsappNotSent">{t.whatsappNotSent}</MenuItem>,
                                        ]
                                    )
                                ) : (
                                    [
                                        <MenuItem key="emailSent" value="emailSent">{t.emailSent}</MenuItem>,
                                        <MenuItem key="emailNotSent" value="emailNotSent">{t.emailNotSent}</MenuItem>,
                                        <MenuItem key="whatsappSent" value="whatsappSent">{t.whatsappSent}</MenuItem>,
                                        <MenuItem key="whatsappNotSent" value="whatsappNotSent">{t.whatsappNotSent}</MenuItem>,
                                    ]
                                )}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {t.messageType}:
                        </Typography>
                        <RadioGroup
                            value={emailType}
                            onChange={(e) => setEmailType(e.target.value)}
                            row={true}
                            sx={{
                                flexDirection: dir === "rtl" ? "row-reverse" : "row",
                                direction: dir,
                                marginLeft: dir === "rtl" ? "auto" : 0,
                                marginRight: dir === "rtl" ? 0 : "auto",
                                width: "fit-content",
                            }}
                        >
                            <FormControlLabel
                                value="default"
                                control={<Radio color="primary" />}
                                label={t.default}
                                labelPlacement={dir === "rtl" ? "start" : "end"}
                                sx={{
                                    direction: dir,
                                    marginRight: dir === "rtl" ? 2 : 0,
                                    marginLeft: dir === "rtl" ? 0 : 2,
                                    "&:first-of-type": {
                                        marginLeft: dir === "rtl" ? 2 : 0,
                                        marginRight: dir === "rtl" ? 0 : 2,
                                    },
                                }}
                            />
                            <FormControlLabel
                                value="custom"
                                control={<Radio color="primary" />}
                                label={t.custom}
                                labelPlacement={dir === "rtl" ? "start" : "end"}
                                sx={{
                                    direction: dir,
                                    marginRight: dir === "rtl" ? 2 : 0,
                                    marginLeft: dir === "rtl" ? 0 : 2,
                                }}
                            />
                        </RadioGroup>
                    </Box>

                    {emailType === "default" && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 1,
                                maxWidth: 520,
                                fontSize: "0.85rem",
                                lineHeight: 1.6,
                            }}
                        >
                            {t.defaultEmailInfo}
                        </Typography>
                    )}

                    {emailType === "custom" && (
                        <>
                            <TextField
                                fullWidth
                                label={t.subject}
                                value={subject}
                                onChange={(e) => {
                                    setSubject(e.target.value);
                                    if (subjectError) {
                                        setSubjectError(false);
                                    }
                                }}
                                placeholder={t.placeholderSubject}
                                required
                                error={subjectError}
                                helperText={subjectError ? "Subject is required" : ""}
                            />

                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                    {t.body}
                                </Typography>
                                <RichTextEditor
                                    value={body}
                                    onChange={setBody}
                                    placeholder={t.placeholderBody}
                                    dir={dir}
                                />
                            </Box>

                            <Box>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="*/*"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        onClick={() => fileInputRef.current?.click()}
                                        size="small"
                                        startIcon={<ICONS.upload />}
                                        sx={getStartIconSpacing(dir)}
                                    >
                                        {t.uploadFile}
                                    </Button>
                                    {attachedFile && (
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {attachedFile.name}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={handleRemoveFile}
                                                color="error"
                                            >
                                                <ICONS.close />
                                            </IconButton>
                                        </Stack>
                                    )}
                                </Stack>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: "block" }}
                                >
                                    {t.uploadHelperText}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: "flex-end",
                    gap: 1,
                    px: 2,
                    py: 2,
                }}
            >
                {emailType === "default" && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<ICONS.whatsapp />}
                        onClick={handleSendWhatsApp}
                        disabled={sendingEmails}
                        sx={getStartIconSpacing(dir)}
                    >
                        {t.sendWhatsApp}
                    </Button>
                )}
                {emailType === "custom" && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<ICONS.whatsapp />}
                        onClick={handleSendWhatsApp}
                        disabled={sendingEmails}
                        sx={getStartIconSpacing(dir)}
                    >
                        {t.sendWhatsApp}
                    </Button>
                )}
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ICONS.email />}
                    onClick={handleSendEmail}
                    disabled={sendingEmails}
                    sx={getStartIconSpacing(dir)}
                >
                    {t.sendEmail}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkEmailModal;

