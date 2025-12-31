"use client";

import React, { useState, useRef, useEffect } from "react";
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
    Toolbar,
    Chip,
    CircularProgress,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import { Popover, Select, MenuItem, FormControl } from "@mui/material";

const translations = {
    en: {
        title: "Send Notifications",
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
    },
    ar: {
        title: "إرسال الإشعارات",
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
    },
};

const RichTextEditor = ({ value, onChange, placeholder, dir }) => {
    const editorRef = useRef(null);
    const colorPickerAnchorRef = useRef(null);
    const [activeCommands, setActiveCommands] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
    });
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const updateActiveCommands = () => {
        if (editorRef.current && document.activeElement === editorRef.current) {
            setActiveCommands({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                strikethrough: document.queryCommandState("strikethrough"),
            });
        }
    };

    const handleInput = () => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
        updateActiveCommands();
    };

    const handleFocus = () => {
        updateActiveCommands();
    };

    const executeCommand = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        setTimeout(() => {
            updateActiveCommands();
            handleInput();
        }, 0);
    };

    const handleFontColor = (color) => {
        executeCommand("foreColor", color);
        setColorPickerOpen(false);
    };

    const handleFontSize = (event) => {
        const size = event.target.value;
        executeCommand("fontSize", size);
    };

    return (
        <Box
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                "&:focus-within": {
                    borderColor: "primary.main",
                },
            }}
        >
            <Toolbar
                variant="dense"
                sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    minHeight: "40px !important",
                    bgcolor: "grey.50",
                    gap: 0.5,
                    flexWrap: "wrap",
                    "& .MuiIconButton-root": {
                        padding: "4px",
                    },
                }}
            >
                {/* Text Formatting */}
                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", pr: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("bold")}
                        sx={{
                            bgcolor: activeCommands.bold ? "action.selected" : "transparent",
                        }}
                        title="Bold (Ctrl+B)"
                    >
                        <FormatBoldIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("italic")}
                        sx={{
                            bgcolor: activeCommands.italic ? "action.selected" : "transparent",
                        }}
                        title="Italic (Ctrl+I)"
                    >
                        <FormatItalicIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("underline")}
                        sx={{
                            bgcolor: activeCommands.underline ? "action.selected" : "transparent",
                        }}
                        title="Underline (Ctrl+U)"
                    >
                        <FormatUnderlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("strikethrough")}
                        sx={{
                            bgcolor: activeCommands.strikethrough ? "action.selected" : "transparent",
                        }}
                        title="Strikethrough"
                    >
                        <StrikethroughSIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Font Color */}
                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5 }}>
                    <IconButton
                        size="small"
                        ref={colorPickerAnchorRef}
                        onClick={() => setColorPickerOpen(true)}
                        title="Text Color"
                    >
                        <FormatColorTextIcon fontSize="small" />
                    </IconButton>
                    <Popover
                        open={colorPickerOpen}
                        anchorEl={colorPickerAnchorRef.current}
                        onClose={() => setColorPickerOpen(false)}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                    >
                        <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1 }}>
                            {[
                                "#000000", "#333333", "#666666", "#999999",
                                "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                                "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                                "#FFC0CB", "#A52A2A", "#000080", "#008000",
                            ].map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => handleFontColor(color)}
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        bgcolor: color,
                                        border: "1px solid #ccc",
                                        cursor: "pointer",
                                        "&:hover": { border: "2px solid #000" },
                                    }}
                                />
                            ))}
                        </Box>
                    </Popover>
                </Box>

                {/* Lists */}
                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("insertUnorderedList")}
                        title="Bullet List"
                    >
                        <FormatListBulletedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("insertOrderedList")}
                        title="Numbered List"
                    >
                        <FormatListNumberedIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Alignment */}
                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("justifyLeft")}
                        title="Align Left"
                    >
                        <FormatAlignLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("justifyCenter")}
                        title="Align Center"
                    >
                        <FormatAlignCenterIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("justifyRight")}
                        title="Align Right"
                    >
                        <FormatAlignRightIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("justifyFull")}
                        title="Justify"
                    >
                        <FormatAlignJustifyIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Font Size */}
                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5, alignItems: "center" }}>
                    <FormControl size="small" variant="outlined" sx={{ minWidth: 80 }}>
                        <Select
                            defaultValue={4}
                            onChange={handleFontSize}
                            displayEmpty
                            sx={{
                                height: "32px",
                                fontSize: "0.875rem",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderWidth: "1px",
                                },
                            }}
                        >
                            <MenuItem value={1}>8px</MenuItem>
                            <MenuItem value={2}>10px</MenuItem>
                            <MenuItem value={3}>12px</MenuItem>
                            <MenuItem value={4}>14px</MenuItem>
                            <MenuItem value={5}>18px</MenuItem>
                            <MenuItem value={6}>24px</MenuItem>
                            <MenuItem value={7}>36px</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Clear Formatting */}
                <Box sx={{ display: "flex", gap: 0.5, px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("removeFormat")}
                        title="Clear Formatting"
                    >
                        <FormatClearIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Toolbar>
            <Box
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={handleFocus}
                onMouseUp={updateActiveCommands}
                onKeyUp={updateActiveCommands}
                dir={dir}
                sx={{
                    minHeight: "200px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    p: 2,
                    outline: "none",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "#333",
                    "&:empty:before": {
                        content: `"${placeholder}"`,
                        color: "text.disabled",
                    },
                    // Preserve formatting styles
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
            />
        </Box>
    );
};

const BulkEmailModal = ({
    open,
    onClose,
    onSendEmail,
    onSendWhatsApp,
    sendingEmails = false,
    emailProgress = { sent: 0, failed: 0, processed: 0, total: 0 },
}) => {
    const { t, dir } = useI18nLayout(translations);
    const [emailType, setEmailType] = useState("default");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [subjectError, setSubjectError] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);

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

        const filterStates = selectedFilter === "all"
            ? { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "all" }
            : selectedFilter === "confirmed"
                ? { statusFilter: "confirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
                : selectedFilter === "notConfirmed"
                    ? { statusFilter: "notConfirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
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
        handleClose();
    };

    const handleSendWhatsApp = () => {
        if (emailType === "custom" && !subject.trim()) {
            setSubjectError(true);
            return;
        }
        setSubjectError(false);
        const filterStates = selectedFilter === "all"
            ? { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "all" }
            : selectedFilter === "confirmed"
                ? { statusFilter: "confirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
                : selectedFilter === "notConfirmed"
                    ? { statusFilter: "notConfirmed", emailSentFilter: "all", whatsappSentFilter: "all" }
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
        handleClose();
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
                    {/* Filter Chips - All in one row */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {t.filterByStatus}:
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                            <Chip
                                label={t.all}
                                onClick={() => setSelectedFilter("all")}
                                color={selectedFilter === "all" ? "primary" : "default"}
                                variant={selectedFilter === "all" ? "filled" : "outlined"}
                                clickable
                            />
                            <Chip
                                label={t.confirmed}
                                onClick={() => setSelectedFilter("confirmed")}
                                color={selectedFilter === "confirmed" ? "primary" : "default"}
                                variant={selectedFilter === "confirmed" ? "filled" : "outlined"}
                                clickable
                            />
                            <Chip
                                label={t.notConfirmed}
                                onClick={() => setSelectedFilter("notConfirmed")}
                                color={selectedFilter === "notConfirmed" ? "primary" : "default"}
                                variant={selectedFilter === "notConfirmed" ? "filled" : "outlined"}
                                clickable
                            />
                            <Chip
                                label={t.emailSent}
                                onClick={() => setSelectedFilter("emailSent")}
                                color={selectedFilter === "emailSent" ? "primary" : "default"}
                                variant={selectedFilter === "emailSent" ? "filled" : "outlined"}
                                clickable
                            />
                            <Chip
                                label={t.emailNotSent}
                                onClick={() => setSelectedFilter("emailNotSent")}
                                color={selectedFilter === "emailNotSent" ? "primary" : "default"}
                                variant={selectedFilter === "emailNotSent" ? "filled" : "outlined"}
                                clickable
                            />
                            <Chip
                                label={t.whatsappSent}
                                onClick={() => setSelectedFilter("whatsappSent")}
                                color={selectedFilter === "whatsappSent" ? "primary" : "default"}
                                variant={selectedFilter === "whatsappSent" ? "filled" : "outlined"}
                                clickable
                            />
                            <Chip
                                label={t.whatsappNotSent}
                                onClick={() => setSelectedFilter("whatsappNotSent")}
                                color={selectedFilter === "whatsappNotSent" ? "primary" : "default"}
                                variant={selectedFilter === "whatsappNotSent" ? "filled" : "outlined"}
                                clickable
                            />
                        </Stack>
                    </Box>

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
                    startIcon={
                        sendingEmails ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <ICONS.email />
                        )
                    }
                    onClick={handleSendEmail}
                    disabled={sendingEmails}
                    sx={getStartIconSpacing(dir)}
                >
                    {sendingEmails && emailProgress.total
                        ? `${t.sendEmail} ${emailProgress.processed}/${emailProgress.total}`
                        : sendingEmails
                            ? t.sendEmail
                            : t.sendEmail}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkEmailModal;

