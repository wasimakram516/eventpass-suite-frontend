import React, { useRef, useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, RadioGroup, FormControlLabel, Radio,
  Button, TextField, Box, Typography, Stack,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import RichTextEditor from "@/components/RichTextEditor";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { sendCheckInSingleNotification } from "@/services/checkin/checkinRegistrationService";

const translations = {
  en: {
    notifyTitle: "Notify",
    default: "Default",
    custom: "Custom",
    reminder: "Reminder",
    subject: "Subject",
    body: "Body",
    placeholderSubject: "Enter email subject",
    placeholderBody: "Enter email body...",
    sendWhatsApp: "Send WhatsApp",
    sendEmail: "Send Email",
    defaultEmailInfo: "When sending default messages, the system will use the default Email and WhatsApp invitation templates.",
    uploadFile: "Upload File",
    uploadHelperText: "Optional: Attach media files (Image, Video, or PDF) to include with your message",
    subjectRequired: "Subject is required",
  },
  ar: {
    notifyTitle: "إشعار",
    default: "الافتراضي",
    custom: "مخصص",
    reminder: "تذكير",
    subject: "الموضوع",
    body: "المحتوى",
    placeholderSubject: "أدخل موضوع البريد الإلكتروني",
    placeholderBody: "أدخل محتوى البريد الإلكتروني...",
    sendWhatsApp: "إرسال عبر واتساب",
    sendEmail: "إرسال بريد إلكتروني",
    defaultEmailInfo: "عند إرسال الرسائل الافتراضية، سيستخدم النظام قوالب الدعوة الافتراضية للبريد الإلكتروني والواتساب.",
    uploadFile: "رفع ملف",
    uploadHelperText: "اختياري: يمكنك إرفاق ملفات الوسائط (صورة أو فيديو أو PDF) لتضمينها مع رسالتك",
    subjectRequired: "الموضوع مطلوب",
  },
};

const SingleNotificationModal = ({ open, onClose, onSent, registration, showReminderOption = false }) => {
  const { t, dir } = useI18nLayout(translations);
  const [notificationType, setNotificationType] = useState("default");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [subjectError, setSubjectError] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setNotificationType("default");
      setSubject("");
      setBody("");
      setSubjectError(false);
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleClose = () => {
    setNotificationType("default");
    setSubject("");
    setBody("");
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

  const handleSend = async (channel) => {
    if (notificationType === "custom" && !subject.trim()) {
      setSubjectError(true);
      return;
    }
    setSubjectError(false);

    // Email has no separate reminder template; emailProcessor infers
    // "is this a reminder" from the recipient's own emailSent flag.
    // WhatsApp has a real, distinct reminder template.
    const type =
      channel === "email"
        ? notificationType === "reminder" ? "default" : notificationType
        : notificationType;

    setSending(true);
    try {
      await sendCheckInSingleNotification(
        registration._id,
        {
          channel,
          type,
          subject: notificationType === "custom" ? subject : undefined,
          body: notificationType === "custom" ? body : undefined,
        },
        notificationType === "custom" ? attachedFile : undefined
      );
      onSent?.(channel);
      handleClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth dir={dir}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {t.notifyTitle} {registration?.fullName || registration?.email}
        <IconButton size="small" onClick={handleClose}><ICONS.close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <RadioGroup
            row
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
          >
            <FormControlLabel value="default" control={<Radio />} label={t.default} />
            <FormControlLabel value="custom" control={<Radio />} label={t.custom} />
            {showReminderOption && (
              <FormControlLabel value="reminder" control={<Radio />} label={t.reminder} />
            )}
          </RadioGroup>

          {notificationType === "default" && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", maxWidth: 480, fontSize: "0.85rem", lineHeight: 1.6 }}
            >
              {t.defaultEmailInfo}
            </Typography>
          )}

          {notificationType === "custom" && (
            <>
              <TextField
                label={t.subject}
                fullWidth
                required
                value={subject}
                error={subjectError}
                helperText={subjectError ? t.subjectRequired : ""}
                placeholder={t.placeholderSubject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (subjectError) setSubjectError(false);
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{t.body}</Typography>
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
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: 1 }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {attachedFile.name}
                      </Typography>
                      <IconButton size="small" onClick={handleRemoveFile} color="error">
                        <ICONS.close />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                  {t.uploadHelperText}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 2, gap: 1 }}>
        {(notificationType === "default" ||
          notificationType === "reminder") && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ICONS.whatsapp />}
              disabled={sending}
              onClick={() => handleSend("whatsapp")}
              sx={getStartIconSpacing(dir)}
            >
              {t.sendWhatsApp}
            </Button>
          )}

        <Button
          variant="contained"
          color="primary"
          startIcon={<ICONS.email />}
          disabled={sending}
          onClick={() => handleSend("email")}
          sx={getStartIconSpacing(dir)}
        >
          {t.sendEmail}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SingleNotificationModal;
