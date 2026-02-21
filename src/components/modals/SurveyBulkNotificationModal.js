"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import RichTextEditor from "@/components/RichTextEditor";

const translations = {
  en: {
    title: "Send Bulk Survey Notifications",
    audience: "Sending Options",
    allRecipients: "Send to all recipients",
    notResponded: "Send to those who not responded yet",
    subject: "Email Subject",
    body: "Email Body",
    prefillHint: "Set custom subject and body for this notification send.",
    cancel: "Cancel",
    send: "Send Notifications",
  },
  ar: {
    title: "إرسال إشعارات الاستبيان الجماعية",
    audience: "خيارات الإرسال",
    allRecipients: "إرسال إلى جميع المستلمين",
    notResponded: "إرسال إلى الذين لم يردوا بعد",
    subject: "موضوع البريد الإلكتروني",
    body: "نص البريد الإلكتروني",
    prefillHint: "قم بتخصيص الموضوع والنص لعملية الإرسال الحالية.",
    cancel: "إلغاء",
    send: "إرسال الإشعارات",
  },
};

const SurveyBulkNotificationModal = ({
  open,
  onClose,
  onSend,
  sendingEmails = false,
}) => {
  const { t, dir } = useI18nLayout(translations);
  const [recipientScope, setRecipientScope] = useState("not_responded");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    setRecipientScope("not_responded");
    setSubject("");
    setBody("");
  }, [open]);

  const handleClose = () => {
    if (sendingEmails) return;
    onClose?.();
  };

  const handleSend = () => {
    onSend?.({
      recipientScope,
      subject: subject?.trim?.() || "",
      body: body || "",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      dir={dir}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        {t.title}
        <IconButton size="small" onClick={handleClose} disabled={sendingEmails}>
          <ICONS.close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <FormControl>
            <FormLabel>{t.audience}</FormLabel>
            <RadioGroup
              value={recipientScope}
              onChange={(e) => setRecipientScope(e.target.value)}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label={t.allRecipients}
              />
              <FormControlLabel
                value="not_responded"
                control={<Radio />}
                label={t.notResponded}
              />
            </RadioGroup>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {t.prefillHint}
          </Typography>

          <TextField
            fullWidth
            label={t.subject}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {t.body}
            </Typography>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={t.body}
              dir={dir}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={sendingEmails}>
          {t.cancel}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ICONS.email fontSize="small" />}
          onClick={handleSend}
          disabled={sendingEmails}
          sx={getStartIconSpacing(dir)}
        >
          {t.send}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SurveyBulkNotificationModal;
